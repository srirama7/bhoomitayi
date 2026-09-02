import { test, expect } from "@playwright/test";

test.describe("Local Authenticated Dashboard Tests", () => {
  test.setTimeout(120000);

  test("navigate through all dashboard pages and verify they load cleanly", async ({ page }) => {
    const pageErrors: any[] = [];
    page.on("pageerror", (err) => {
      console.log(`\n================== DETECTED PAGE ERROR ==================`);
      console.log("Message:", err.message);
      console.log("Stack:", err.stack);
      console.log(`=========================================================\n`);
      pageErrors.push(err);
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`[BROWSER ERROR] ${msg.text()}`);
      }
    });

    console.log("\n1. Navigating to http://localhost:3000/auth/login...");
    await page.goto("http://localhost:3000/auth/login", { waitUntil: "networkidle", timeout: 60000 });
    console.log("Login page loaded. Page title:", await page.title());

    console.log("\n2. Logging in with credentials...");
    await page.locator("input#email").fill("admin@bhoomitayi.com");
    await page.locator("input#password").fill("admin");
    await page.locator("button:has-text('Sign In')").click();

    // Wait for redirect to finish
    await page.waitForTimeout(6000);
    console.log("Current URL after login:", page.url());

    // 3. Test /dashboard
    console.log("\n3. Testing /dashboard...");
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(3000);
    console.log("Dashboard URL:", page.url());

    // 4. Test /dashboard/my-listings
    console.log("\n4. Testing /dashboard/my-listings...");
    await page.goto("http://localhost:3000/dashboard/my-listings", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(3000);
    console.log("My Listings URL:", page.url());

    // 5. Test /dashboard/favorites
    console.log("\n5. Testing /dashboard/favorites...");
    await page.goto("http://localhost:3000/dashboard/favorites", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(3000);
    console.log("Favorites URL:", page.url());

    // 6. Test /dashboard/profile
    console.log("\n6. Testing /dashboard/profile...");
    await page.goto("http://localhost:3000/dashboard/profile", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(3000);
    console.log("Profile URL:", page.url());

    // 7. Test /dashboard/settings
    console.log("\n7. Testing /dashboard/settings...");
    await page.goto("http://localhost:3000/dashboard/settings", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(3000);
    console.log("Settings URL:", page.url());

    // 8. Test /dashboard/tommy
    console.log("\n8. Testing /dashboard/tommy...");
    await page.goto("http://localhost:3000/dashboard/tommy", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(3000);
    console.log("Tommy URL:", page.url());

    console.log("\n=== ALL PAGE ERRORS CAUGHT ===");
    console.log("Total errors:", pageErrors.length);

    expect(pageErrors.length).toBe(0);
  });
});
