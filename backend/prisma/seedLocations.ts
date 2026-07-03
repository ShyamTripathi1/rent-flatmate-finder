import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", 
  "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", 
  "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad", 
  "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli", 
  "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", 
  "Navi Mumbai", "Allahabad", "Howrah", "Ranchi", "Gwalior", "Jabalpur", 
  "Coimbatore", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Chandigarh", 
  "Guwahati", "Solapur", "Hubli-Dharwad", "Bareilly", "Moradabad", "Mysore", 
  "Gurgaon", "Aligarh", "Jalandhar", "Tiruchirappalli", "Bhubaneswar", "Salem", 
  "Mira-Bhayandar", "Warangal", "Thiruvananthapuram", "Bhiwandi", "Saharanpur", 
  "Guntur", "Amravati", "Bikaner", "Noida", "Jamshedpur", "Bhilai", "Cuttack", 
  "Firozabad", "Kochi", "Nellore", "Bhavnagar", "Dehradun", "Durgapur", "Asansol", 
  "Rourkela", "Nanded", "Kolhapur", "Ajmer", "Akola", "Gulbarga", "Jamnagar", 
  "Ujjain", "Loni", "Siliguri", "Jhansi", "Ulhasnagar", "Jammu", 
  "Sangli-Miraj & Kupwad", "Mangalore", "Erode", "Belgaum", "Ambattur", 
  "Tirunelveli", "Malegaon", "Gaya", "Jalgaon", "Udaipur", "Maheshtala"
].sort();

const roomTypes = ['single', 'shared', 'studio'];
const furnishingStatuses = ['furnished', 'semi-furnished', 'unfurnished'];

async function main() {
  console.log('Fetching an owner to assign listings...');
  
  // Find an owner user
  let owner = await prisma.user.findFirst({
    where: { role: 'OWNER' }
  });

  if (!owner) {
    console.log('No owner found. Please run regular seed or create an owner account first.');
    return;
  }

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

  for (const city of INDIAN_CITIES) {
    const streetsPool = cityStreets[city] || genericIndianStreets;

    for (let i = 0; i < 5; i++) {
      const rent = Math.floor(Math.random() * (30000 - 5000 + 1) + 5000); // Random rent between 5000 and 30000 INR
      const rType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      const fStatus = furnishingStatuses[Math.floor(Math.random() * furnishingStatuses.length)];
      const availableDate = new Date();
      availableDate.setDate(availableDate.getDate() + Math.floor(Math.random() * 30)); // Available within next 30 days
      
      const street = streetsPool[Math.floor(Math.random() * streetsPool.length)];
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
          description: `A lovely ${fStatus} ${rType} flat located in the heart of ${city}. Great connectivity to local markets and transport.`,
        }
      });
    }
  }

  console.log(`Successfully added ${INDIAN_CITIES.length * 5} listings!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
