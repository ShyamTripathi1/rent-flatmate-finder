import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate three unique placeholder images per listing using picsum.photos
const generatePlaceholderPhotos = (listingId: string): string[] => {
  const photos: string[] = [];
  for (let i = 0; i < 3; i++) {
    const seed = `${listingId}-${i}`;
    photos.push(`https://picsum.photos/seed/room${seed}/600/400`);
  }
  return photos;
};

async function main() {
  console.log('Fetching all listings...');
  const listings = await prisma.listing.findMany();

  console.log(`Found ${listings.length} listings. Adding placeholders where needed...`);
  let updated = 0;
  for (const listing of listings) {
    // If photos field is empty, null, undefined, or empty array string, add placeholder images
    if (!listing.photos || listing.photos === '[]') {
      const photos = generatePlaceholderPhotos(listing.id);
      await prisma.listing.update({
        where: { id: listing.id },
        data: { photos: JSON.stringify(photos) },
      });
      updated++;
    }
  }

  console.log(`Added placeholder images to ${updated} listings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
