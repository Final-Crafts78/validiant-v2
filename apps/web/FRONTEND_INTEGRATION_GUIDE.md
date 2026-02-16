# Frontend Integration Guide - Next.js Web App

## Overview

Validiant's Next.js frontend uses modern patterns for authentication, data fetching, and real-time collaboration.

## Architecture

### Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: HttpOnly Cookies (XSS Immune)
- **Data Fetching**: TanStack Query (React Query)
- **Real-Time**: PartyKit WebSockets
- **API Client**: Axios with credentials
- **State Management**: React Query + Zustand (minimal)

## Authentication Pattern: HttpOnly Cookies

### Why HttpOnly Cookies?

**❌ Traditional JWT (LocalStorage/SessionStorage):**

```typescript
// VULNERABLE TO XSS!
const token = localStorage.getItem('jwt');
fetch('/api/data', {
  headers: { Authorization: `Bearer ${token}` },
});
```

If attacker injects JavaScript, they can steal the token:

```javascript
// Malicious code
const token = localStorage.getItem('jwt');
sendToAttacker(token); // ❌ Game over
```

**✅ HttpOnly Cookies:**

```typescript
// IMMUNE TO XSS! 🔒
// No token in JavaScript
// Cookies sent automatically
fetch('/api/data', {
  credentials: 'include', // Sends HttpOnly cookies
});
```

Even if attacker injects JavaScript, they CANNOT access the cookie:

```javascript
// Malicious code
const token = document.cookie; // Empty! HttpOnly blocks access
// ✅ Token is safe
```

### Authentication Flow

```
1. USER LOGIN
   │
   ├── POST /api/v1/auth/login { email, password }
   │
   └── BACKEND:
       ├── Validates credentials
       ├── Generates JWT
       └── Sets HttpOnly cookie: Set-Cookie: jwt=...; HttpOnly; Secure; SameSite=Strict

2. FRONTEND CHECKS AUTH
   │
   ├── useAuth() hook calls GET /api/v1/auth/me
   │
   └── BACKEND:
       ├── Reads HttpOnly cookie automatically
       ├── Validates JWT
       └── Returns user data { user: { id, email, fullName, ... } }

3. ALL API REQUESTS
   │
   ├── withCredentials: true (configured globally)
   │
   └── Browser automatically includes HttpOnly cookies
       └── No manual token management needed!

4. USER LOGOUT
   │
   ├── POST /api/v1/auth/logout
   │
   └── BACKEND:
       └── Clears HttpOnly cookie: Set-Cookie: jwt=; Max-Age=0
```

### Using useAuth Hook

```tsx
import { useAuth, useRequireAuth, useOptionalAuth } from '@/hooks/useAuth';

// Protected Page (redirect if not authenticated)
function DashboardPage() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // User is guaranteed to be authenticated here
  return (
    <div>
      <h1>Welcome, {user.fullName}!</h1>
      <ProjectList userId={user.id} />
    </div>
  );
}

// Public Page (show different content for authenticated users)
function HomePage() {
  const { user, isAuthenticated } = useOptionalAuth();

  return (
    <div>
      <h1>Welcome to Validiant</h1>
      {isAuthenticated ? (
        <Link href="/dashboard">Go to Dashboard</Link>
      ) : (
        <Link href="/login">Login</Link>
      )}
    </div>
  );
}

// Manual Auth Check
function Header() {
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();

  return (
    <header>
      {isAuthenticated ? (
        <>
          <span>Hello, {user.fullName}</span>
          <button onClick={() => logout()} disabled={isLoggingOut}>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </>
      ) : (
        <Link href="/login">Login</Link>
      )}
    </header>
  );
}
```

## Data Fetching: React Query

### Basic Usage

```tsx
import { useTasks } from '@/hooks/useTasks';
import { TaskStatus } from '@/hooks/useTasks';

function TaskList({ projectId }: { projectId: string }) {
  // Fetch tasks with React Query
  const {
    data: tasks,
    isLoading,
    error,
  } = useTasks(projectId, {
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
  });

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <ul>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </ul>
  );
}
```

### Mutations (Create, Update, Delete)

```tsx
import { useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';

function TaskForm({ projectId }: { projectId: string }) {
  const createTask = useCreateTask();

  const handleSubmit = (data: CreateTaskData) => {
    createTask.mutate(
      { projectId, data },
      {
        onSuccess: (newTask) => {
          console.log('Task created:', newTask.id);
          // React Query automatically refetches task list
        },
        onError: (error) => {
          console.error('Failed to create task:', error);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={createTask.isPending}>
        {createTask.isPending ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  );
}
```

## Optimistic Updates: Zero-Latency UX

### The Problem

**Without Optimistic Updates:**

```
User drags task → Wait for API → UI updates (500ms delay)
                     ▼
                 ❌ FEELS SLOW
```

**With Optimistic Updates:**

```
User drags task → UI updates instantly (0ms) → API in background
                     ▼
                 ✅ FEELS INSTANT!
```

### Implementation

```tsx
import { useUpdateTask } from '@/hooks/useTasks';
import { TaskStatus } from '@/hooks/useTasks';

function KanbanBoard({ projectId }: { projectId: string }) {
  const { data: tasks } = useTasks(projectId);
  const updateTask = useUpdateTask();

  // Handle drag-and-drop
  const handleDrop = (taskId: string, newStatus: TaskStatus) => {
    // UI updates INSTANTLY (before API call)
    updateTask.mutate({
      taskId,
      projectId,
      data: { status: newStatus },
    });
    // ✅ Task moves to new column immediately
    // ✅ API updates database in background
    // ✅ If API fails, task snaps back (rollback)
  };

  return (
    <div className="kanban-board">
      <Column status="todo" tasks={tasks.filter((t) => t.status === 'todo')} />
      <Column
        status="in_progress"
        tasks={tasks.filter((t) => t.status === 'in_progress')}
      />
      <Column
        status="completed"
        tasks={tasks.filter((t) => t.status === 'completed')}
      />
    </div>
  );
}
```

### How It Works

The `useUpdateTask` hook implements optimistic updates:

```typescript
// 1. onMutate: Update cache immediately (before API)
const previousTask = getQueryData(queryKeys.tasks.detail(taskId));
setQueryData(queryKeys.tasks.detail(taskId), {
  ...previousTask,
  status: newStatus, // ✅ UI updates instantly!
});

// 2. API call happens in background
await api.patch(`/tasks/${taskId}`, { status: newStatus });

// 3. onError: Rollback if API fails
if (error) {
  setQueryData(queryKeys.tasks.detail(taskId), previousTask);
  // ❌ Task snaps back to original column
}

// 4. onSuccess: Refresh from server
queryClient.invalidateQueries(queryKeys.tasks.detail(taskId));
// ✅ Fetch fresh data to sync with server
```

## Real-Time: PartyKit WebSockets

### Basic Usage

```tsx
import { useProjectRealtime } from '@/hooks/useProjectRealtime';

function ProjectBoard({ projectId }: { projectId: string }) {
  const { data: tasks } = useTasks(projectId);
  const { onlineUsers, isConnected } = useProjectRealtime(projectId);

  return (
    <div>
      <header>
        <h1>Project Board</h1>
        <div>
          {isConnected ? (
            <span>🟋️ Connected</span>
          ) : (
            <span>⏳ Connecting...</span>
          )}
        </div>

        <div>
          <h3>Online Now ({onlineUsers.length})</h3>
          {onlineUsers.map((user) => (
            <Avatar key={user.userId} name={user.userName} />
          ))}
        </div>
      </header>

      <TaskList tasks={tasks} />
    </div>
  );
}
```

### Automatic Updates

**No manual refetching needed!** The hook handles everything:

```
USER A: Updates task status
  │
  └── POST /api/v1/tasks/:id (update status)
      │
      └── Backend broadcasts: { type: 'TASK_STATUS_CHANGED', payload: { taskId } }
          │
          └── PartyKit sends to all connected users
              │
              └── USER B's useProjectRealtime hook:
                  ├── Receives event
                  ├── Invalidates React Query cache
                  ├── React Query refetches task
                  └── UI updates automatically
                      └── ✅ USER B sees USER A's change instantly!
```

### Connection Management

PartySocket (NOT raw WebSocket) handles:

- **Automatic reconnection** with exponential backoff
- **Connection state** tracking
- **Message queuing** during disconnection
- **Ping/pong** keep-alive

No manual WebSocket code needed! 🚀

## Best Practices

### 1. Always Use Hooks

❌ **Don't:**

```typescript
// Manual API calls
const response = await fetch('/api/tasks');
const data = await response.json();
setTasks(data);
```

✅ **Do:**

```typescript
// Use React Query hooks
const { data: tasks } = useTasks(projectId);
```

### 2. Leverage Caching

```typescript
// React Query caches automatically
const { data: task1 } = useTask('task-123'); // API call
const { data: task2 } = useTask('task-123'); // Cache hit (no API call)
```

### 3. Optimistic Updates for UX

Use optimistic updates for:

- Drag-and-drop
- Status changes
- Priority changes
- Assignee changes

Don't use for:

- Creating entities (need server-generated ID)
- Complex validations
- File uploads

### 4. Real-Time Only for Presence

Use WebSockets for:

- User presence (who's online)
- Live collaboration indicators
- Notification triggers

Don't use for:

- Heavy data transfer (use REST API)
- Initial data loading (use React Query)
- File uploads (use direct upload)

### 5. Error Handling

```typescript
const updateTask = useUpdateTask();

updateTask.mutate(
  { taskId, projectId, data },
  {
    onSuccess: () => {
      toast.success('Task updated!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  }
);
```

## Environment Variables

Create `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# PartyKit Configuration (Development)
# NEXT_PUBLIC_PARTYKIT_URL=localhost:1999

# PartyKit Configuration (Production)
NEXT_PUBLIC_PARTYKIT_URL=validiant-realtime.partykit.dev
```

## Troubleshooting

### Authentication Issues

**Problem**: useAuth returns null even after login

**Solution**:

1. Check `withCredentials: true` in API client
2. Verify CORS headers allow credentials
3. Check cookies in DevTools (Application tab)
4. Ensure backend sets `SameSite` and `Secure` correctly

### Real-Time Issues

**Problem**: WebSocket not connecting

**Solution**:

1. Check `NEXT_PUBLIC_PARTYKIT_URL` environment variable
2. Verify PartyKit server is running (`npm run party:dev`)
3. Check browser console for WebSocket errors
4. Ensure no firewall blocking WebSocket connections

**Problem**: Not receiving real-time updates

**Solution**:

1. Check connection state: `isConnected`
2. Verify user is in the same project room
3. Check browser console for message parsing errors
4. Ensure backend is broadcasting events

### Performance Issues

**Problem**: Too many API calls

**Solution**:

1. Increase `staleTime` in React Query config
2. Use pagination for large lists
3. Disable `refetchOnWindowFocus` if not needed
4. Use `enabled: false` for conditional queries

## Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [PartyKit Docs](https://docs.partykit.io/)
- [Next.js Docs](https://nextjs.org/docs)
- [Axios Docs](https://axios-http.com/)
