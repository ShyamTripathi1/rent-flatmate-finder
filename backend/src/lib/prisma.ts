import { PrismaClient } from '@prisma/client';

// Singleton PrismaClient to avoid creating multiple instances
// Each `new PrismaClient()` opens its own connection pool, which wastes
// memory and slows cold-start on serverless / free-tier hosts.

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
