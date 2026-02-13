# Validiant API

## Backend API Server

Express.js REST API with PostgreSQL, Prisma ORM, and JWT authentication.

---

## Features

- 🔒 **JWT Authentication** - Secure token-based auth
- 📦 **PostgreSQL Database** - Robust relational database
- 🔧 **Prisma ORM** - Type-safe database access
- ✅ **Validation** - Request validation with Zod
- 🛡️ **Security** - Helmet, CORS, rate limiting
- 📝 **Logging** - Morgan HTTP request logger
- ⚡ **TypeScript** - Full type safety

---

## Tech Stack

- **Node.js** + **Express** - Server framework
- **TypeScript** - Type-safe development
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Zod** - Schema validation
- **Helmet** - Security headers
- **CORS** - Cross-origin support
- **Morgan** - HTTP logging

---

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- npm >= 9.0.0

### Installation

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up database**

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### Development

```bash
# Start dev server with hot reload
npm run dev

# Server will run on http://localhost:5000
```

### Production

```bash
# Build
npm run build

# Start production server
npm start
```

---

## Database Management

```bash
# Open Prisma Studio
npm run prisma:studio

# Create new migration
npm run prisma:migrate

# Deploy migrations (production)
npm run prisma:migrate:prod

# Seed database
npm run prisma:seed

# Push schema without migration
npm run db:push

# Reset database (⚠️ deletes all data)
npm run db:reset
```

---

## API Endpoints

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2026-02-13T17:00:00.000Z",
      "updatedAt": "2026-02-13T17:00:00.000Z"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK` (same as register)

#### Get Current User

```http
GET /auth/me
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2026-02-13T17:00:00.000Z",
    "updatedAt": "2026-02-13T17:00:00.000Z"
  }
}
```

#### Logout

```http
POST /auth/logout
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 422 | Invalid input data |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `UNAUTHORIZED` | 401 | Missing/invalid token |
| `TOKEN_EXPIRED` | 401 | Token has expired |
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_EXISTS` | 409 | Resource already exists |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/validiant

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-here
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:8081

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Bcrypt
BCRYPT_ROUNDS=10
```

---

## Project Structure

```
apps/api/
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── config/
│   │   └── index.ts          # App configuration
│   ├── controllers/
│   │   └── auth.controller.ts # Auth logic
│   ├── lib/
│   │   └── prisma.ts         # Prisma client
│   ├── middleware/
│   │   ├── auth.ts           # Auth middleware
│   │   ├── errorHandler.ts   # Error handling
│   │   └── validate.ts       # Validation
│   ├── routes/
│   │   └── auth.routes.ts    # Auth routes
│   ├── utils/
│   │   ├── jwt.ts            # JWT utilities
│   │   ├── password.ts       # Password utilities
│   │   └── response.ts       # Response helpers
│   ├── app.ts               # Express app setup
│   └── index.ts             # Server entry point
├── .env.example             # Environment template
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript config
```

---

## License

MIT
