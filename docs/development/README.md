# Development Guide

## Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Git
- Expo CLI (for mobile)

### Environment Variables

Create `.env.local` files in each app directory:

#### API (.env.local)
```bash
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
JWT_SECRET=
REDIS_URL=
```

#### Web (.env.local)
```bash
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

#### Mobile (.env)
```bash
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Workflow

1. Create feature branch
2. Make changes
3. Run tests
4. Commit with conventional commits
5. Create pull request

## Code Standards

- Use TypeScript strict mode
- Follow ESLint rules
- Format with Prettier
- Write tests for new features
- Document complex logic
