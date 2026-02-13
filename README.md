# Validiant v2 - State-of-the-Art Productivity Application

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-Latest-61dafb)](https://reactnative.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

> Elite-grade productivity platform with mobile, web, and API - Task management, time tracking, project management, and intelligent automation.

## 🎯 Project Overview

Validiant is a comprehensive productivity application built with modern technologies, focusing on:
- **Performance**: Butter-smooth 60fps animations, <2s load times
- **Quality**: 80%+ test coverage, type-safe across the stack
- **User Experience**: Intuitive design, offline-first mobile, real-time collaboration
- **Extensibility**: Plugin architecture, extensive integrations, automation workflows

## 🏗️ Architecture

This is a monorepo containing:

```
validiant-v2/
├── apps/
│   ├── mobile/        # React Native (Expo) - iOS & Android
│   ├── web/           # Next.js 14 - Web application
│   └── api/           # Express.js - REST API backend
├── packages/
│   ├── shared/        # Shared types, utilities, constants
│   ├── ui/            # Shared UI components
│   └── config/        # Shared configurations
└── docs/              # Documentation
```

## 🛠️ Tech Stack

### Frontend
- **Mobile**: React Native + Expo, Zustand, React Query
- **Web**: Next.js 14, Tailwind CSS, Shadcn/ui
- **Shared**: TypeScript, Zod validation

### Backend
- **API**: Express.js + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Caching**: Upstash Redis
- **Authentication**: Supabase Auth + JWT

### DevOps
- **Monorepo**: Turborepo
- **CI/CD**: GitHub Actions
- **Hosting**: Vercel (web), Railway (API), Expo EAS (mobile)
- **Monitoring**: Sentry, PostHog

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- Expo CLI (for mobile development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Final-Crafts78/validiant-v2.git
cd validiant-v2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

4. Start development servers:
```bash
npm run dev
```

## 📱 Development

### Running Individual Apps

```bash
# Mobile app
cd apps/mobile && npm run dev

# Web app
cd apps/web && npm run dev

# API server
cd apps/api && npm run dev
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format

# Run tests
npm run test
```

## 📚 Documentation

- [Architecture Documentation](./docs/architecture/README.md)
- [API Documentation](./docs/api/README.md)
- [Development Guide](./docs/development/README.md)
- [Deployment Guide](./docs/deployment/README.md)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

Built with modern open-source technologies and best practices.

---

**Status**: 🚧 Active Development | **Version**: 1.0.0-alpha
