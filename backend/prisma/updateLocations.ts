import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mockStreets = ['Main Street', 'Park Avenue', 'MG Road', 'Station Road', 'Link Road', 'High Street', 'Church Road', 'Temple Street'];

const extraTowns = [
  "Manali", "Shimla", "Ooty", "Darjeeling", "Munnar", 
  "Lonavala", "Alibaug", "Rishikesh", "Haridwar", "Puducherry"
];
const roomTypes = ['single', 'shared', 'studio'];
const furnishingStatuses = ['furnished', 'semi-furnished', 'unfurnished'];

async function main() {
  console.log('Fetching all listings to ensure they have street numbers...');
  const listings = await prisma.listing.findMany();

  let updateCount = 0;
  for (const listing of listings) {
    // If there is no comma, it implies no street address was provided
    if (!listing.location.includes(',')) {
      const street = mockStreets[Math.floor(Math.random() * mockStreets.length)];
      const houseNo = Math.floor(Math.random() * 999) + 1;
      
      const newLocation = `${houseNo} ${street}, ${listing.location}`;
      await prisma.listing.update({
        where: { id: listing.id },
        data: { location: newLocation }
      });
      updateCount++;
    }
  }

  console.log(`Updated ${updateCount} existing listings to include street numbers.`);

  console.log('Fetching an owner to assign new listings for the various extra towns...');
  let owner = await prisma.user.findFirst({
    where: { role: 'OWNER' }
  });

  if (owner) {
    let addedCount = 0;
    for (const city of extraTowns) {
      for (let i = 0; i < 5; i++) { // Add 5 flats per new town
        const rent = Math.floor(Math.random() * (30000 - 5000 + 1) + 5000);
        const rType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
        const fStatus = furnishingStatuses[Math.floor(Math.random() * furnishingStatuses.length)];
        const availableDate = new Date();
        availableDate.setDate(availableDate.getDate() + Math.floor(Math.random() * 30)); 
        const street = mockStreets[Math.floor(Math.random() * mockStreets.length)];
        const houseNo = Math.floor(Math.random() * 999) + 1;
        
        await prisma.listing.create({
          data: {
            ownerId: owner.id,
            location: `${houseNo} ${street}, ${city}`,
            rent: rent,
            availableFrom: availableDate,
            roomType: rType,
            furnishingStatus: fStatus,
            photos: '[]',
            description: `A lovely ${fStatus} ${rType} flat located in the beautiful town of ${city}. Great connectivity to local markets and transport.`,
          }
        });
        addedCount++;
      }
    }
    console.log(`Added ${addedCount} new listings for the various towns!`);
  } else {
    console.log('No owner found to create new listings.');
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
