# Testing Guide

## Testing Philosophy

We believe in writing tests that:

1. **Provide value**: Test behavior, not implementation
2. **Are maintainable**: Easy to understand and update
3. **Run fast**: Quick feedback loop
4. **Are reliable**: No flaky tests

## Testing Pyramid

```
       /\
      /  \     E2E Tests (Few)
     /    \
    /------\   Integration Tests (Some)
   /        \
  /----------\  Unit Tests (Many)
```

## Test Coverage Goals

- **Overall**: 80%+
- **Critical paths**: 100%
- **Utilities**: 100%
- **UI Components**: 80%+
- **API Endpoints**: 100%

## Unit Testing

### Tools

- **Jest**: Test runner
- **React Testing Library**: Component testing
- **MSW**: API mocking

### Writing Unit Tests

```typescript
// utils/date-formatter.test.ts
import { formatDate } from './date-formatter';

describe('formatDate', () => {
  it('should format date in YYYY-MM-DD format', () => {
    const date = new Date('2026-02-13');
    expect(formatDate(date)).toBe('2026-02-13');
  });

  it('should handle invalid dates', () => {
    expect(() => formatDate(null)).toThrow('Invalid date');
  });
});
```

### Component Testing

```typescript
// components/TaskCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TaskCard } from './TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    status: 'pending',
  };

  it('should render task title', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('Test Task')).toBeTruthy();
  });

  it('should call onPress when clicked', () => {
    const onPress = jest.fn();
    render(<TaskCard task={mockTask} onPress={onPress} />);
    
    fireEvent.press(screen.getByText('Test Task'));
    expect(onPress).toHaveBeenCalledWith(mockTask);
  });
});
```

### Mocking API Calls

```typescript
// services/task-service.test.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { TaskService } from './task-service';

const server = setupServer(
  rest.get('/api/v1/tasks', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: [{ id: '1', title: 'Test' }],
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('TaskService', () => {
  it('should fetch tasks', async () => {
    const service = new TaskService();
    const tasks = await service.getTasks();
    
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Test');
  });
});
```

## Integration Testing

### API Integration Tests

```typescript
// api/routes/tasks.integration.test.ts
import request from 'supertest';
import { app } from '../app';
import { db } from '../db';

describe('Task API', () => {
  beforeEach(async () => {
    await db.clean();
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Task description',
      };

      const response = await request(app)
        .post('/api/v1/tasks')
        .send(taskData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .send({ title: '' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
```

## End-to-End Testing

### Tools

- **Playwright**: Web E2E testing
- **Detox**: React Native E2E testing

### Web E2E Tests

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toContainText('Invalid credentials');
  });
});
```

### Mobile E2E Tests

```typescript
// e2e/task-creation.e2e.ts
import { by, device, element, expect } from 'detox';

describe('Task Creation', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should create a new task', async () => {
    await element(by.id('create-task-button')).tap();
    await element(by.id('task-title-input')).typeText('New Task');
    await element(by.id('task-description-input')).typeText('Description');
    await element(by.id('save-task-button')).tap();

    await expect(element(by.text('New Task'))).toBeVisible();
  });
});
```

## Test Organization

### Directory Structure

```
app/
├── components/
│   ├── TaskCard.tsx
│   └── TaskCard.test.tsx
├── services/
│   ├── task-service.ts
│   └── task-service.test.ts
├── utils/
│   ├── date-formatter.ts
│   └── date-formatter.test.ts
└── __tests__/
    ├── integration/
    └── e2e/
```

## Running Tests

### All Tests

```bash
npm run test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

### Specific Test File

```bash
npm test task-service.test.ts
```

### E2E Tests

```bash
# Web
npm run test:e2e:web

# Mobile
npm run test:e2e:mobile
```

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// Bad - testing implementation
it('should set loading to true', () => {
  const { result } = renderHook(() => useTasks());
  expect(result.current.loading).toBe(true);
});

// Good - testing behavior
it('should show loading indicator while fetching tasks', () => {
  render(<TaskList />);
  expect(screen.getByTestId('loading')).toBeVisible();
});
```

### 2. Use Descriptive Test Names

```typescript
// Bad
it('works', () => { });

// Good
it('should display error message when task creation fails', () => { });
```

### 3. Follow AAA Pattern

```typescript
it('should update task status', async () => {
  // Arrange
  const task = { id: '1', status: 'pending' };
  render(<TaskCard task={task} />);

  // Act
  fireEvent.press(screen.getByText('Mark Complete'));

  // Assert
  await waitFor(() => {
    expect(screen.getByText('completed')).toBeTruthy();
  });
});
```

### 4. Keep Tests Independent

```typescript
// Bad - tests depend on each other
let userId;

it('should create user', async () => {
  userId = await createUser();
});

it('should fetch user', async () => {
  const user = await getUser(userId);
});

// Good - each test is independent
it('should fetch user', async () => {
  const userId = await createTestUser();
  const user = await getUser(userId);
  expect(user).toBeDefined();
});
```

### 5. Mock External Dependencies

```typescript
jest.mock('../services/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));
```

## Continuous Integration

Tests run automatically on:

- Every push to main/develop
- Every pull request
- Before deployment

### GitHub Actions Configuration

See `.github/workflows/ci.yml` for the full configuration.

## Debugging Tests

### VS Code Debugger

1. Add breakpoint in test file
2. Run "Jest: Debug" from command palette
3. Or use the debug configuration:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "${file}"],
  "console": "integratedTerminal"
}
```

### Console Logs

```typescript
it('should work', () => {
  console.log('Debug info:', someVariable);
  // test code
});
```

### Test Only Mode

```typescript
it.only('should run only this test', () => {
  // This test will run exclusively
});
```

## Common Issues

### Async Testing

```typescript
// Use async/await
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

// Or use waitFor
import { waitFor } from '@testing-library/react-native';

it('should update UI', async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText('Updated')).toBeTruthy();
  });
});
```

### Timer Mocking

```typescript
jest.useFakeTimers();

it('should debounce', () => {
  const callback = jest.fn();
  const debounced = debounce(callback, 1000);
  
  debounced();
  debounced();
  debounced();
  
  jest.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalledTimes(1);
});

jest.useRealTimers();
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Detox Documentation](https://wix.github.io/Detox/)
