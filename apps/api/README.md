# Validiant API v2

> **Production-ready REST API for project management and time tracking**

Built with Express, TypeScript, PostgreSQL, and Redis.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)

---

## ✨ Features

### Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Email verification
- ✅ Password reset flow
- ✅ Session management
- ✅ Refresh tokens
- ✅ Multi-device support

### User Management
- ✅ User profiles
- ✅ Role-based access control (User, Admin, Super Admin)
- ✅ User search and filtering
- ✅ Activity logging
- ✅ Preferences management

### Organization Management
- ✅ Create and manage teams
- ✅ Member invitations
- ✅ Role-based permissions (Owner, Admin, Member, Viewer)
- ✅ Organization settings
- ✅ Transfer ownership

### Project Management
- ✅ Project CRUD operations
- ✅ Project members
- ✅ Status tracking (Planning, Active, On Hold, Completed, Archived)
- ✅ Priority levels
- ✅ Budget tracking
- ✅ Time estimation

### Task Management
- ✅ Task CRUD operations
- ✅ Subtasks support
- ✅ Task assignment
- ✅ Status workflow (Todo, In Progress, In Review, Completed, Cancelled)
- ✅ Priority levels
- ✅ Due dates
- ✅ Tags and custom fields
- ✅ Drag-and-drop position management
- ✅ Bulk operations

### Infrastructure
- ✅ PostgreSQL database with migrations
- ✅ Redis caching and session storage
- ✅ Comprehensive error handling
- ✅ Request logging with Winston
- ✅ Rate limiting
- ✅ Request sanitization
- ✅ Security headers (Helmet)
- ✅ CORS configuration
- ✅ Input validation with Zod

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3
- **Framework**: Express 4.18
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Validation**: Zod 3.22
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Logging**: Winston
- **Security**: Helmet, CORS, express-rate-limit

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 15.0
- Redis >= 7.0
- npm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd validiant-v2

# Install dependencies
npm install

# Navigate to API directory
cd apps/api

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
vim .env
```

### Database Setup

```bash
# Run migrations
npm run migrate

# Check migration status
npm run migrate:status

# Rollback last migration (if needed)
npm run migrate:rollback
```

### Start Development Server

```bash
# Start with hot reload
npm run dev

# Server will start on http://localhost:3000
```

---

## 🔐 Environment Variables

Create a `.env` file in `apps/api` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/validiant
DATABASE_SSL=false

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

---

## 📚 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
```
POST   /auth/register          - Register new user
POST   /auth/login             - Login user
POST   /auth/logout            - Logout user
POST   /auth/refresh           - Refresh access token
GET    /auth/me                - Get current user
POST   /auth/password-reset/request  - Request password reset
POST   /auth/password-reset/confirm  - Reset password
POST   /auth/email/verify      - Verify email
```

### Users
```
GET    /users                  - List users
GET    /users/me               - Get current user profile
PUT    /users/me               - Update profile
DELETE /users/me               - Delete account
GET    /users/:id              - Get user by ID
GET    /users/search           - Search users
```

### Organizations
```
POST   /organizations          - Create organization
GET    /organizations/my       - Get user's organizations
GET    /organizations/:id      - Get organization
PUT    /organizations/:id      - Update organization
DELETE /organizations/:id      - Delete organization
GET    /organizations/:id/members      - List members
POST   /organizations/:id/members      - Add member
DELETE /organizations/:id/members/:userId  - Remove member
```

### Projects
```
POST   /projects               - Create project
GET    /projects/my            - Get user's projects
GET    /projects/:id           - Get project
PUT    /projects/:id           - Update project
DELETE /projects/:id           - Delete project
GET    /organizations/:orgId/projects  - List org projects
GET    /projects/:id/members   - List project members
POST   /projects/:id/members   - Add member
```

### Tasks
```
POST   /tasks                  - Create task
GET    /tasks/my               - Get user's tasks
GET    /tasks/:id              - Get task
PUT    /tasks/:id              - Update task
DELETE /tasks/:id              - Delete task
GET    /projects/:projectId/tasks     - List project tasks
POST   /tasks/:id/assign       - Assign user
POST   /tasks/:id/complete     - Mark complete
GET    /tasks/:id/subtasks     - Get subtasks
```

---

## 📁 Project Structure

```
apps/api/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── env.config.ts
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── organization.controller.ts
│   │   ├── project.controller.ts
│   │   └── task.controller.ts
│   ├── services/            # Business logic
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── organization.service.ts
│   │   ├── project.service.ts
│   │   └── task.service.ts
│   ├── routes/              # API routes
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── organization.routes.ts
│   │   ├── project.routes.ts
│   │   └── task.routes.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── logger.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   └── sanitize.middleware.ts
│   ├── utils/               # Utility functions
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   └── jwt.ts
│   ├── scripts/             # Utility scripts
│   │   └── migrate.ts
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
├── migrations/              # Database migrations
│   ├── 001_initial_schema.sql
│   ├── 002_projects_schema.sql
│   └── 003_tasks_schema.sql
├── package.json
├── tsconfig.json
└── README.md
```

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run migrate          # Run migrations
npm run migrate:status   # Check migration status
npm run migrate:rollback # Rollback last migration

# Code Quality
npm run lint             # Lint code
npm run lint:fix         # Fix lint issues
npm run format           # Format code
npm run type-check       # Check TypeScript types

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Code Style

- **Linting**: ESLint with TypeScript
- **Formatting**: Prettier
- **Naming**: camelCase for variables, PascalCase for types
- **Commits**: Conventional Commits

---

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets
- [ ] Enable database SSL
- [ ] Configure CORS origins
- [ ] Set up proper logging
- [ ] Enable rate limiting
- [ ] Run migrations
- [ ] Set up database backups
- [ ] Configure monitoring
- [ ] Use environment-specific configs

### Docker Deployment

```bash
# Build image
docker build -t validiant-api .

# Run container
docker run -p 3000:3000 --env-file .env validiant-api
```

---

## 📊 Database Schema

### Main Tables

- **users** - User accounts and profiles
- **organizations** - Teams and companies
- **organization_members** - User-organization relationships
- **projects** - Projects within organizations
- **project_members** - User-project assignments
- **tasks** - Tasks within projects
- **task_assignees** - User-task assignments
- **subscriptions** - Organization billing
- **user_activity_log** - Audit trail

---

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt (12 rounds)
- Rate limiting (100 requests per 15 minutes)
- Input sanitization
- XSS protection
- CSRF protection
- Security headers (Helmet)
- SQL injection prevention (parameterized queries)

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

---

## 📞 Support

For questions or issues, please open an issue on GitHub.

---

**Built with ❤️ by the Validiant team**
