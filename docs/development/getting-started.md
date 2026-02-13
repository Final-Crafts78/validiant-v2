# Getting Started with Validiant Development

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Expo CLI** for mobile development: `npm install -g expo-cli`
- **VS Code** (recommended) with suggested extensions

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Final-Crafts78/validiant-v2.git
cd validiant-v2
```

### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for all apps and packages in the monorepo.

### 3. Set Up Environment Variables

#### Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Note down:
   - Project URL
   - Anon/Public Key
   - Service Role Key (for API)
   - Database connection string

#### Create Redis Instance (Optional but recommended)

1. Go to [Upstash](https://upstash.com)
2. Create a Redis database
3. Note down the connection URL

#### Configure Environment Variables

**For API:**
```bash
cd apps/api
cp .env.example .env.local
# Edit .env.local with your credentials
```

**For Web:**
```bash
cd apps/web
cp .env.example .env.local
# Edit .env.local with your credentials
```

**For Mobile:**
```bash
cd apps/mobile
cp .env.example .env
# Edit .env with your credentials
```

### 4. Database Setup

The database schema will be created automatically when you run migrations (coming soon).

For now, you can use Supabase's SQL editor to run schema scripts.

### 5. Start Development Servers

#### Option A: Start All Apps (Recommended)

```bash
npm run dev
```

This starts:
- API server on http://localhost:3001
- Web app on http://localhost:3000
- Mobile app with Expo

#### Option B: Start Individual Apps

**API Server:**
```bash
cd apps/api
npm run dev
```

**Web App:**
```bash
cd apps/web
npm run dev
```

**Mobile App:**
```bash
cd apps/mobile
npm run dev
```

### 6. Access Applications

- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api-docs (when implemented)
- **Mobile App**: Scan QR code in Expo Go app

## Development Workflow

### Creating a New Feature

1. Create a feature branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes

3. Run tests:
```bash
npm run test
```

4. Run linting:
```bash
npm run lint
```

5. Commit your changes:
```bash
git commit -m "feat: add your feature description"
```

6. Push to GitHub:
```bash
git push origin feature/your-feature-name
```

7. Create a Pull Request

### Code Quality Checks

Before committing, always run:

```bash
# Lint all code
npm run lint

# Type check
npm run type-check

# Format code
npm run format

# Run tests
npm run test
```

## Troubleshooting

### Port Already in Use

If port 3000 or 3001 is already in use:

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Module Not Found

Clear cache and reinstall:

```bash
npm run clean
rm -rf node_modules
npm install
```

### Expo/React Native Issues

Clear Expo cache:

```bash
cd apps/mobile
npx expo start -c
```

### Database Connection Issues

Verify your DATABASE_URL in .env.local is correct and includes:
- Correct host
- Correct port (usually 5432)
- Correct database name
- Valid credentials

## Next Steps

- Read [Architecture Documentation](../architecture/README.md)
- Review [API Documentation](../api/README.md)
- Check [Code Style Guide](./code-style.md)
- Learn about [Testing](./testing.md)

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing [GitHub Issues](https://github.com/Final-Crafts78/validiant-v2/issues)
3. Create a new issue with detailed information

Happy coding! 🚀
