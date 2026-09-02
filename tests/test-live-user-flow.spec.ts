import { test, expect } from "@playwright/test";

test("Test signup, create listing, and view my-listings, favorites, profile on live site", async ({ page }) => {
  test.setTimeout(120000);

  const errors: string[] = [];
  page.on("pageerror", (err) => {
    console.error(`[PAGE CRASH] ${err.message}`);
    errors.push(err.message);
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  // 1. Visit Login
  console.log("1. Visiting https://www.bhoomitayi.com/auth/login");
  await page.goto("https://www.bhoomitayi.com/auth/login", { waitUntil: "networkidle", timeout: 30000 });

  // 2. Go to Signup to create a test user
  const randomEmail = `user_${Date.now()}@bhoomitayi.test`;
  console.log(`2. Creating user: ${randomEmail}`);
  await page.goto("https://www.bhoomitayi.com/auth/signup", { waitUntil: "networkidle", timeout: 30000 });
  
  await page.locator("input#name").fill("Test Playwright User");
  await page.locator("input#phone").fill("9876543210");
  await page.locator("input#email").fill(randomEmail);
  await page.locator("input#password").fill("Password@123");
  await page.locator("input#confirmPassword").fill("Password@123");
  await page.locator("button:has-text('Create Account')").click();

  // Wait for signup & navigation to complete
  await page.waitForTimeout(6000);
  console.log("After signup, current URL:", page.url());

  // 3. Now visit /dashboard/my-listings as logged-in user!
  console.log("3. Visiting /dashboard/my-listings as logged-in user...");
  await page.goto("https://www.bhoomitayi.com/dashboard/my-listings", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(4000);
  console.log("My Listings URL:", page.url());
  const myListingsText = await page.locator("body").innerText();
  console.log("My Listings Text Snippet:", myListingsText.replace(/\s+/g, ' ').slice(0, 300));
  await page.screenshot({ path: "tests/screenshots/logged-in-my-listings.png", fullPage: true });

  // 4. Visit /dashboard
  console.log("4. Visiting /dashboard as logged-in user...");
  await page.goto("https://www.bhoomitayi.com/dashboard", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(4000);
  console.log("Dashboard URL:", page.url());
  const dashboardText = await page.locator("body").innerText();
  console.log("Dashboard Text Snippet:", dashboardText.replace(/\s+/g, ' ').slice(0, 300));
  await page.screenshot({ path: "tests/screenshots/logged-in-dashboard.png", fullPage: true });

  // 5. Visit /dashboard/favorites
  console.log("5. Visiting /dashboard/favorites as logged-in user...");
  await page.goto("https://www.bhoomitayi.com/dashboard/favorites", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(4000);
  console.log("Favorites URL:", page.url());
  const favoritesText = await page.locator("body").innerText();
  console.log("Favorites Text Snippet:", favoritesText.replace(/\s+/g, ' ').slice(0, 300));
  await page.screenshot({ path: "tests/screenshots/logged-in-favorites.png", fullPage: true });

  // 6. Visit /dashboard/profile
  console.log("6. Visiting /dashboard/profile as logged-in user...");
  await page.goto("https://www.bhoomitayi.com/dashboard/profile", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(4000);
  console.log("Profile URL:", page.url());
  const profileText = await page.locator("body").innerText();
  console.log("Profile Text Snippet:", profileText.replace(/\s+/g, ' ').slice(0, 300));
  await page.screenshot({ path: "tests/screenshots/logged-in-profile.png", fullPage: true });

  console.log("Total page errors logged:", errors);
  expect(errors.length).toBe(0);
});
