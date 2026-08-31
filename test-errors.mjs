import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  page.on('pageerror', exception => {
    errors.push(`Uncaught exception: "${exception}"`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error: "${msg.text()}"`);
    }
  });
  
  const targetUrl = 'https://bhoomitayiversion2.vercel.app';
  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl);
  await page.waitForTimeout(2000);
  
  // Click on the first listing card link
  const listingLink = await page.locator('a[href^="/listing/"]').first();
  const href = await listingLink.getAttribute('href');
  console.log(`Navigating to listing page: ${href}...`);
  // Navigate directly to avoid overlay issues
  await page.goto(`https://bhoomitayiversion2.vercel.app${href}`);
  await page.waitForTimeout(3000);
  
  console.log('Errors caught:');
  console.log(errors.join('\n'));
  
  await browser.close();
})();
