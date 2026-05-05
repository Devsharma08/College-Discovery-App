import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting Data Sync & Optimization...');

  const colleges = await prisma.college.findMany({
    include: { reviews: true }
  });

  for (const college of colleges) {
    let updateData: any = {};

    // 1. Sync Average Rating
    if (college.reviews.length > 0) {
      const avg = college.reviews.reduce((acc, r) => acc + r.rating, 0) / college.reviews.length;
      updateData.rating = parseFloat(avg.toFixed(1));
    }

    // 2. Auto-populate State/City from Location string if empty
    // Example: "Bangalore, Karnataka" -> City: Bangalore, State: Karnataka
    if ((!college.state || !college.city) && college.location.includes(',')) {
      const parts = college.location.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        updateData.city = parts[0];
        updateData.state = parts[1];
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.college.update({
        where: { id: college.id },
        data: updateData
      });
      console.log(`✅ Updated ${college.name}: ${JSON.stringify(updateData)}`);
    }
  }

  console.log('✨ Data Sync Complete! Your filters and ratings are now solidified.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
