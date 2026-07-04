const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  console.log(`Total users in DB: ${users}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
