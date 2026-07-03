import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cityStreets: Record<string, string[]> = {
  "Mumbai": ["Linking Road, Bandra", "Lokhandwala, Andheri", "Marine Drive", "Powai", "Colaba", "Juhu Tara Road", "Dadar TT", "Malad West"],
  "Delhi": ["Connaught Place", "Vasant Kunj", "Hauz Khas", "Karol Bagh", "Lajpat Nagar", "Defence Colony", "Saket", "Greater Kailash"],
  "Bengaluru": ["Koramangala", "Indiranagar", "Whitefield", "Jayanagar", "HSR Layout", "Malleswaram", "Electronic City", "BTM Layout"],
  "Hyderabad": ["Banjara Hills", "Jubilee Hills", "HITEC City", "Gachibowli", "Madhapur", "Kondapur", "Begumpet", "Kukatpally"],
  "Chennai": ["T. Nagar", "Adyar", "Velachery", "Besant Nagar", "Anna Nagar", "Mylapore", "Nungambakkam", "Thiruvanmiyur"],
  "Pune": ["Koregaon Park", "Kalyani Nagar", "Viman Nagar", "Hinjewadi", "Baner", "Wakad", "Aundh", "Shivajinagar"],
  "Kolkata": ["Salt Lake", "Park Street", "New Town", "Ballygunge", "Alipore", "Dum Dum", "Rajarhat", "Gariahat"],
  "Ahmedabad": ["SG Highway", "Vastrapur", "Navrangpura", "Satellite", "Bopal", "Prahlad Nagar", "Maninagar"],
  "Jaipur": ["Malviya Nagar", "Vaishali Nagar", "C-Scheme", "Mansarovar", "Bapu Nagar", "Raja Park", "Jagatpura"],
  "Chandigarh": ["Sector 15", "Sector 17", "Sector 22", "Sector 35", "Manimajra"],
  "Lucknow": ["Gomti Nagar", "Hazratganj", "Aliganj", "Indira Nagar", "Mahanagar"],
  "Indore": ["Vijay Nagar", "Palasia", "Bhawarkua", "Saket Nagar", "Rajendra Nagar"],
  "Manali": ["Mall Road", "Old Manali", "Aleo", "Vashisht"],
  "Shimla": ["The Mall", "Lakkar Bazaar", "Sanjauli", "Chotta Shimla"],
  "Ooty": ["Commercial Road", "Charing Cross", "Coonoor Road"],
  "Puducherry": ["White Town", "Auroville Road", "Mission Street"]
};

const genericIndianStreets = [
  "MG Road", "Station Road", "Gandhi Marg", "Subhash Road", "Nehru Nagar", 
  "Civil Lines", "Sadar Bazaar", "Patel Nagar", "Main Market Road", "Ring Road"
];

async function main() {
  console.log('Fetching all listings to update to realistic local streets...');
  const listings = await prisma.listing.findMany();

  let updateCount = 0;
  for (const listing of listings) {
    // Extract the city (it's always the part after the last comma, or the whole string if no comma)
    let city = listing.location;
    const parts = listing.location.split(',');
    if (parts.length > 1) {
      city = parts[parts.length - 1].trim();
    } else {
      city = city.trim();
    }

    // Get realistic street list for this city, or fallback to generic Indian streets
    const streetsPool = cityStreets[city] || genericIndianStreets;
    const selectedStreet = streetsPool[Math.floor(Math.random() * streetsPool.length)];
    const houseNo = Math.floor(Math.random() * 999) + 1;
    
    // Some cities already have the neighborhood in the street array. We just combine them.
    const newLocation = `${houseNo} ${selectedStreet}, ${city}`;

    await prisma.listing.update({
      where: { id: listing.id },
      data: { location: newLocation }
    });
    updateCount++;
  }

  console.log(`Updated ${updateCount} existing listings to include realistic local street names.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
