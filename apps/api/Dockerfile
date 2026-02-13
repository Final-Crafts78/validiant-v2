# ============================================================================
# Build Stage
# ============================================================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for building
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci --workspace=@validiant/api --workspace=@validiant/shared

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY tsconfig.json ./
COPY turbo.json ./

# Build shared package first
RUN npm run build --workspace=@validiant/shared

# Build API
RUN npm run build --workspace=@validiant/api

# ============================================================================
# Production Stage
# ============================================================================
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install production dependencies
RUN apk add --no-cache tini

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

# Install production dependencies only
RUN npm ci --workspace=@validiant/api --workspace=@validiant/shared --omit=dev

# Copy built files from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/migrations ./apps/api/migrations

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "apps/api/dist/server.js"]
