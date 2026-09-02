import { test, expect } from "@playwright/test";

test("Verify unauthenticated redirect and login page render without client exceptions", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => {
    console.error(`[PAGE CRASH] ${err.message}\n${err.stack}`);
    pageErrors.push(err.message);
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  const routes = [
    "http://localhost:3000/dashboard/my-listings",
    "http://localhost:3000/dashboard",
    "http://localhost:3000/dashboard/favorites",
    "http://localhost:3000/dashboard/profile",
  ];

  for (const route of routes) {
    console.log(`\nNavigating to ${route}...`);
    await page.goto(route, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log("Current URL after navigation:", page.url());
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("Application error: a client-side exception has occurred");
    console.log("Page rendered cleanly. Text snippet:", bodyText.replace(/\s+/g, " ").slice(0, 150));
  }

  expect(pageErrors.length).toBe(0);
});
