# Code Style Guide

## General Principles

1. **Clarity over cleverness**: Write code that's easy to understand
2. **Consistency**: Follow existing patterns in the codebase
3. **Type safety**: Always use TypeScript types, avoid `any`
4. **Small functions**: Keep functions focused and under 50 lines
5. **Meaningful names**: Use descriptive variable and function names

## TypeScript Guidelines

### Use Explicit Types

```typescript
// Good
const getUserById = (id: string): Promise<User> => {
  return api.get(`/users/${id}`);
};

// Avoid
const getUserById = (id: any) => {
  return api.get(`/users/${id}`);
};
```

### Avoid `any`

```typescript
// Good
interface ApiResponse<T> {
  data: T;
  success: boolean;
}

// Avoid
interface ApiResponse {
  data: any;
  success: boolean;
}
```

### Use Interfaces for Objects

```typescript
// Good
interface User {
  id: string;
  email: string;
  name: string;
}

// Use type for unions
type Status = 'pending' | 'completed' | 'failed';
```

## Naming Conventions

### Variables and Functions

- Use camelCase: `getUserData`, `isValid`, `handleClick`
- Boolean variables start with `is`, `has`, `should`: `isLoading`, `hasError`
- Event handlers start with `handle`: `handleSubmit`, `handleChange`

### Components

- Use PascalCase: `UserProfile`, `TaskList`, `NavigationBar`
- One component per file
- File name matches component name

### Constants

- Use UPPER_SNAKE_CASE: `API_URL`, `MAX_FILE_SIZE`

### Files and Folders

- Use kebab-case: `user-profile.tsx`, `api-client.ts`
- Group related files in folders

## React/React Native Guidelines

### Component Structure

```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Button } from '@validiant/ui';

// 2. Types/Interfaces
interface UserProfileProps {
  userId: string;
  onUpdate?: () => void;
}

// 3. Component
export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  // 3a. Hooks
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 3b. Effects
  useEffect(() => {
    loadUser();
  }, [userId]);

  // 3c. Event Handlers
  const handleUpdate = async () => {
    // ...
  };

  // 3d. Helper Functions
  const loadUser = async () => {
    // ...
  };

  // 3e. Render
  return (
    <View>
      <Text>{user?.name}</Text>
      <Button onPress={handleUpdate}>Update</Button>
    </View>
  );
};
```

### Use Functional Components

```typescript
// Good
export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  return <View>{/* ... */}</View>;
};

// Avoid class components
class TaskCard extends React.Component {
  // ...
}
```

### Extract Complex Logic to Custom Hooks

```typescript
// Good
const useTaskManager = (projectId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTasks = async () => {
    // ...
  };

  return { tasks, loading, loadTasks };
};

// Use in component
const TaskList = ({ projectId }) => {
  const { tasks, loading, loadTasks } = useTaskManager(projectId);
  // ...
};
```

## API and Backend Guidelines

### Controller Structure

```typescript
// controllers/task-controller.ts
import { Request, Response } from 'express';
import { TaskService } from '../services/task-service';
import { ApiResponse } from '../types/api';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  getTasks = async (req: Request, res: Response): Promise<void> => {
    try {
      const tasks = await this.taskService.getAllTasks();
      const response: ApiResponse<Task[]> = {
        success: true,
        data: tasks,
      };
      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch tasks' },
      });
    }
  };
}
```

### Use Async/Await

```typescript
// Good
const fetchUser = async (id: string): Promise<User> => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch user');
  }
};

// Avoid callbacks
const fetchUser = (id: string, callback: (user: User) => void) => {
  api.get(`/users/${id}`).then((response) => {
    callback(response.data);
  });
};
```

## Comments

### When to Comment

- Complex algorithms
- Non-obvious business logic
- Workarounds or hacks
- TODOs

### When NOT to Comment

```typescript
// Bad - obvious
// Increment counter by 1
counter++;

// Good - explains why
// Increment to skip the header row
counter++;
```

### JSDoc for Public APIs

```typescript
/**
 * Fetches user by ID from the API
 * @param userId - The unique identifier of the user
 * @returns Promise resolving to User object
 * @throws {ApiError} When user is not found
 */
export const getUserById = async (userId: string): Promise<User> => {
  // ...
};
```

## Error Handling

### Use Custom Error Classes

```typescript
// types/errors.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Usage
throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
```

### Always Handle Errors

```typescript
// Good
const loadData = async () => {
  try {
    const data = await fetchData();
    setData(data);
  } catch (error) {
    console.error('Failed to load data:', error);
    setError(error.message);
  }
};
```

## Testing

### Test File Naming

- Unit tests: `user-service.test.ts`
- Integration tests: `auth-api.integration.test.ts`
- E2E tests: `login-flow.e2e.test.ts`

### Test Structure

```typescript
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = '123';
      const expectedUser = { id: userId, name: 'John' };

      // Act
      const user = await userService.getUserById(userId);

      // Assert
      expect(user).toEqual(expectedUser);
    });

    it('should throw error when user not found', async () => {
      // ...
    });
  });
});
```

## Performance

### Memoization

```typescript
// Use React.memo for components
export const TaskCard = React.memo<TaskCardProps>(({ task }) => {
  // ...
});

// Use useMemo for expensive computations
const sortedTasks = useMemo(() => {
  return tasks.sort((a, b) => a.priority - b.priority);
}, [tasks]);

// Use useCallback for functions
const handleDelete = useCallback(
  (taskId: string) => {
    deleteTask(taskId);
  },
  [deleteTask]
);
```

## Security

### Never Expose Secrets

```typescript
// Bad
const API_KEY = 'sk_live_123456';

// Good
const API_KEY = process.env.API_KEY;
```

### Validate Input

```typescript
import { z } from 'zod';

const TaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
});

const createTask = async (data: unknown) => {
  const validData = TaskSchema.parse(data);
  // ...
};
```

## Git Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add task filtering
fix: resolve login redirect issue
docs: update API documentation
refactor: simplify user service
test: add unit tests for task service
chore: update dependencies
```

## Automated Tools

We use these tools to enforce code quality:

- **ESLint**: Catches code issues
- **Prettier**: Formats code consistently
- **TypeScript**: Type checking
- **Husky**: Pre-commit hooks

Run before committing:

```bash
npm run lint
npm run format
npm run type-check
```
