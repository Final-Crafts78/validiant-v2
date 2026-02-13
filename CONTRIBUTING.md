# Contributing to Validiant

Thank you for your interest in contributing to Validiant! 🎉

We welcome contributions from the community and are grateful for your help in making this project better.

---

## 📜 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Testing](#testing)
- [Documentation](#documentation)

---

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Be collaborative and constructive
- Focus on what is best for the community
- Show empathy towards others

---

## 🚀 Getting Started

### 1. Fork the Repository

Click the "Fork" button at the top right of the repository page.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/validiant-v2.git
cd validiant-v2
```

### 3. Add Upstream Remote

```bash
git remote add upstream https://github.com/Final-Crafts78/validiant-v2.git
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Set Up Environment

```bash
# Copy environment files
cp apps/api/.env.example apps/api/.env

# Set up database
npm run api:prisma:generate
npm run api:prisma:migrate

# Build shared package
npm run shared:build
```

---

## 💻 Development Workflow

### 1. Create a Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

Examples:
- `feature/add-notifications`
- `fix/login-validation`
- `docs/update-readme`

### 2. Make Your Changes

```bash
# Start development servers
npm run dev

# Or run specific apps
npm run api:dev
npm run web:dev
npm run mobile:start
```

### 3. Test Your Changes

```bash
# Lint code
npm run lint

# Type check
npm run type-check

# Format code
npm run format
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature"
```

See [Commit Messages](#commit-messages) for guidelines.

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

---

## 🔄 Pull Request Process

### 1. Create Pull Request

- Go to your fork on GitHub
- Click "New Pull Request"
- Select your feature branch
- Fill out the PR template

### 2. PR Requirements

Before submitting, ensure:

- ✅ Code follows project conventions
- ✅ All tests pass
- ✅ No linting errors
- ✅ Type checking passes
- ✅ Code is formatted with Prettier
- ✅ Commit messages follow conventions
- ✅ Documentation is updated (if needed)
- ✅ PR description explains the changes

### 3. Review Process

- Maintainers will review your PR
- Address any requested changes
- Keep your PR up to date with main

```bash
# Update your branch
git checkout main
git pull upstream main
git checkout feature/your-feature-name
git rebase main
git push --force-with-lease origin feature/your-feature-name
```

### 4. Merge

Once approved, a maintainer will merge your PR.

---

## ✨ Coding Standards

### TypeScript

- Use TypeScript for all code
- Avoid `any` type - use proper types
- Use interfaces for object shapes
- Use type imports when importing only types

```typescript
// Good
import type { User } from '@validiant/shared';

// Avoid
import { User } from '@validiant/shared';
```

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase`
- **Types**: `PascalCase`

### Code Style

- Use Prettier for formatting (runs automatically)
- Follow ESLint rules
- Keep functions small and focused
- Write self-documenting code
- Add comments for complex logic
- Use descriptive variable names

### File Structure

```typescript
// 1. Imports
import { useState } from 'react';
import type { User } from '@validiant/shared';

// 2. Types/Interfaces
interface Props {
  user: User;
}

// 3. Component/Function
export const UserProfile = ({ user }: Props) => {
  // Implementation
};
```

---

## 📝 Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `ci` - CI/CD changes

### Examples

```bash
# Feature
git commit -m "feat(auth): add password reset functionality"

# Bug fix
git commit -m "fix(api): resolve CORS issue"

# Documentation
git commit -m "docs(readme): update installation steps"

# Refactor
git commit -m "refactor(shared): simplify validation schemas"
```

### Breaking Changes

For breaking changes, add `!` after type:

```bash
git commit -m "feat(api)!: change authentication flow"
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests (when implemented)
npm test

# Run tests for specific app
npm test --workspace=@validiant/api
```

### Writing Tests

- Write tests for new features
- Update tests for bug fixes
- Aim for good coverage
- Test edge cases

---

## 📚 Documentation

### When to Update Docs

- Adding new features
- Changing API endpoints
- Modifying configuration
- Updating dependencies
- Changing development workflow

### Documentation Files

- `README.md` - Main documentation
- `apps/api/README.md` - API documentation
- `CONTRIBUTING.md` - This file
- Code comments - Complex logic

---

## ❓ Questions?

If you have questions:

1. Check existing documentation
2. Search existing issues
3. Create a new issue with `question` label

---

## 🙏 Thank You!

Your contributions help make Validiant better for everyone. We appreciate your time and effort! ❤️
