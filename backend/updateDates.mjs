import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const july2026Date = new Date('2026-07-01T00:00:00.000Z');
  
  const result = await prisma.listing.updateMany({
    data: {
      availableFrom: july2026Date
    }
  });

  console.log(`Updated ${result.count} listings to July 2026.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
