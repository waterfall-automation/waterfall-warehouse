const { chromium } = require('@playwright/test');

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Registering network listeners...');
  const requests = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/sheets') || url.includes('exec') || url.includes('macros')) {
      requests.push({ url, time: Date.now() });
      console.log(`[Request] ${new Date().toISOString()} - ${url}`);
    }
  });

  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.log(`[Browser Error] ${err.message}`));

  console.log('Navigating to item details page /item-master/ITM-0001 ...');
  await page.goto('http://localhost:9002/item-master/ITM-0001');
  
  console.log('Waiting for 17 seconds to monitor network traffic...');
  await new Promise(resolve => setTimeout(resolve, 17000));

  console.log(`\n--- Network requests count: ${requests.length} ---`);
  requests.forEach((r, idx) => {
    console.log(`${idx + 1}. ${(r.time - requests[0].time) / 1000}s: ${r.url}`);
  });

  await browser.close();
}

main().catch(console.error);
