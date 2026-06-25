import { test } from "@playwright/test";

test("Capture exact Google redirect error", async ({ page }) => {
  const errors: string[] = [];

  page.on("console", (msg) => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    errors.push(text);
    console.log(text);
  });

  page.on("pageerror", (err) => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  // Go to login page
  await page.goto("https://www.bhoomitayi.com/auth/login", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  console.log("\n=== PAGE LOADED ===");

  // Wait 5 seconds to let getRedirectResult run and show any errors
  await page.waitForTimeout(5000);
  await page.screenshot({ path: "tests/screenshots/on-load.png", fullPage: true });

  // Check for any toast errors on load (from getRedirectResult)
  const toast = page.locator("[data-sonner-toast]").first();
  const toastVisible = await toast.isVisible().catch(() => false);
  if (toastVisible) {
    console.log("TOAST ON LOAD:", await toast.textContent());
  }

  // Now click Google Sign-In
  const googleButton = page.locator("button").filter({ hasText: /google/i }).first();
  if (await googleButton.isVisible()) {
    console.log("\n=== CLICKING GOOGLE SIGN IN ===");
    await googleButton.click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "tests/screenshots/after-click.png", fullPage: true });

    // Check toast after click
    const toastAfter = page.locator("[data-sonner-toast]").first();
    const toastAfterVisible = await toastAfter.isVisible().catch(() => false);
    if (toastAfterVisible) {
      console.log("TOAST AFTER CLICK:", await toastAfter.textContent());
    }
  }

  console.log("\n=== ALL CONSOLE LOGS ===");
  errors.forEach(e => console.log(e));
});
