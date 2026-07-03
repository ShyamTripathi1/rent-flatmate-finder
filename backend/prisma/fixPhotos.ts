import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Using picsum.photos - a reliable, always-available image placeholder service
// Each URL generates a unique image based on the seed parameter
const generatePhotos = (listingIndex: number): string[] => {
  const photos: string[] = [];
  for (let i = 0; i < 3; i++) {
    const seed = listingIndex * 10 + i;
    photos.push(`https://picsum.photos/seed/flat${seed}/600/400`);
  }
  return photos;
};

async function main() {
  console.log('Fetching all listings...');
  const listings = await prisma.listing.findMany();
  console.log(`Found ${listings.length} listings. Updating photos with reliable URLs...`);

  let count = 0;
  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    const photos = generatePhotos(i);

    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        photos: JSON.stringify(photos)
      }
    });
    count++;
  }

  console.log(`Successfully updated ${count} listings with unique, reliable photos!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
