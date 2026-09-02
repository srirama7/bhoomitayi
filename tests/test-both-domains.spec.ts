import { test, expect } from "@playwright/test";

test("Check bhoomitayiversion2.vercel.app and www.bhoomitayi.com", async ({ page }) => {
  page.on("pageerror", (err) => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  console.log("\n1. Testing https://bhoomitayiversion2.vercel.app/dashboard/my-listings...");
  await page.goto("https://bhoomitayiversion2.vercel.app/dashboard/my-listings", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log("Vercel URL:", page.url());
  const vBody = await page.locator("body").innerText();
  console.log("Vercel Body Snippet:", vBody.replace(/\s+/g, " ").slice(0, 200));

  console.log("\n2. Testing https://www.bhoomitayi.com/dashboard/my-listings...");
  await page.goto("https://www.bhoomitayi.com/dashboard/my-listings", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log("Custom Domain URL:", page.url());
  const cBody = await page.locator("body").innerText();
  console.log("Custom Domain Body Snippet:", cBody.replace(/\s+/g, " ").slice(0, 200));
});
