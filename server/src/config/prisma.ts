import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let connectionString = process.env.DATABASE_URL;
// Ensure Supabase project ref is in the username to prevent Vercel connection failures
if (connectionString && connectionString.includes('pooler.supabase.com')) {
  // Support both postgres:// and postgresql:// and ensure project ref is appended
  connectionString = connectionString.replace(
    /postgres(ql)?:\/\/postgres:/,
    'postgresql://postgres.conesevqsbvrjhldeokj:'
  );
}

const prismaOptions = connectionString ? {
  datasources: {
    db: {
      url: connectionString
    }
  }
} : undefined;

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
