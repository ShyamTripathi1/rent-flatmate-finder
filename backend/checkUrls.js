import https from 'https';

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

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', (e) => {
      resolve({ url, status: 'error', error: e.message });
    });
  });
}

async function main() {
  const validUrls = [];
  for (const url of interiorPhotos) {
    const res = await checkUrl(url);
    console.log(res.status, res.url);
    if (res.status === 200) {
      validUrls.push(url);
    }
  }
  console.log('\nValid URLs:');
  console.log(JSON.stringify(validUrls, null, 2));
}

main();
