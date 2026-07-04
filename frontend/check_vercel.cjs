const https = require('https');

https.get('https://rent-flatmate-finder-eight.vercel.app/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Find script tags
    const scriptRegex = /<script type="module" crossorigin src="([^"]+)"><\/script>/g;
    let match;
    while ((match = scriptRegex.exec(data)) !== null) {
      const scriptUrl = 'https://rent-flatmate-finder-eight.vercel.app' + match[1];
      console.log('Fetching JS:', scriptUrl);
      https.get(scriptUrl, (res2) => {
        let jsData = '';
        res2.on('data', chunk => jsData += chunk);
        res2.on('end', () => {
          if (jsData.includes('http://localhost:5000')) {
            console.log('FOUND localhost:5000 in bundle');
          }
          if (jsData.includes('rent-flatmate-finder-f4ec.onrender.com')) {
            console.log('FOUND onrender.com in bundle');
          }
        });
      });
    }
  });
});
