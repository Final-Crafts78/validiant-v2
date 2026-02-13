# Validiant Web App

## Next.js 14 Web Application

Modern, responsive web application built with Next.js 14 and React.

---

## Features

- 🚀 **Next.js 14** - App Router with RSC
- 🎨 **Tailwind CSS** - Utility-first styling
- 🔒 **Authentication** - Protected routes
- 📦 **React Query** - Data fetching and caching
- ⚙️ **Zustand** - State management
- ⚡ **TypeScript** - Full type safety

---

## Tech Stack

- **Next.js 14** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Query** - Data fetching
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Zod** - Validation
- **Axios** - API requests

---

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start dev server
npm run dev

# Open http://localhost:3000
```

### Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## Project Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Auth pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── dashboard/        # Dashboard pages
│   │   │   ├── page.tsx      # Dashboard home
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── organizations/
│   │   │   ├── profile/
│   │   │   └── layout.tsx    # Dashboard layout
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Landing page
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── ui/               # Reusable components
│   │   └── providers/        # Context providers
│   ├── store/
│   │   └── auth.ts           # Auth store
│   ├── services/
│   │   ├── api.ts            # API service
│   │   └── auth.service.ts   # Auth service
│   ├── lib/
│   │   └── utils.ts          # Utilities
│   └── config/
│       └── api.ts            # API config
├── public/               # Static files
├── next.config.js        # Next.js config
├── tailwind.config.ts    # Tailwind config
├── tsconfig.json         # TypeScript config
└── package.json          # Dependencies
```

---

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Other Platforms

```bash
# Build
npm run build

# The output is in .next/
# Deploy .next/ to your hosting provider
```

---

## License

MIT
