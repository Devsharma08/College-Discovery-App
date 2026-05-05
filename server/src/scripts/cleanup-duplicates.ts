import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for duplicate reviews...');

  // Find duplicates by userId and collegeId
  const reviews = await prisma.review.findMany({
    select: {
      id: true,
      userId: true,
      collegeId: true,
      createdAt: true,
    },
  });

  const uniqueKeys = new Set();
  const duplicates: string[] = [];

  // Identify duplicates (keeping the first one we find)
  for (const review of reviews) {
    const key = `${review.userId}-${review.collegeId}`;
    if (uniqueKeys.has(key)) {
      duplicates.push(review.id);
    } else {
      uniqueKeys.add(key);
    }
  }

  if (duplicates.length === 0) {
    console.log('✅ No duplicate reviews found. You can safely run prisma db push.');
  } else {
    console.log(`🗑️ Found ${duplicates.length} duplicate reviews. Deleting...`);
    
    await prisma.review.deleteMany({
      where: {
        id: { in: duplicates },
      },
    });

    console.log('✅ Duplicates cleaned up!');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error cleaning up duplicates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
