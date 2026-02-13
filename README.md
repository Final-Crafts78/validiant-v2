# Validiant v2

<div align="center">
  <h3>🚀 Full-Stack Project Management Platform</h3>
  <p>A modern, type-safe monorepo built with React Native, Next.js, Express, and Prisma</p>
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

Validiant v2 is a comprehensive full-stack project management platform designed for modern teams. Built as a monorepo, it provides native mobile apps, a responsive web application, and a robust backend API - all sharing common types and validation logic.

### Key Highlights

- 🎨 **Modern UI/UX** - Beautiful, responsive design across all platforms
- 🔒 **Secure Authentication** - JWT-based auth with password hashing
- 📱 **Cross-Platform** - iOS, Android, and Web from a single codebase
- ⚡ **Type-Safe** - End-to-end TypeScript with shared types
- 🛡️ **Validated** - Zod schemas ensure data integrity
- 🗄️ **Scalable Database** - PostgreSQL with Prisma ORM

---

## ✨ Features

### User Management
- ✅ User registration and login
- ✅ JWT token authentication
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
| **Next.js 14** | Server-side rendered web application |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling (Web) |
| **React Query** | Data fetching and caching |
| **Zustand** | State management |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |

### Backend

| Technology | Purpose |
|------------|----------|
| **Node.js + Express** | RESTful API server |
| **TypeScript** | Type-safe development |
| **Prisma** | Database ORM |
| **PostgreSQL** | Relational database |
| **JWT** | Authentication tokens |
| **Bcrypt** | Password hashing |

### DevOps

| Technology | Purpose |
|------------|----------|
| **Turbo** | Monorepo build system |
| **npm Workspaces** | Dependency management |
| **Prettier** | Code formatting |
| **ESLint** | Code linting |

---

## 📁 Project Structure

```
validiant-v2/
├── apps/
│   ├── mobile/           # React Native mobile app (Expo)
│   ├── web/              # Next.js web application
│   └── api/              # Express API server
├── packages/
│   └── shared/           # Shared types, validation, utilities
├── turbo.json            # Turbo configuration
├── package.json          # Root package configuration
└── README.md             # This file
```

### App Details

- **`apps/mobile`** - React Native app with Expo (iOS/Android)
- **`apps/web`** - Next.js 14 web app with App Router
- **`apps/api`** - Express API with Prisma and PostgreSQL
- **`packages/shared`** - Common types, Zod schemas, and utilities

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 14.0
- **Git**

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Final-Crafts78/validiant-v2.git
cd validiant-v2
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
# API
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your database credentials
```

4. **Set up the database**

```bash
# Generate Prisma client
npm run api:prisma:generate

# Run migrations
npm run api:prisma:migrate
```

5. **Build shared package**

```bash
npm run shared:build
```

---

## 💻 Development

### Running All Apps

```bash
# Start all apps in development mode
npm run dev
```

### Running Individual Apps

#### Backend API

```bash
# Start API server
npm run api:dev

# The API will be available at http://localhost:5000
```

#### Web App

```bash
# Start Next.js dev server
npm run web:dev

# Open http://localhost:3000 in your browser
```

#### Mobile App

```bash
# Start Expo
npm run mobile:start

# Run on iOS
npm run mobile:ios

# Run on Android
npm run mobile:android
```

### Database Management

```bash
# Open Prisma Studio (database GUI)
npm run api:prisma:studio

# Create a new migration
npm run api:prisma:migrate

# Reset database (⚠️ deletes all data)
npm run api:db:reset
```

### Code Quality

```bash
# Lint all packages
npm run lint

# Type check
npm run type-check

# Format code
npm run format

# Check formatting
npm run format:check
```

---

## 🏗️ Building for Production

```bash
# Build all apps
npm run build

# Build specific app
npm run api:build
npm run web:build
npm run shared:build
```

---

## 📝 API Documentation

### Base URL

```
http://localhost:5000/api/v1
```

### Endpoints

#### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user (protected)
- `POST /auth/logout` - Logout user (protected)

### Example Request

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

---

## 🚢 Deployment

### Backend API

1. Set up PostgreSQL database on your hosting provider
2. Configure environment variables
3. Run migrations: `npm run api:prisma:migrate:prod`
4. Build: `npm run api:build`
5. Start: `npm run api:start`

### Web App

1. Build: `npm run web:build`
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

---

<div align="center">
  <p>Made with TypeScript and ☕</p>
  <p>© 2026 Validiant. All rights reserved.</p>
</div>
