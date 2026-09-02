import { test, expect } from "@playwright/test";

test.describe("Dashboard Live Tests", () => {
  test("login and test all dashboard pages authenticated", async ({ page }) => {
    const pageErrors: { message: string; stack?: string }[] = [];
    page.on("pageerror", (err) => {
      console.error(`[PAGE CRASH] ${err.message}\nStack: ${err.stack}`);
      pageErrors.push({ message: err.message, stack: err.stack });
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error(`[BROWSER ERROR] ${msg.text()}`);
      }
    });

    // Go to login page
    console.log("\nNavigating to login...");
    await page.goto("https://www.bhoomitayi.com/auth/login", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);

    // Fill credentials in login form specifically
    console.log("Filling login form...");
    await page.locator("form").first().locator('input[type="email"], input#email').first().fill("admin@bhoomitayi.com");
    await page.locator("form").first().locator('input[type="password"], input#password').first().fill("admin123");
    await page.locator("form").first().locator('button[type="submit"]').click();

    await page.waitForTimeout(5000);
    console.log("After login attempt, URL is:", page.url());

    // Test /dashboard
    console.log("\nTesting https://www.bhoomitayi.com/dashboard");
    await page.goto("https://www.bhoomitayi.com/dashboard", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log("Dashboard overview URL:", page.url());

    // Test /dashboard/my-listings
    console.log("\nTesting https://www.bhoomitayi.com/dashboard/my-listings");
    await page.goto("https://www.bhoomitayi.com/dashboard/my-listings", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log("My Listings URL:", page.url());

    // Test /dashboard/favorites
    console.log("\nTesting https://www.bhoomitayi.com/dashboard/favorites");
    await page.goto("https://www.bhoomitayi.com/dashboard/favorites", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log("Favorites URL:", page.url());

    // Test /dashboard/profile
    console.log("\nTesting https://www.bhoomitayi.com/dashboard/profile");
    await page.goto("https://www.bhoomitayi.com/dashboard/profile", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log("Profile URL:", page.url());

    console.log("\nTotal Page Errors:", pageErrors);
    expect(pageErrors.length).toBe(0);
  });
});
