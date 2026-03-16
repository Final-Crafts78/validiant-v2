/**
 * AI Routes (Phase 16)
 *
 * Edge AI capabilities using Cloudflare Workers AI binding.
 * Provides task summarization and intelligent insights.
 */

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';

const aiRoutes = new Hono();

/**
 * POST /api/v1/ai/summarize/:taskId
 * Generate an AI summary for a task using Workers AI (LLM).
 * Falls back to extractive summarization if AI binding is unavailable.
 */
aiRoutes.post('/summarize/:taskId', async (c) => {
  try {
    const taskId = c.req.param('taskId');

    // Fetch task details
    const [task] = await db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.id, taskId))
      .limit(1);

    if (!task) {
      return c.json({ success: false, error: 'Task not found' }, 404);
    }

    // Fetch comments for context
    const comments = await db
      .select()
      .from(schema.taskComments)
      .where(eq(schema.taskComments.taskId, taskId));

    // Build prompt
    const contextText = [
      `Task: ${task.title}`,
      task.description ? `Description: ${task.description}` : '',
      `Status: ${task.status}`,
      `Priority: ${task.priority}`,
      task.clientName ? `Client: ${task.clientName}` : '',
      task.address ? `Address: ${task.address}` : '',
      comments.length > 0
        ? `Comments:\n${comments.map((cc: { content: string }) => `- ${cc.content}`).join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    // Try Workers AI binding
    const ai = (c.env as Record<string, unknown>).AI;
    if (ai && typeof (ai as { run: unknown }).run === 'function') {
      const result = await (
        ai as {
          run: (model: string, input: unknown) => Promise<{ response: string }>;
        }
      ).run('@cf/meta/llama-2-7b-chat-int8', {
        messages: [
          {
            role: 'system',
            content:
              'You are a task management assistant. Summarize the following task in 2-3 concise sentences.',
          },
          { role: 'user', content: contextText },
        ],
      });

      return c.json({
        success: true,
        data: { summary: result.response, source: 'workers-ai' },
      });
    }

    // Fallback: simple extractive summary
    const summary =
      `${task.title} (${task.status}, ${task.priority} priority)` +
      (task.clientName ? ` for ${task.clientName}` : '') +
      (comments.length > 0 ? `. ${comments.length} comment(s) logged.` : '.');

    return c.json({
      success: true,
      data: { summary, source: 'extractive-fallback' },
    });
  } catch (error) {
    console.error('AI summarize error:', error);
    return c.json({ success: false, error: 'Summarization failed' }, 500);
  }
});

export default aiRoutes;
