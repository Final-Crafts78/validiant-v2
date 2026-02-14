# Validiant v2

<div align="center">
  <h3>🚀 Full-Stack Project Management Platform</h3>
  <p>A modern, type-safe, edge-native monorepo built with React Native, Next.js, Hono, and Drizzle</p>
</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

Validiant v2 is a comprehensive full-stack project management platform designed for modern teams. Built as a monorepo, it provides native mobile apps, a responsive web application, and a robust edge-native API - all sharing common types and validation logic.

### Key Highlights

- 🎨 **Modern UI/UX** - Beautiful, responsive design across all platforms
- 🔒 **Secure Authentication** - JWT-based auth with HttpOnly cookies
- 📱 **Cross-Platform** - iOS, Android, and Web from a single codebase
- ⚡ **Type-Safe** - End-to-end TypeScript with shared types
- 🛡️ **Validated** - Zod schemas ensure data integrity
- 🗄️ **Scalable Database** - PostgreSQL with Drizzle ORM
- 🌐 **Edge-Native** - Deployed on Cloudflare Workers for global low latency

---

## ✨ Features

### User Management
- ✅ User registration and login
- ✅ JWT token authentication (HttpOnly cookies + Bearer tokens)
- ✅ Password reset flow
- ✅ Profile management

### Project Management
- ✅ Create and manage projects
- ✅ Project status tracking
- ✅ Progress monitoring
- ✅ Team collaboration

### Task Management
- ✅ Create and assign tasks
- ✅ Priority levels (Low, Medium, High, Urgent)
- ✅ Status tracking (Todo, In Progress, Completed)
- ✅ Due date management

### Organization Management
- ✅ Create and join organizations
- ✅ Role-based access control (Owner, Admin, Member)
- ✅ Team member management
- ✅ Organization-wide settings

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|------------|----------|
| **React Native + Expo** | Cross-platform mobile apps (iOS/Android) |
| **Next.js 15** | Server-side rendered web application |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling (Web) |
| **React Query** | Data fetching and caching |
| **Zustand** | State management |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |

### Backend

| Technology | Purpose |
|------------|----------|
| **Hono** | Edge-native web framework |
| **Cloudflare Workers** | Global edge compute platform |
| **TypeScript** | Type-safe development |
| **Drizzle ORM** | Type-safe SQL toolkit |
| **Neon Serverless PostgreSQL** | Edge-compatible database |
| **Upstash Redis** | Edge-compatible caching (HTTP-based) |
| **JWT + jose** | Authentication tokens |
| **bcryptjs** | Password hashing |

### DevOps

| Technology | Purpose |
|------------|----------|
| **Turbo** | Monorepo build system |
| **pnpm Workspaces** | Dependency management |
| **Prettier** | Code formatting |
| **ESLint** | Code linting |
| **Wrangler** | Cloudflare Workers CLI |

---

## 📁 Project Structure

```
validiant-v2/
├── apps/
│   ├── mobile/           # React Native mobile app (Expo)
│   ├── web/              # Next.js 15 web application
│   └── api/              # Hono edge-native API
├── packages/
│   └── shared/           # Shared types, validation, utilities
├── turbo.json            # Turbo configuration
├── package.json          # Root package configuration
└── README.md             # This file
```

### App Details

- **`apps/mobile`** - React Native app with Expo 50 (iOS/Android)
- **`apps/web`** - Next.js 15 web app with App Router
- **`apps/api`** - Hono API on Cloudflare Workers with Drizzle ORM
- **`packages/shared`** - Common types, Zod schemas, and utilities

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Git**

### External Services Required

- **Neon PostgreSQL** - [Get free account](https://neon.tech)
- **Upstash Redis** - [Get free account](https://upstash.com)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Final-Crafts78/validiant-v2.git
cd validiant-v2
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
# API
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your database and Redis credentials
```

4. **Set up the database**

```bash
# Generate Drizzle schema
pnpm api:db:generate

# Push schema to database
pnpm api:db:push
```

5. **Build shared package**

```bash
pnpm shared:build
```

---

## 💻 Development

### Running All Apps

```bash
# Start all apps in development mode
pnpm run dev
```

### Running Individual Apps

#### Backend API

```bash
# Start API with Wrangler (Cloudflare Workers dev mode)
pnpm run api:dev

# The API will be available at http://localhost:8787
```

#### Web App

```bash
# Start Next.js dev server
pnpm run web:dev

# Open http://localhost:3000 in your browser
```

#### Mobile App

```bash
# Start Expo
pnpm run mobile:start

# Run on iOS
pnpm run mobile:ios

# Run on Android
pnpm run mobile:android
```

### Database Management

```bash
# Open Drizzle Studio (database GUI)
pnpm run api:db:studio

# Generate a new migration
pnpm run api:db:generate

# Push schema changes directly (no migration files)
pnpm run api:db:push
```

### Code Quality

```bash
# Lint all packages
pnpm run lint

# Type check
pnpm run type-check

# Format code
pnpm run format

# Check formatting
pnpm run format:check
```

---

## 🏭 Building for Production

```bash
# Build all apps
pnpm run build

# Build specific app
pnpm run api:build
pnpm run web:build
pnpm run shared:build
```

---

## 📝 API Documentation

### Base URL (Production)

```
https://api.validiant.workers.dev/api/v1
```

### Base URL (Development)

```
http://localhost:8787/api/v1
```

### Endpoints

#### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user (protected)
- `POST /auth/logout` - Logout user (protected)

### Example Request

```bash
curl -X POST https://api.validiant.workers.dev/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "fullName": "John Doe"
  }'
```

---

## 🚢 Deployment

### Backend API (Cloudflare Workers)

1. Install Wrangler CLI: `pnpm add -g wrangler`
2. Login to Cloudflare: `wrangler login`
3. Set up secrets:
   ```bash
   npx wrangler secret put DATABASE_URL
   npx wrangler secret put UPSTASH_REDIS_REST_URL
   npx wrangler secret put UPSTASH_REDIS_REST_TOKEN
   npx wrangler secret put JWT_SECRET
   npx wrangler secret put JWT_REFRESH_SECRET
   npx wrangler secret put SESSION_SECRET
   ```
4. Deploy: `pnpm run api:deploy`

### Web App (Vercel/Netlify)

1. Build: `pnpm run web:build`
2. Deploy to Vercel/Netlify or any Node.js hosting

### Mobile App

1. Configure app.json for production
2. Build with EAS: `eas build --platform all`
3. Submit to app stores

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ by the Validiant Team
- Powered by open-source technologies
- Deployed globally on Cloudflare's edge network

---

<div align="center">
  <p>Made with TypeScript and ☕</p>
  <p>© 2026 Validiant. All rights reserved.</p>
</div>
