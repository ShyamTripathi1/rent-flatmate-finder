import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.notificationLog.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.interestRequest.deleteMany({});
  await prisma.compatibilityScore.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.tenantProfile.deleteMany({});
  await prisma.user.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', salt);
  const userPasswordHash = await bcrypt.hash('Password123!', salt);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@flatmatefinder.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      name: 'Platform Admin',
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: 'owner@flatmatefinder.com',
      passwordHash: userPasswordHash,
      role: 'OWNER',
      name: 'Rohan (Owner)',
    },
  });

  const tenant = await prisma.user.create({
    data: {
      email: 'tenant@flatmatefinder.com',
      passwordHash: userPasswordHash,
      role: 'TENANT',
      name: 'Shyam (Tenant)',
    },
  });

  // 2. Create Tenant Profile
  await prisma.tenantProfile.create({
    data: {
      userId: tenant.id,
      preferredLocation: 'Mumbai',
      budgetMin: 800,
      budgetMax: 1500,
      moveInDate: new Date('2026-08-01T00:00:00Z'),
      lifestyleNotes: 'Quiet, clean, non-smoker, works in tech, loves cooking and reading.',
    },
  });

  // 3. Create Listings
  await prisma.listing.create({
    data: {
      ownerId: owner.id,
      location: 'Mumbai',
      lat: 40.7831,
      lng: -73.9712,
      rent: 1200,
      availableFrom: new Date('2026-07-15T00:00:00Z'),
      roomType: 'single',
      furnishingStatus: 'furnished',
      photos: '[]',
      description: 'Beautiful sunny single room in Upper West Side. Close to Central Park, Columbia University, and subway line 1. Friendly flatmates!',
    },
  });

  await prisma.listing.create({
    data: {
      ownerId: owner.id,
      location: 'Delhi',
      lat: 40.7061,
      lng: -73.9969,
      rent: 950,
      availableFrom: new Date('2026-08-01T00:00:00Z'),
      roomType: 'shared',
      furnishingStatus: 'semi-furnished',
      photos: '[]',
      description: 'Cozy shared room in Williamsburg, Brooklyn. Amazing location with restaurants, coffee shops, and train nearby. In-unit washer/dryer.',
    },
  });

  await prisma.listing.create({
    data: {
      ownerId: owner.id,
      location: 'Bengaluru',
      lat: 34.0194,
      lng: -118.4912,
      rent: 1600,
      availableFrom: new Date('2026-09-01T00:00:00Z'),
      roomType: 'studio',
      furnishingStatus: 'unfurnished',
      photos: '[]',
      description: 'Spacious studio flat located 5 minutes walking distance from Santa Monica Pier. Modern kitchen and private parking slot included.',
    },
  });

  console.log('Seeding completed successfully!');
  console.log('Users seeded:');
  console.log('- Admin: admin@flatmatefinder.com / AdminPassword123!');
  console.log('- Owner: owner@flatmatefinder.com / Password123!');
  console.log('- Tenant: tenant@flatmatefinder.com / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
