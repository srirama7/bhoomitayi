import { test, expect } from "@playwright/test";

test("Debug Google Sign-In error on bhoomitayi.com", async ({ page }) => {
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];

  // Capture ALL console messages
  page.on("console", (msg) => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    consoleErrors.push(text);
    console.log(text);
  });

  // Capture page errors
  page.on("pageerror", (err) => {
    const text = `[PAGE ERROR] ${err.message}`;
    consoleErrors.push(text);
    console.log(text);
  });

  // Capture failed requests
  page.on("requestfailed", (request) => {
    const text = `[NETWORK FAIL] ${request.url()} - ${request.failure()?.errorText}`;
    networkErrors.push(text);
    console.log(text);
  });

  // Navigate to the live login page
  await page.goto("https://www.bhoomitayi.com/auth/login", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  // Take screenshot of login page
  await page.screenshot({ path: "tests/screenshots/login-page.png", fullPage: true });

  console.log("\n=== LOGIN PAGE LOADED ===");
  console.log("URL:", page.url());
  console.log("Title:", await page.title());

  // Look for Google Sign-In button
  const googleButton = page.locator("button").filter({ hasText: /google/i }).first();
  const googleButtonExists = await googleButton.isVisible().catch(() => false);
  console.log("Google button visible:", googleButtonExists);

  if (googleButtonExists) {
    console.log("\n=== CLICKING GOOGLE SIGN IN ===");
    
    // Listen for the popup that Google opens
    const popupPromise = page.waitForEvent("popup", { timeout: 10000 }).catch(() => null);
    
    await googleButton.click();
    
    // Wait a moment to capture errors
    await page.waitForTimeout(3000);

    // Screenshot after click
    await page.screenshot({ path: "tests/screenshots/after-google-click.png", fullPage: true });

    const popup = await popupPromise;
    if (popup) {
      console.log("Popup opened:", popup.url());
      await popup.screenshot({ path: "tests/screenshots/google-popup.png", fullPage: true });
    } else {
      console.log("No popup opened - checking for error toast...");
    }
  }

  // Wait for any toast/error messages
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "tests/screenshots/final-state.png", fullPage: true });

  console.log("\n=== ALL CONSOLE MESSAGES ===");
  consoleErrors.forEach((e) => console.log(e));

  console.log("\n=== NETWORK FAILURES ===");
  networkErrors.forEach((e) => console.log(e));

  // Check for error toast on page
  const errorToast = page.locator("[data-sonner-toast]").or(page.locator(".toast")).first();
  const toastVisible = await errorToast.isVisible().catch(() => false);
  if (toastVisible) {
    console.log("Toast message:", await errorToast.textContent());
  }

  // Check page HTML for Firebase config
  const html = await page.content();
  const hasFirebaseConfig = html.includes("firebaseapp.com");
  console.log("Firebase config found in page:", hasFirebaseConfig);
});
