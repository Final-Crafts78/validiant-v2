/**
 * Prisma Client
 * 
 * Singleton Prisma client instance.
 */

import { PrismaClient } from '@prisma/client';
import { config } from '../config';

/**
 * Create Prisma client
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  });
};

/**
 * Global type for Prisma client
 */
type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

/**
 * Extend global namespace for Prisma client
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

/**
 * Export Prisma client
 */
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (config.isDevelopment) {
  globalForPrisma.prisma = prisma;
}

/**
 * Disconnect on process termination
 */
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
