# Architecture Documentation

## System Overview

Validiant follows a microservices-inspired architecture with clear separation of concerns.

## Components

### Frontend Applications
1. **Mobile App** (React Native + Expo)
   - Offline-first architecture
   - Local storage with WatermelonDB
   - Background sync

2. **Web App** (Next.js 14)
   - Server-side rendering
   - Optimistic UI updates
   - Progressive Web App features

### Backend
1. **API Server** (Express.js)
   - RESTful endpoints
   - WebSocket support for real-time features
   - Modular service architecture

2. **Database** (Supabase PostgreSQL)
   - Normalized schema
   - Row-level security
   - Real-time subscriptions

3. **Caching** (Upstash Redis)
   - Session storage
   - API response caching
   - Rate limiting

## Data Flow

```
Client (Mobile/Web) → API Server → Database
                    ↓
                  Cache
                    ↓
                Real-time Updates
```

## Security

- JWT-based authentication
- Role-based access control (RBAC)
- API rate limiting
- Input validation
- XSS protection
- CSRF protection
