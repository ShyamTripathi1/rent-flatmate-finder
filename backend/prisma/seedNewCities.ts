import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const newCities = [
  "Agartala", "Aizawl", "Imphal", "Shillong", "Kohima", "Itanagar", 
  "Gangtok", "Port Blair", "Panaji", "Gandhinagar", "Kurnool", 
  "Anantapur", "Tirupati", "Rajamahendravaram", "Kakinada", 
  "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar"
];

const genericIndianStreets = [
  "MG Road", "Station Road", "Gandhi Marg", "Subhash Road", "Nehru Nagar",
  "Civil Lines", "Sadar Bazaar", "Patel Nagar", "Main Market Road", "Ring Road"
];

const roomTypes = ['single', 'shared', 'studio'];
const furnishingStatuses = ['furnished', 'semi-furnished', 'unfurnished'];

const validInteriorPhotos = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1463620910506-d0458143143e?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&h=400&fit=crop"
];

function getRandomPhotos(n: number) {
  const shuffled = [...validInteriorPhotos].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

async function main() {
  const owner = await prisma.user.findFirst({ where: { role: 'OWNER' } });
  if (!owner) {
    console.log('No owner found. Please register an owner first.');
    return;
  }

  console.log(`Seeding 9 flats per city for ${newCities.length} new cities...`);

  let totalCount = 0;
  for (const city of newCities) {
    const streetsPool = genericIndianStreets;

    for (let i = 0; i < 9; i++) {
      const rent = Math.floor(Math.random() * (30000 - 5000 + 1) + 5000);
      const rType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      const fStatus = furnishingStatuses[Math.floor(Math.random() * furnishingStatuses.length)];
      const availableDate = new Date();
      availableDate.setDate(availableDate.getDate() + Math.floor(Math.random() * 30));

      const street = streetsPool[i % streetsPool.length]; // cycle through streets
      const houseNo = Math.floor(Math.random() * 999) + 1;
      const photos = getRandomPhotos(3);

      await prisma.listing.create({
        data: {
          ownerId: owner.id,
          location: `${houseNo} ${street}, ${city}`,
          rent,
          availableFrom: availableDate,
          roomType: rType,
          furnishingStatus: fStatus,
          photos: JSON.stringify(photos),
          description: `A lovely ${fStatus} ${rType} room at ${street}, ${city}. Well connected to transport, markets and schools.`,
        }
      });
      totalCount++;
    }
  }

  console.log(`Done! Seeded ${totalCount} additional flats across ${newCities.length} new cities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
