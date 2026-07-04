import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('requestfailed', request => {
    console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  // wait for a bit to let React render and fetch
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.content();
  if (content.includes('TENANTS (0)')) {
    console.log('FOUND TENANTS (0)');
  } else {
    console.log('DID NOT FIND TENANTS (0)');
  }
  
  await browser.close();
})();
