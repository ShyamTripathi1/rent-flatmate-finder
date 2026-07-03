import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.findUnique({ where: { email: 'owner@flatmatefinder.com' } });
  if (owner) {
    await prisma.user.update({
      where: { id: owner.id },
      data: { name: 'Rohan (Owner)' }
    });
    console.log('Updated owner name to Rohan');
  }

  const tenant = await prisma.user.findUnique({ where: { email: 'tenant@flatmatefinder.com' } });
  if (tenant) {
    await prisma.user.update({
      where: { id: tenant.id },
      data: { name: 'Shyam (Tenant)' }
    });
    console.log('Updated tenant name to Shyam');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
