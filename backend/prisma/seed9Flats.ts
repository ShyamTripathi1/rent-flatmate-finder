import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cityStreets: Record<string, string[]> = {
  "Mumbai": ["Linking Road, Bandra", "Lokhandwala, Andheri", "Marine Drive", "Powai", "Colaba", "Juhu Tara Road", "Dadar TT", "Malad West", "Worli Sea Face"],
  "Delhi": ["Connaught Place", "Vasant Kunj", "Hauz Khas", "Karol Bagh", "Lajpat Nagar", "Defence Colony", "Saket", "Greater Kailash", "Dwarka Sector 10"],
  "Bengaluru": ["Koramangala", "Indiranagar", "Whitefield", "Jayanagar", "HSR Layout", "Malleswaram", "Electronic City", "BTM Layout", "JP Nagar"],
  "Hyderabad": ["Banjara Hills", "Jubilee Hills", "HITEC City", "Gachibowli", "Madhapur", "Kondapur", "Begumpet", "Kukatpally", "Secunderabad"],
  "Chennai": ["T. Nagar", "Adyar", "Velachery", "Besant Nagar", "Anna Nagar", "Mylapore", "Nungambakkam", "Thiruvanmiyur", "Porur"],
  "Pune": ["Koregaon Park", "Kalyani Nagar", "Viman Nagar", "Hinjewadi", "Baner", "Wakad", "Aundh", "Shivajinagar", "Kothrud"],
  "Kolkata": ["Salt Lake", "Park Street", "New Town", "Ballygunge", "Alipore", "Dum Dum", "Rajarhat", "Gariahat", "Howrah Maidan"],
  "Ahmedabad": ["SG Highway", "Vastrapur", "Navrangpura", "Satellite", "Bopal", "Prahlad Nagar", "Maninagar", "Thaltej", "Chandkheda"],
  "Jaipur": ["Malviya Nagar", "Vaishali Nagar", "C-Scheme", "Mansarovar", "Bapu Nagar", "Raja Park", "Jagatpura", "Tonk Road", "Sodala"],
  "Chandigarh": ["Sector 15", "Sector 17", "Sector 22", "Sector 35", "Manimajra", "Sector 43", "Sector 8", "Sector 26", "Sector 44"],
  "Lucknow": ["Gomti Nagar", "Hazratganj", "Aliganj", "Indira Nagar", "Mahanagar", "Aminabad", "Alambagh", "Chowk", "Rajajipuram"],
  "Indore": ["Vijay Nagar", "Palasia", "Bhawarkua", "Saket Nagar", "Rajendra Nagar", "Annapurna Road", "Sapna Sangeeta", "MG Road", "Scheme No 78"],
  "Surat": ["Adajan", "Vesu", "Athwa", "Piplod", "City Light", "Katargam", "Varachha", "Pal", "Althan"],
  "Nagpur": ["Dharampeth", "Sitabuldi", "Sadar", "Civil Lines", "Manewada", "Wardha Road", "Ramdaspeth", "Laxmi Nagar", "Bajaj Nagar"],
  "Bhopal": ["MP Nagar", "Arera Colony", "Kolar Road", "Hoshangabad Road", "Shahpura", "TT Nagar", "Bairagarh", "Habibganj", "Govindpura"],
  "Kanpur": ["Mall Road", "Swaroop Nagar", "Kakadeo", "Kidwai Nagar", "Civil Lines", "Harsh Nagar", "Shastri Nagar", "Rawatpur", "Kalyanpur"],
  "Patna": ["Boring Road", "Kankarbagh", "Rajendra Nagar", "Bailey Road", "Ashiana Nagar", "Patliputra", "Danapur", "Anisabad", "Bankipur"],
  "Varanasi": ["Lanka", "Assi Ghat", "Godowlia", "Sigra", "Bhelupur", "Mahmoorganj", "Cantonment", "Sarnath", "Pandeypur"],
  "Kochi": ["MG Road", "Marine Drive", "Edappally", "Kakkanad", "Panampilly Nagar", "Vyttila", "Kaloor", "Fort Kochi", "Aluva"],
  "Guwahati": ["GS Road", "Zoo Road", "Ganeshguri", "Paltan Bazaar", "Chandmari", "Beltola", "Dispur", "Maligaon", "Panbazar"],
  "Manali": ["Mall Road", "Old Manali", "Aleo", "Vashisht", "Hadimba Road", "Club House Road", "Naggar Road", "Log Huts", "Manu Temple Road"],
  "Shimla": ["The Mall", "Lakkar Bazaar", "Sanjauli", "Chotta Shimla", "Khalini", "Summer Hill", "Mashobra Road", "Cart Road", "Tutikandi"],
  "Ooty": ["Commercial Road", "Charing Cross", "Coonoor Road", "Elk Hill Road", "Havelock Road", "Kelso Road", "Mysore Road", "Club Road", "Charring Cross"],
  "Darjeeling": ["Mall Road", "Gandhi Road", "Laden La Road", "Hill Cart Road", "Chowrasta", "Zakir Hussain Road", "Nehru Road", "Tenzing Norgay Road", "Robertson Road"],
  "Puducherry": ["White Town", "Auroville Road", "Mission Street", "MG Road", "Rue Suffren", "Beach Road", "Nehru Street", "Ambour Salai", "Anna Salai"],
  "Rishikesh": ["Ram Jhula Road", "Laxman Jhula Road", "Tapovan", "Badrinath Road", "Haridwar Road", "Swarg Ashram", "Muni Ki Reti", "Ghat Road", "Neelkanth Road"],
  "Haridwar": ["Railway Road", "Upper Road", "Jwalapur", "Har Ki Pauri", "Ranipur", "Shivpuri", "Kankhal", "Bahadrabad", "Bhimgoda"],
  "Lonavala": ["Shivaji Road", "Old Mumbai-Pune Highway", "Tungarli", "Kumar Resort Road", "INS Shivaji Road", "Tiger Point Road", "Lion Point Road", "Bushi Dam Road", "Amby Valley Road"],
  "Dehradun": ["Rajpur Road", "Sahastradhara Road", "GMS Road", "Clock Tower", "Paltan Bazaar", "Race Course", "Dalanwala", "Clement Town", "Nehru Colony"],
  "Mysore": ["Sayyaji Rao Road", "Devaraja Urs Road", "JLB Road", "Hunsur Road", "Nazarbad", "Kuvempunagar", "Vijayanagar", "Gokulam", "Jayalakshmipuram"],
  "Coimbatore": ["RS Puram", "Race Course", "Gandhipuram", "Peelamedu", "Saibaba Colony", "Ram Nagar", "Town Hall", "Avinashi Road", "Singanallur"],
  "Thiruvananthapuram": ["MG Road", "Kowdiar", "Vazhuthacaud", "Pattom", "Statue Junction", "Palayam", "Thampanoor", "Vellayambalam", "Sasthamangalam"],
  "Visakhapatnam": ["RK Beach Road", "Dwaraka Nagar", "MVP Colony", "Siripuram", "Lawsons Bay", "Waltair Uplands", "Madhura Nagar", "Seethammadhara", "Gajuwaka"],
  "Noida": ["Sector 18", "Sector 62", "Sector 137", "Sector 50", "Sector 76", "Sector 44", "Sector 15A", "Sector 120", "Sector 104"],
  "Gurgaon": ["DLF Phase 1", "Sohna Road", "MG Road", "Golf Course Road", "Sector 56", "Sector 49", "Cyber City", "Udyog Vihar", "South City"],
  "Udaipur": ["Hiran Magri", "Fateh Sagar Road", "Ashok Nagar", "Surajpole", "Chetak Circle", "University Road", "Durga Nursery Road", "Saheli Nagar", "Bhatt Ji Ki Bari"],
};

const genericIndianStreets = [
  "MG Road", "Station Road", "Gandhi Marg", "Subhash Road", "Nehru Nagar",
  "Civil Lines", "Sadar Bazaar", "Patel Nagar", "Main Market Road", "Ring Road"
];

const INDIAN_CITIES = [
  "Mumbai","Delhi","Bengaluru","Hyderabad","Ahmedabad","Chennai","Kolkata","Surat","Pune","Jaipur",
  "Lucknow","Kanpur","Nagpur","Indore","Thane","Bhopal","Visakhapatnam","Pimpri-Chinchwad","Patna",
  "Vadodara","Ghaziabad","Ludhiana","Agra","Nashik","Faridabad","Meerut","Rajkot","Kalyan-Dombivli",
  "Vasai-Virar","Varanasi","Srinagar","Aurangabad","Dhanbad","Amritsar","Navi Mumbai","Allahabad",
  "Howrah","Ranchi","Gwalior","Jabalpur","Coimbatore","Vijayawada","Jodhpur","Madurai","Raipur",
  "Chandigarh","Guwahati","Solapur","Hubli-Dharwad","Bareilly","Moradabad","Mysore","Gurgaon",
  "Aligarh","Jalandhar","Tiruchirappalli","Bhubaneswar","Salem","Mira-Bhayandar","Warangal",
  "Thiruvananthapuram","Bhiwandi","Saharanpur","Guntur","Amravati","Bikaner","Noida","Jamshedpur",
  "Bhilai","Cuttack","Firozabad","Kochi","Nellore","Bhavnagar","Dehradun","Durgapur","Asansol",
  "Rourkela","Nanded","Kolhapur","Ajmer","Akola","Gulbarga","Jamnagar","Ujjain","Loni","Siliguri",
  "Jhansi","Ulhasnagar","Jammu","Sangli-Miraj & Kupwad","Mangalore","Erode","Belgaum","Ambattur",
  "Tirunelveli","Malegaon","Gaya","Jalgaon","Udaipur","Maheshtala","Manali","Shimla","Ooty",
  "Darjeeling","Munnar","Lonavala","Alibaug","Rishikesh","Haridwar","Puducherry"
];

const roomTypes = ['single', 'shared', 'studio'];
const furnishingStatuses = ['furnished', 'semi-furnished', 'unfurnished'];

const interiorPhotos = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1502672260266-1c158bf43936?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1583847268964-b28ce8f52859?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1598928506311-c55dd1821876?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1463620910506-d0458143143e?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&h=400&fit=crop"
];

function getRandomPhotos(n: number) {
  const shuffled = [...interiorPhotos].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

async function main() {
  console.log('Deleting all existing seeded listings...');
  await prisma.listing.deleteMany({});
  console.log('All listings cleared.');

  const owner = await prisma.user.findFirst({ where: { role: 'OWNER' } });
  if (!owner) {
    console.log('No owner found. Please register an owner first.');
    return;
  }

  console.log(`Seeding 9 flats per city for ${INDIAN_CITIES.length} cities...`);

  let totalCount = 0;
  for (const city of INDIAN_CITIES) {
    const streetsPool = cityStreets[city] || genericIndianStreets;

    for (let i = 0; i < 9; i++) {
      const rent = Math.floor(Math.random() * (30000 - 5000 + 1) + 5000);
      const rType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      const fStatus = furnishingStatuses[Math.floor(Math.random() * furnishingStatuses.length)];
      const availableDate = new Date();
      availableDate.setDate(availableDate.getDate() + Math.floor(Math.random() * 30));

      const street = streetsPool[i % streetsPool.length]; // cycle through streets so each flat gets a different one
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

  console.log(`Done! Seeded ${totalCount} flats across ${INDIAN_CITIES.length} cities (9 per city).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
