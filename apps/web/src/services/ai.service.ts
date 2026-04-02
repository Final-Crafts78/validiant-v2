import { post } from '@/lib/api';
import type { APIResponse } from '@/lib/api';

export interface AISummaryResponse {
  summary: string;
  source: string;
}

export const summarizeTask = async (
  taskId: string
): Promise<AISummaryResponse> => {
  return post<APIResponse<AISummaryResponse>>(
    `/ai/summarize/${taskId}`,
    {}
  ).then((res) => {
    if (!res.data.data) throw new Error('Summarization failed');
    return res.data.data;
  });
};
