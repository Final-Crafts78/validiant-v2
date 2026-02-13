# Validiant v2

> **Modern project management and time tracking platform**

A full-stack monorepo application built with TypeScript, featuring a powerful REST API backend and cross-platform mobile/web clients.

---

## 🌟 Overview

Validiant v2 is a complete rewrite of the Validiant platform, designed for modern teams to manage projects, track time, and collaborate effectively.

### Key Features

- ✅ **Project Management**: Complete project lifecycle with status tracking
- ✅ **Task Management**: Advanced task system with subtasks, assignments, and workflows
- ✅ **Organization Teams**: Multi-tenant organizations with role-based access
- ✅ **Time Tracking**: Track time spent on tasks and projects *(coming soon)*
- ✅ **Real-time Collaboration**: Live updates and notifications *(coming soon)*
- ✅ **Cross-platform**: Web, iOS, and Android support

---

## 📦 Monorepo Structure

```
validiant-v2/
├── apps/
│   ├── api/              # Express REST API backend
│   └── app/              # React Native mobile app (coming soon)
├── packages/
│   └── shared/           # Shared types, schemas, and utilities
├── migrations/           # Database migrations
└── docs/                 # Documentation (coming soon)
```

### Packages

- **[@validiant/api](./apps/api)**: Production-ready REST API with Express, PostgreSQL, and Redis
- **[@validiant/shared](./packages/shared)**: Shared TypeScript types, Zod schemas, and constants
- **@validiant/app** *(coming soon)*: React Native mobile application with Expo

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 15.0
- Redis >= 7.0
- npm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/Final-Crafts78/validiant-v2.git
cd validiant-v2

# Install all dependencies
npm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your configuration

# Run database migrations
npm run migrate

# Start development servers
npm run dev
```

### Development

```bash
# Start all workspaces in development mode
npm run dev

# Start API only
npm run dev:api

# Start mobile app only
npm run dev:app

# Build all packages
npm run build

# Run tests
npm test

# Lint and format
npm run lint
npm run format
```

---

## 🏗️ Tech Stack

### Backend (API)

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3
- **Framework**: Express 4.18
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Validation**: Zod
- **Authentication**: JWT
- **ORM**: pg-promise

### Frontend (Mobile App)

- **Framework**: React Native
- **Platform**: Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **State**: React Query + Zustand *(coming soon)*
- **UI**: Custom components + NativeWind *(coming soon)*

### Infrastructure

- **Monorepo**: npm workspaces + Turbo
- **CI/CD**: GitHub Actions *(coming soon)*
- **Deployment**: Docker + Docker Compose *(coming soon)*
- **Monitoring**: Winston logging

---

## 📚 Documentation

- [API Documentation](./apps/api/README.md)
- [Shared Package Documentation](./packages/shared/README.md)
- API Endpoints Reference: [View in API README](./apps/api/README.md#api-endpoints)

---

## 🏛️ Architecture

### Backend Architecture

```
Client Request
    ↓
[Middleware Stack]
    ├── Rate Limiting
    ├── Authentication
    ├── Validation
    └── Sanitization
    ↓
[Controllers]
    ↓
[Services]
    ↓
[Database / Cache]
```

### Database Schema

**Core Entities:**
- Users
- Organizations
- Projects
- Tasks
- Assignments
- Time Entries *(coming soon)*
- Comments *(coming soon)*

**Features:**
- Multi-level soft deletes
- Comprehensive audit trails
- Role-based access control
- Optimized indexes

---

## 🔐 Security

- JWT-based authentication with refresh tokens
- bcrypt password hashing (12 rounds)
- Rate limiting (100 req/15min)
- Input sanitization and validation
- XSS protection
- CSRF protection
- Security headers (Helmet)
- SQL injection prevention

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

---

## 📈 Project Status

### ✅ Completed

- [x] Backend API (100%)
  - [x] Authentication system
  - [x] User management
  - [x] Organization management
  - [x] Project management
  - [x] Task management
  - [x] Database migrations
  - [x] Comprehensive documentation

- [x] Shared Package (100%)
  - [x] TypeScript types
  - [x] Zod validation schemas
  - [x] Shared constants
  - [x] Utility functions

### 🚧 In Progress

- [ ] Mobile App (0%)
  - [ ] Authentication screens
  - [ ] Project screens
  - [ ] Task screens
  - [ ] Settings screens

### 📋 Planned

- [ ] Time Tracking Module
- [ ] Comments System
- [ ] File Upload & Storage
- [ ] Notifications
- [ ] Real-time Updates (WebSockets)
- [ ] Analytics Dashboard
- [ ] Email Service
- [ ] CI/CD Pipeline
- [ ] Docker Deployment

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Run `npm run lint` before committing

---

## 📝 License

MIT License - see [LICENSE](./LICENSE) file for details

---

## 👥 Team

**Validiant Team**

For questions or support, please open an issue on GitHub.

---

## 🙏 Acknowledgments

- Built with modern best practices
- Inspired by leading project management tools
- Powered by open-source technologies

---

## 📞 Links

- **Repository**: [github.com/Final-Crafts78/validiant-v2](https://github.com/Final-Crafts78/validiant-v2)
- **Issues**: [Report a bug or request a feature](https://github.com/Final-Crafts78/validiant-v2/issues)

---

**Built with ❤️ using TypeScript, React Native, and Express**
