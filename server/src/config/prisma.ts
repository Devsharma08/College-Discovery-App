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

export const prisma = globalForPrisma.prisma ?? (connectionString 
  ? new PrismaClient({ datasources: { db: { url: connectionString } } }) 
  : new PrismaClient());

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
