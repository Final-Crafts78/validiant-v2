# Mobile Integration Guide - React Native App

## Overview

Validiant's React Native mobile app uses JWT tokens with SecureStore for authentication and maintains feature parity with the web app through identical data patterns.

## Architecture

### Stack

- **Framework**: React Native (Expo)
- **Authentication**: JWT Tokens (SecureStore)
- **Data Fetching**: TanStack Query (React Query)
- **Real-Time**: PartyKit WebSockets
- **API Client**: Axios with JWT injection
- **Secure Storage**: expo-secure-store

## Dual-Auth Pattern

### Backend Support

The backend supports **both** authentication methods:

**Web App (HttpOnly Cookies):**
```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "user@example.com", "password": "pass" }

↓

Set-Cookie: accessToken=...; HttpOnly; Secure
Set-Cookie: refreshToken=...; HttpOnly; Secure

{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",  // Web ignores this
    "refreshToken": "eyJhbGc..." // Web ignores this
  }
}
```

**Mobile App (JWT Tokens):**
```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "user@example.com", "password": "pass" }

↓

{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",  // Mobile uses this!
    "refreshToken": "eyJhbGc..." // Mobile uses this!
  }
}
```

### Why Not HttpOnly Cookies on Mobile?

**HttpOnly cookies don't work well on mobile:**
- React Native's network stack doesn't support HttpOnly cookies natively
- Requires complex cookie management libraries
- Inconsistent behavior across iOS/Android
- WebView-only feature (not native networking)

**JWT tokens with SecureStore is the mobile standard:**
- Hardware-backed encryption (iOS Keychain, Android Keystore)
- Native platform support
- Survives app updates
- Industry best practice for mobile apps

## Authentication Flow

```
1. USER LOGIN
   │
   ├── POST /api/v1/auth/login { email, password }
   │
   └── BACKEND:
       ├── Validates credentials
       ├── Generates JWT tokens
       ├── Sets HttpOnly cookies (for web)
       └── Returns tokens in JSON (for mobile)

2. MOBILE APP
   │
   ├── Extracts { accessToken, refreshToken } from JSON
   │
   └── Saves to SecureStore (hardware-encrypted)
       ├── iOS: Keychain Services
       └── Android: Keystore

3. API REQUESTS
   │
   ├── Request interceptor retrieves accessToken from SecureStore
   │
   ├── Injects: Authorization: Bearer <accessToken>
   │
   └── API validates JWT and processes request

4. TOKEN REFRESH (Auto)
   │
   ├── API returns 401 (token expired)
   │
   ├── Interceptor gets refreshToken from SecureStore
   │
   ├── POST /api/v1/auth/refresh with Bearer <refreshToken>
   │
   ├── Backend returns new accessToken
   │
   ├── Save new accessToken to SecureStore
   │
   └── Retry original request with new token

5. LOGOUT
   │
   ├── POST /api/v1/auth/logout (adds tokens to denylist)
   │
   └── Delete tokens from SecureStore
```

## SecureStore Implementation

### Storage Operations

```typescript
import { saveTokens, getAccessToken, clearTokens } from '@/utils/storage';

// After login
const { accessToken, refreshToken } = response.data.data;
await saveTokens(accessToken, refreshToken);

// For API requests (automatic via interceptor)
const token = await getAccessToken();

// On logout
await clearTokens();
```

### Security Features

| Feature | iOS | Android |
|---------|-----|----------|
| Hardware encryption | Keychain Services | Keystore |
| Encrypted at rest | ✅ Yes | ✅ Yes |
| Biometric protection | ✅ Optional | ✅ Optional |
| Survives app updates | ✅ Yes | ✅ Yes |
| Accessible by other apps | ❌ No | ❌ No |

## Automatic Token Refresh

### How It Works

The mobile API client **automatically** handles token refresh:

```typescript
// You write this:
const response = await get('/api/v1/projects');

// Interceptor handles this automatically:
if (response.status === 401) {
  // 1. Get refresh token from SecureStore
  const refreshToken = await getRefreshToken();
  
  // 2. Request new access token
  const newAccessToken = await refreshAccessToken(refreshToken);
  
  // 3. Save new access token
  await saveAccessToken(newAccessToken);
  
  // 4. Retry original request
  return retry(originalRequest, newAccessToken);
}
```

**You never need to manually refresh tokens!** 🎉

### Refresh Token Expiration

If refresh token is expired (after 7 days):
```typescript
// Interceptor detects refresh failure
if (refreshFailed) {
  // 1. Clear all tokens from SecureStore
  await clearTokens();
  
  // 2. Navigate to login screen
  navigation.navigate('Login');
}
```

## Data Fetching with React Query

### Basic Usage

```typescript
import { useTasks } from '@/hooks/useTasks';
import { TaskStatus } from '@/hooks/useTasks';

function TaskList({ projectId }: { projectId: string }) {
  const { data: tasks, isLoading, error } = useTasks(projectId);
  
  if (isLoading) {
    return <ActivityIndicator />;
  }
  
  if (error) {
    return <ErrorView error={error} />;
  }
  
  return (
    <FlatList
      data={tasks}
      renderItem={({ item }) => <TaskCard task={item} />}
      keyExtractor={(item) => item.id}
    />
  );
}
```

### Optimistic Updates (Drag-and-Drop)

```typescript
import { useUpdateTask } from '@/hooks/useTasks';
import { TaskStatus } from '@/hooks/useTasks';

function KanbanBoard({ projectId }: { projectId: string }) {
  const { data: tasks } = useTasks(projectId);
  const updateTask = useUpdateTask();
  
  const handleDrop = (taskId: string, newStatus: TaskStatus) => {
    // UI updates INSTANTLY (before API call)
    updateTask.mutate({
      taskId,
      projectId,
      data: { status: newStatus },
    });
    // ✅ Task moves immediately
    // ✅ API updates in background
    // ✅ If API fails, task snaps back
  };
  
  return (
    <View style={styles.board}>
      <Column status="todo" tasks={todoTasks} onDrop={handleDrop} />
      <Column status="in_progress" tasks={inProgressTasks} onDrop={handleDrop} />
      <Column status="completed" tasks={completedTasks} onDrop={handleDrop} />
    </View>
  );
}
```

**Zero-latency UX on mobile!** 📱⚡

## Real-Time with PartyKit

### Basic Usage

```typescript
import { useProjectRealtime } from '@/hooks/useProjectRealtime';

function ProjectBoard({ projectId, userId, userName }: Props) {
  const { data: tasks } = useTasks(projectId);
  const { onlineUsers, isConnected } = useProjectRealtime(
    projectId,
    userId,
    userName
  );
  
  return (
    <View>
      <View style={styles.header}>
        <Text>Project Board</Text>
        {isConnected && <Text>🟋️ Connected</Text>}
      </View>
      
      <View style={styles.presence}>
        <Text>Online: {onlineUsers.length}</Text>
        {onlineUsers.map(user => (
          <Avatar key={user.userId} name={user.userName} />
        ))}
      </View>
      
      <TaskList tasks={tasks} />
    </View>
  );
}
```

### Automatic Updates

PartySocket + React Query = **Automatic real-time updates**:

```
USER A (Mobile): Updates task
  ↓
  API updates database
  ↓
  Backend broadcasts to PartyKit
  ↓
  PartyKit sends to all connected clients
  ↓
USER B (Mobile):
  ├── useProjectRealtime receives event
  ├── Invalidates React Query cache
  ├── React Query refetches data
  └── UI updates automatically
      └── USER B sees USER A's change!
```

**No manual refetching needed!** 🎉

## Cross-Platform Consistency

### Identical Hook APIs

Mobile and web use **identical** hook signatures:

```typescript
// Web App
import { useTasks } from '@/hooks/useTasks';

// Mobile App
import { useTasks } from '@/hooks/useTasks';

// Same API!
const { data: tasks } = useTasks(projectId);
```

### Shared Type Definitions

```typescript
// Shared package: @validiant/shared
export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  // ...
}

// Used by both web and mobile
import { Task } from '@validiant/shared';
```

## Environment Configuration

Create `app.config.ts`:

```typescript
import 'dotenv/config';

export default {
  expo: {
    name: 'Validiant',
    slug: 'validiant',
    // ...
    extra: {
      apiUrl: process.env.API_URL || 'http://localhost:3001',
      partyKitUrl: process.env.PARTYKIT_URL || 'localhost:1999',
      eas: {
        projectId: 'your-project-id',
      },
    },
  },
};
```

## Best Practices

### 1. Always Use SecureStore for Tokens

❌ **Don't:**
```typescript
// NEVER store tokens in AsyncStorage!
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('token', accessToken); // ❌ INSECURE!
```

✅ **Do:**
```typescript
// Always use SecureStore
import { saveAccessToken } from '@/utils/storage';
await saveAccessToken(accessToken); // ✅ SECURE!
```

### 2. Trust the Auto-Refresh

You never need to manually refresh tokens:

```typescript
// ❌ Don't do this:
if (isTokenExpired(accessToken)) {
  await refreshToken();
}

// ✅ Just make the request:
const response = await get('/api/v1/data');
// Interceptor handles refresh automatically!
```

### 3. Use Optimistic Updates for UX

```typescript
// For instant feedback:
useUpdateTask() // ✅ Optimistic
useCreateTask() // ✅ Optimistic
useDeleteTask() // ✅ Optimistic
```

## Troubleshooting

### Authentication Issues

**Problem**: API returns 401 even after login

**Solution**:
1. Check if tokens are saved: `await getTokens()`
2. Verify API_URL in app.config.ts
3. Check interceptor is injecting tokens (enable logging)
4. Verify backend is returning tokens in JSON

### Real-Time Issues

**Problem**: Not receiving real-time updates

**Solution**:
1. Check `PARTYKIT_URL` in app.config.ts
2. Verify PartyKit server is running
3. Check connection state: `isConnected`
4. Enable WebSocket logging in PartyKit

### SecureStore Issues

**Problem**: SecureStore.setItemAsync fails

**Solution**:
1. iOS: Check keychain access permissions
2. Android: Verify device has hardware keystore
3. Simulator: May have limited keystore support
4. Try on real device

## Resources

- [Expo SecureStore Docs](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [PartyKit Docs](https://docs.partykit.io/)
- [React Native Docs](https://reactnative.dev/)
