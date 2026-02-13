# Deployment Guide

## Environments

- **Development**: Local development
- **Staging**: Testing environment
- **Production**: Live environment

## Deployment Platforms

### Web App (Vercel)
```bash
npm run build
vercel deploy --prod
```

### API (Railway)
```bash
railway up
```

### Mobile (Expo EAS)
```bash
eas build --platform all
eas submit --platform all
```

## CI/CD

GitHub Actions automatically:
- Run tests on pull requests
- Deploy to staging on merge to develop
- Deploy to production on merge to main

## Monitoring

- Sentry for error tracking
- PostHog for analytics
- Uptime Robot for availability monitoring
