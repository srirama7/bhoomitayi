import { test, expect } from "@playwright/test";

test.describe("Local Dashboard Dev Tests", () => {
  test("test local dashboard pages to catch full react errors", async ({ page }) => {
    const errors: any[] = [];
    page.on("pageerror", (err) => {
      console.log(`\n================== DETECTED PAGE ERROR ==================`);
      console.log("Message:", err.message);
      console.log("Stack:", err.stack);
      console.log(`=========================================================\n`);
      errors.push(err);
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`[DEV CONSOLE ERROR] ${msg.text()}`);
      }
    });

    console.log("\nTesting http://localhost:3000/dashboard...");
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(4000);

    console.log("\nTesting http://localhost:3000/dashboard/my-listings...");
    await page.goto("http://localhost:3000/dashboard/my-listings", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(4000);

    console.log("\nTesting http://localhost:3000/dashboard/favorites...");
    await page.goto("http://localhost:3000/dashboard/favorites", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(4000);

    console.log("\nTesting http://localhost:3000/dashboard/profile...");
    await page.goto("http://localhost:3000/dashboard/profile", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(4000);

    console.log("Total errors:", errors.length);
  });
});
