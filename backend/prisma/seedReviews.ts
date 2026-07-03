import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching listings and tenants...');
  const listings = await prisma.listing.findMany();
  const tenants = await prisma.user.findMany({ where: { role: 'TENANT' } });

  if (listings.length === 0 || tenants.length === 0) {
    console.log('No listings or tenants found. Cannot seed reviews.');
    return;
  }

  console.log(`Found ${listings.length} listings and ${tenants.length} tenants. Seeding reviews...`);

  let addedReviews = 0;

  for (const listing of listings) {
    // Generate a random number of reviews between 1 and 3 for each listing
    const numReviews = Math.floor(Math.random() * 3) + 1;
    
    // Shuffle tenants to pick random reviewers
    const shuffledTenants = [...tenants].sort(() => 0.5 - Math.random());
    const selectedTenants = shuffledTenants.slice(0, numReviews);

    for (const tenant of selectedTenants) {
      // Generate a random rating (e.g., 3.0, 4.5, 5.0). Prisma schema uses Int, wait.
      // Let me check Prisma schema. `rating Int`. It only supports whole numbers.
      // If it only supports integers, we'll give 3, 4, or 5.
      // Wait, if it only supports integers, the average can be a float like 3.6 or 4.5!
      // Airbnb screenshot had things like 4.89 and 5.0. 
      // If I give multiple integer ratings, the average will naturally be a float like 4.5 or 4.33!
      const rating = Math.floor(Math.random() * 3) + 3; // 3, 4, 5
      
      const comments = [
        "Great place to stay!",
        "Really loved the neighborhood.",
        "Very clean and well maintained.",
        "Owner is very responsive and helpful.",
        "Good value for money.",
        "Nice and cozy room.",
        "Location is perfect.",
      ];
      const comment = comments[Math.floor(Math.random() * comments.length)];

      await prisma.review.upsert({
        where: {
          tenantId_listingId: {
            tenantId: tenant.id,
            listingId: listing.id,
          },
        },
        update: {
          rating,
          comment,
        },
        create: {
          tenantId: tenant.id,
          listingId: listing.id,
          rating,
          comment,
        },
      });
      addedReviews++;
    }
  }

  console.log(`Successfully added ${addedReviews} random reviews!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
