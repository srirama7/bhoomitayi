import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const targetUrl = 'https://bhoomitayiversion2.vercel.app';
  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl);
  
  // Wait for the page to load
  await page.waitForTimeout(2000);
  
  console.log('Injecting MutationObserver...');
  const mutations = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const mutationCounts = {};
      
      const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          const target = mutation.target;
          let identifier = target.tagName;
          if (target.id) identifier += `#${target.id}`;
          if (target.className && typeof target.className === 'string') identifier += `.${target.className.split(' ').join('.')}`;
          
          if (!mutationCounts[identifier]) {
            mutationCounts[identifier] = 0;
          }
          mutationCounts[identifier]++;
        }
      });
      
      observer.observe(document.body, { attributes: true, childList: true, subtree: true, characterData: true });
      
      // Observe for 5 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(mutationCounts);
      }, 5000);
    });
  });
  
  console.log('Mutation Counts in 5 seconds (elements that changed):');
  const sortedMutations = Object.entries(mutations).sort((a, b) => b[1] - a[1]);
  for (const [element, count] of sortedMutations) {
    if (count > 2) {
      console.log(`${count} mutations on: ${element}`);
    }
  }
  
  await browser.close();
})();
