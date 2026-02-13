# @validiant/shared

Shared types, constants, and utilities for the Validiant platform.

## Overview

This package contains all shared code used across the Validiant ecosystem:
- **Mobile App** (React Native)
- **Web App** (Next.js)
- **API Server** (Express)

## Installation

```bash
npm install @validiant/shared
```

## Structure

```
src/
├── types/           # TypeScript type definitions
│   ├── user.types.ts
│   ├── organization.types.ts
│   ├── project.types.ts
│   ├── time-tracking.types.ts
│   ├── notification.types.ts
│   └── api.types.ts
├── constants/       # Application constants
│   └── index.ts
├── utils/          # Utility functions
│   ├── date.utils.ts
│   ├── string.utils.ts
│   ├── validation.utils.ts
│   └── common.utils.ts
└── index.ts        # Main export
```

## Usage

### Types

```typescript
import { User, Project, Task, ApiResponse } from '@validiant/shared';

const user: User = {
  id: '123',
  email: 'user@example.com',
  fullName: 'John Doe',
  // ...
};
```

### Constants

```typescript
import { API_ROUTES, VALIDATION, COLORS } from '@validiant/shared';

// API routes
const endpoint = API_ROUTES.USERS.BY_ID('123');

// Validation rules
const minLength = VALIDATION.PASSWORD.MIN_LENGTH;

// Colors
const primaryColor = COLORS.STATUS_COMPLETED;
```

### Utilities

```typescript
import {
  formatDateForDisplay,
  validateEmail,
  slugify,
  debounce,
} from '@validiant/shared';

// Date formatting
const formatted = formatDateForDisplay(new Date());
// Output: "Feb 13, 2026"

// Validation
const emailResult = validateEmail('user@example.com');
if (emailResult.isValid) {
  // Email is valid
}

// String utilities
const slug = slugify('My Project Name');
// Output: "my-project-name"

// Performance utilities
const debouncedSearch = debounce(searchFunction, 300);
```

## Type Definitions

### Core Entities

- **User**: User accounts, profiles, authentication
- **Organization**: Organizations, teams, memberships
- **Project**: Projects, tasks, milestones
- **TimeTracking**: Time entries, timers, timesheets
- **Notification**: Notifications, alerts, preferences
- **API**: Request/response types, pagination, errors

### Type Guards

```typescript
import { hasRole, isActiveUser, isTaskOverdue } from '@validiant/shared';

if (hasRole(user, UserRole.ADMIN)) {
  // User is admin or higher
}

if (isTaskOverdue(task)) {
  // Task is overdue
}
```

## Validation

### Available Validators

- `validateEmail(email: string)`
- `validatePassword(password: string)`
- `validateUsername(username: string)`
- `validateFullName(name: string)`
- `validatePhoneNumber(phone: string)`
- `validateProjectName(name: string)`
- `validateTaskTitle(title: string)`
- `validateUrl(url: string)`
- `validateDate(date: Date | string)`
- `validateDateRange(start: Date, end: Date)`

### Batch Validation

```typescript
import { validateBatch, validateEmail, validatePassword } from '@validiant/shared';

const { isValid, errors } = validateBatch({
  email: validateEmail(formData.email),
  password: validatePassword(formData.password),
});

if (!isValid) {
  console.log(errors);
  // { email: 'Invalid email format', password: 'Password too short' }
}
```

## Utilities

### Date Utilities

- `formatDateForDisplay(date)` - Format for UI display
- `formatDateForApi(date)` - Format for API requests
- `getSmartDateLabel(date)` - Returns "Today", "Yesterday", etc.
- `getTimeAgo(date)` - Returns "2 hours ago"
- `isOverdue(date)` - Check if date is in the past
- `getTodayRange()` - Get start/end of today
- `addBusinessDays(date, days)` - Add business days

### String Utilities

- `capitalize(str)` - Capitalize first letter
- `truncate(str, length)` - Truncate with ellipsis
- `slugify(str)` - Generate URL-friendly slug
- `maskEmail(email)` - Mask email address
- `getInitials(name)` - Extract initials
- `formatBytes(bytes)` - Format file size
- `pluralize(count, singular, plural)` - Pluralize words

### Common Utilities

- `debounce(fn, wait)` - Debounce function calls
- `throttle(fn, limit)` - Throttle function calls
- `groupBy(array, key)` - Group array by key
- `unique(array)` - Get unique values
- `deepClone(obj)` - Deep clone object
- `generateUuid()` - Generate UUID v4
- `sleep(ms)` - Async sleep
- `retry(fn, attempts)` - Retry with backoff

## Constants

### API Configuration

- `API.VERSION` - API version
- `API.BASE_PATH` - Base API path
- `API_ROUTES` - All API endpoints

### Validation Rules

- `VALIDATION.EMAIL` - Email validation rules
- `VALIDATION.PASSWORD` - Password requirements
- `VALIDATION.PROJECT_KEY` - Project key format

### Other Constants

- `PAGINATION` - Pagination defaults
- `DATE_FORMATS` - Date format strings
- `RATE_LIMITS` - Rate limiting config
- `STORAGE_KEYS` - LocalStorage keys
- `QUERY_KEYS` - React Query keys
- `COLORS` - Color palette

## Development

### Build

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

### Lint

```bash
npm run lint
```

## Best Practices

1. **Import Selectively**: Import only what you need
   ```typescript
   // Good
   import { User, validateEmail } from '@validiant/shared';
   
   // Avoid
   import * as shared from '@validiant/shared';
   ```

2. **Use Type Guards**: Leverage provided type guards
   ```typescript
   if (isActiveUser(user)) {
     // TypeScript knows user is active here
   }
   ```

3. **Validation**: Always validate user input
   ```typescript
   const result = validateEmail(email);
   if (!result.isValid) {
     showError(result.error);
     return;
   }
   ```

4. **Constants**: Use constants instead of magic strings/numbers
   ```typescript
   // Good
   if (limit >= PAGINATION.MAX_PER_PAGE) { }
   
   // Avoid
   if (limit >= 100) { }
   ```

## License

MIT
