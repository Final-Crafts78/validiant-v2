/**
 * Server Entry Point (Node.js Runtime)
 * 
 * Starts the Hono server using @hono/node-server adapter.
 * This file is used for local development and traditional Node.js deployment.
 * 
 * For Cloudflare Workers deployment, use worker.ts instead.
 */

import { serve } from '@hono/node-server';
import { app } from './hono-app';
import { config } from './config';
import { prisma } from './lib/prisma';

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start Hono server using Node.js adapter
    serve(
      {
        fetch: app.fetch,
        port: config.port,
      },
      (info) => {
        console.log(`🚀 Hono server running on port ${info.port}`);
        console.log(`📝 Environment: ${config.nodeEnv}`);
        console.log(`🔗 API URL: http://localhost:${info.port}/api/v1`);
        console.log(`⚡ Edge-compatible runtime active`);
      }
    );
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  prisma.$disconnect();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  prisma.$disconnect();
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();
