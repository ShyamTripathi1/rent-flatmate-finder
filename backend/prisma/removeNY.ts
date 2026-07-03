import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.listing.deleteMany({
    where: { location: { contains: 'Los Angeles' } }
  });
  console.log('Deleted LA');
}

main().finally(() => prisma.$disconnect());
