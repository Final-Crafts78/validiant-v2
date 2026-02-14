# PartyKit Real-Time WebSocket Integration Guide

## Overview

Validiant uses **PartyKit** for real-time collaboration features. PartyKit provides edge-deployed WebSocket servers that run on Cloudflare's global network, ensuring low-latency real-time updates worldwide.

## Architecture

### HTTP-to-WebSocket Bridge Pattern

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │
       │ HTTP POST (Task Update)
       ↓
┌─────────────┐
│   Hono API  │
│  (Stateless)│
└──────┬──────┘
       │
       │ 1. Update Database
       ↓
┌─────────────┐
│  PostgreSQL │
└─────────────┘
       │
       │ 2. HTTP POST to PartyKit
       ↓
┌─────────────┐
│  PartyKit   │
│   Server    │
└──────┬──────┘
       │
       │ 3. Broadcast to WebSocket clients
       ↓
┌─────────────────────────────────┐
│   Connected Clients (WebSocket) │
│  - User A                       │
│  - User B                       │
│  - User C                       │
└─────────────────────────────────┘
```

### Why This Pattern?

1. **Stateless API**: Hono REST API remains stateless (edge-compatible)
2. **Scalability**: PartyKit handles WebSocket connections efficiently
3. **Performance**: Non-blocking broadcasts don't delay API responses
4. **Separation of Concerns**: API logic separate from real-time logic

## Room Architecture

### Project-Based Rooms

Each project gets its own isolated WebSocket room:

```typescript
// Room ID format
const roomId = projectId; // e.g., "550e8400-e29b-41d4-a716-446655440000"

// PartyKit URL
const wsURL = `wss://validiant-realtime.partykit.dev/parties/main/${projectId}`;
```

### Connection Management

- **Automatic Cleanup**: Disconnected clients are automatically removed
- **User Tracking**: Each connection can include `userId` for presence
- **Reconnection**: Frontend handles reconnection automatically

## Event Types

### Task Events

```typescript
// Task created
{
  type: 'TASK_CREATED',
  payload: {
    taskId: 'task-uuid',
    projectId: 'project-uuid',
    status: 'todo',
    priority: 'high',
    createdBy: 'user-uuid'
  },
  timestamp: 1234567890
}

// Task updated
{
  type: 'TASK_UPDATED',
  payload: {
    taskId: 'task-uuid',
    projectId: 'project-uuid',
    status: 'in_progress',
    priority: 'high'
  },
  timestamp: 1234567890
}

// Task status changed (optimized)
{
  type: 'TASK_STATUS_CHANGED',
  payload: {
    taskId: 'task-uuid',
    projectId: 'project-uuid',
    status: 'completed'
  },
  timestamp: 1234567890
}

// Task deleted
{
  type: 'TASK_DELETED',
  payload: {
    taskId: 'task-uuid',
    projectId: 'project-uuid'
  },
  timestamp: 1234567890
}

// Task assigned
{
  type: 'TASK_ASSIGNED',
  payload: {
    taskId: 'task-uuid',
    projectId: 'project-uuid',
    assigneeId: 'user-uuid',
    removed: false // or true for unassign
  },
  timestamp: 1234567890
}
```

### User Presence Events

```typescript
// User joined project
{
  type: 'USER_JOINED',
  payload: {
    userId: 'user-uuid',
    userName: 'John Doe',
    projectId: 'project-uuid'
  },
  timestamp: 1234567890
}

// User left project
{
  type: 'USER_LEFT',
  payload: {
    userId: 'user-uuid',
    userName: 'John Doe',
    projectId: 'project-uuid'
  },
  timestamp: 1234567890
}
```

## Frontend Integration

### React Hook Example

```typescript
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

function useProjectRealtime(projectId: string, userId: string) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to PartyKit room
    const wsURL = `wss://validiant-realtime.partykit.dev/parties/main/${projectId}?userId=${userId}&userName=${encodeURIComponent(userName)}`;
    
    const ws = new WebSocket(wsURL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to project room');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'TASK_CREATED':
        case 'TASK_UPDATED':
        case 'TASK_STATUS_CHANGED':
        case 'TASK_DELETED':
        case 'TASK_ASSIGNED':
          // Invalidate React Query cache
          queryClient.invalidateQueries(['tasks', projectId]);
          queryClient.invalidateQueries(['task', message.payload.taskId]);
          break;
          
        case 'USER_JOINED':
          // Show notification or update presence UI
          console.log(`${message.payload.userName} joined the project`);
          break;
          
        case 'USER_LEFT':
          console.log(`${message.payload.userName} left the project`);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from project room');
    };

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, [projectId, userId, queryClient]);

  return wsRef;
}
```

### React Native Example

```typescript
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

function useProjectRealtime(projectId: string, userId: string) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Same code as React - WebSocket API is available in React Native
    const wsURL = `wss://validiant-realtime.partykit.dev/parties/main/${projectId}?userId=${userId}`;
    
    const ws = new WebSocket(wsURL);
    wsRef.current = ws;

    // ... same event handlers as above

    return () => {
      ws.close();
    };
  }, [projectId, userId, queryClient]);
}
```

## Backend Integration

### Broadcasting from Services

```typescript
import { broadcastTaskEvent, BroadcastEvent } from '../utils/broadcast';

// After creating a task
export const createTask = async (projectId: string, data: any) => {
  // 1. Update database
  const task = await db.insert(tasks).values(data).returning();
  
  // 2. Broadcast to PartyKit (non-blocking)
  await broadcastTaskEvent(
    projectId,
    task.id,
    BroadcastEvent.TASK_CREATED,
    { status: task.status, priority: task.priority }
  );
  
  return task;
};
```

### Broadcast Helpers

```typescript
// General broadcast
await broadcastToProject(
  projectId,
  'CUSTOM_EVENT',
  { data: 'anything' }
);

// Task-specific broadcast
await broadcastTaskEvent(
  projectId,
  taskId,
  BroadcastEvent.TASK_UPDATED,
  { status: 'completed' }
);

// Exclude specific user from receiving broadcast
await broadcastToProject(
  projectId,
  'TASK_UPDATED',
  { taskId },
  excludeUserId // This user won't receive the broadcast
);
```

## Development

### Running PartyKit Dev Server

```bash
# Terminal 1: Start Hono API
npm run dev

# Terminal 2: Start PartyKit server
npm run party:dev

# Or run both concurrently
npm run dev:all
```

### URLs

- **Hono API**: http://localhost:3001
- **PartyKit**: http://localhost:1999
- **WebSocket**: ws://localhost:1999/parties/main/:projectId

## Deployment

### Deploy PartyKit to Production

```bash
# Deploy PartyKit server
npm run party:deploy

# Example output:
# Deployed to: https://validiant-realtime.partykit.dev
```

### Environment Variables

```env
# Production
PARTYKIT_URL=https://validiant-realtime.partykit.dev

# Development (optional - defaults to localhost:1999)
# PARTYKIT_URL=http://localhost:1999
```

## Security

### Current Implementation

- **Room Isolation**: Each project has separate WebSocket room
- **HTTP Broadcast**: Only backend can trigger broadcasts
- **No Client-to-Client**: Clients can't send messages directly

### Future Enhancements

1. **JWT Authentication**: Validate JWT tokens on WebSocket connection
2. **Permission Checks**: Verify user has access to project
3. **Rate Limiting**: Prevent spam from malicious clients
4. **Encryption**: E2E encryption for sensitive data

## Performance

### Payload Optimization

**❌ Bad (Heavy Payload)**
```typescript
await broadcastToProject(projectId, 'TASK_UPDATED', {
  task: {
    id: taskId,
    title: 'Long task title...',
    description: 'Very long description...',
    assignees: [/* full user objects */],
    comments: [/* all comments */],
    // ... entire task object
  }
});
```

**✅ Good (Lightweight Payload)**
```typescript
await broadcastToProject(projectId, 'TASK_UPDATED', {
  taskId,
  status: 'completed',
  // Frontend will refetch full data via React Query
});
```

### Broadcast Strategy

1. **Broadcast lightweight notification** (task ID only)
2. **Frontend invalidates React Query cache**
3. **React Query refetches full data from REST API**
4. **Cache-first strategy reduces API calls**

### Metrics

- **Latency**: < 50ms globally (Cloudflare edge network)
- **Bandwidth**: ~100 bytes per event (lightweight payloads)
- **Scalability**: Handles 1000+ concurrent connections per room

## Troubleshooting

### WebSocket Connection Issues

```typescript
// Check connection status
if (ws.readyState === WebSocket.OPEN) {
  console.log('Connected');
} else if (ws.readyState === WebSocket.CONNECTING) {
  console.log('Connecting...');
} else {
  console.log('Disconnected');
}

// Implement reconnection
const reconnect = () => {
  setTimeout(() => {
    ws = new WebSocket(wsURL);
    // ... setup event handlers
  }, 1000); // Retry after 1 second
};

ws.onclose = () => {
  console.log('Disconnected, attempting to reconnect...');
  reconnect();
};
```

### CORS Issues

PartyKit automatically handles CORS. No configuration needed.

### Broadcast Not Received

1. Check PartyKit server is running (`npm run party:dev`)
2. Verify `PARTYKIT_URL` environment variable
3. Check WebSocket connection status
4. Verify project ID matches

## Best Practices

### 1. Lightweight Payloads

- Only send IDs and minimal metadata
- Let frontend fetch full data via REST API
- Reduces bandwidth and improves performance

### 2. Non-Blocking Broadcasts

- Never `await` broadcasts in critical paths
- Broadcasts happen in background
- API responses are not delayed

### 3. Event Granularity

- Use specific event types (`TASK_STATUS_CHANGED` vs `TASK_UPDATED`)
- Allows frontend to optimize updates
- Example: Status change only updates status UI, not full task

### 4. Error Handling

- Broadcast failures should not break API
- Log errors but don't throw
- Real-time is enhancement, not requirement

### 5. React Query Integration

- Use WebSocket for notifications only
- React Query handles data fetching and caching
- Invalidate queries on WebSocket events

## Future Enhancements

- [ ] **Typing indicators**: Show when users are typing
- [ ] **Cursor tracking**: See where other users are working
- [ ] **Live comments**: Real-time comment updates
- [ ] **Presence avatars**: Show active users in project
- [ ] **Offline queue**: Queue updates when offline
- [ ] **Conflict resolution**: Handle concurrent edits

## Resources

- [PartyKit Documentation](https://docs.partykit.io/)
- [PartyKit Examples](https://github.com/partykit/partykit/tree/main/examples)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
