import { test } from "@playwright/test";

test("Diagnose live website dashboard pages", async ({ page }) => {
  const routes = [
    "https://www.bhoomitayi.com/dashboard/my-listings",
    "https://www.bhoomitayi.com/dashboard",
    "https://www.bhoomitayi.com/dashboard/profile",
    "https://www.bhoomitayi.com/dashboard/favorites",
  ];

  page.on("console", (msg) => {
    console.log(`[LIVE CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on("pageerror", (err) => {
    console.log(`[LIVE PAGE ERROR] ${err.message}\nStack: ${err.stack}`);
  });

  page.on("requestfailed", (req) => {
    console.log(`[LIVE NETWORK FAIL] ${req.url()} - ${req.failure()?.errorText}`);
  });

  page.on("response", (res) => {
    if (res.status() >= 400) {
      console.log(`[LIVE HTTP ${res.status()}] ${res.url()}`);
    }
  });

  for (const url of routes) {
    const slug = url.split("/").pop();
    console.log(`\n================== TESTING ${url} ==================`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log(`Final URL: ${page.url()}`);
    const bodyText = await page.locator("body").innerText();
    console.log(`Body Text Snippet: ${bodyText.replace(/\s+/g, ' ').slice(0, 300)}`);

    await page.screenshot({ path: `tests/screenshots/live-${slug}.png`, fullPage: true });
  }
});
