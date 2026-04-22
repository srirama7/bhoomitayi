import { test, expect } from "@playwright/test";

test.describe("Admin Timer Management", () => {
  test("admin can log in and set timer for a listing", async ({ page }) => {
    // Navigate to admin login page
    await page.goto("/auth/login");

    // Log in with admin credentials (username: admin, password: admin)
    await page.locator('input[type="email"]').fill("admin");
    await page.locator('input[type="password"]').fill("admin");
    await page.locator('button[type="submit"]').click();

    // Wait for successful login and redirect to listings page
    await expect(page).toHaveURL(/\/dashboard\/admin\/listings/, { timeout: 10000 });

    // Verify we're on the admin listings page
    await expect(page.locator("h1")).toContainText("Admin Listings");

    // Wait for listings to load
    await page.waitForTimeout(2000);

    // Find the first listing card with timer section
    const timerSection = page.locator('text="Adjust Timer Duration"').or(
      page.locator('text="SET VISIBILITY TIMER"')
    );

    await timerSection.first().waitFor({ state: "visible", timeout: 10000 });

    // Find all number inputs for timer (MONTH, DAY, HR, MIN, SEC)
    const numberInputs = page.locator('input[type="number"]');
    const count = await numberInputs.count();

    if (count >= 5) {
      // Set timer: 0 months, 1 day, 0 hours, 0 minutes, 0 seconds
      await numberInputs.nth(0).fill("0"); // MONTH
      await numberInputs.nth(1).fill("1"); // DAY
      await numberInputs.nth(2).fill("0"); // HR
      await numberInputs.nth(3).fill("0"); // MIN
      await numberInputs.nth(4).fill("0"); // SEC

      // Click the "Update Timer" or "Save & Start Timer" button
      const updateButton = page.locator('button:has-text("Update Timer")').or(
        page.locator('button:has-text("Save")')
      ).first();

      await updateButton.click();

      // Wait for success toast notification
      await expect(page.locator('[data-sonner-toast]')).toContainText(
        /Timer updated|Timer started|activated/i,
        { timeout: 5000 }
      );
    }
  });

  test("admin can view timer countdown on listings", async ({ page }) => {
    // Navigate to admin login and log in
    await page.goto("/auth/login");
    await page.locator('input[type="email"]').fill("admin");
    await page.locator('input[type="password"]').fill("admin");
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard\/admin\/listings/, { timeout: 10000 });

    // Wait for listings to load
    await page.waitForTimeout(2000);

    // Check that listings show countdown timer with time units
    const countdownElement = page.locator('text=/HR|MIN|SEC|Time Remaining/i').first();
    await expect(countdownElement).toBeVisible();
  });

  test("verify timer visible on main website listing page", async ({ page }) => {
    // Log in as admin first
    await page.goto("/auth/login");
    await page.locator('input[type="email"]').fill("admin");
    await page.locator('input[type="password"]').fill("admin");
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard\/admin\/listings/, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Get the first listing ID from the "View" button
    const viewButton = page.locator('a:has-text("View")').first();
    const href = await viewButton.getAttribute("href");

    if (href) {
      const listingId = href.split("/listing/")[1];

      // Navigate to main website listing page
      await page.goto(`https://bhoomitayi.vercel.app/listing/${listingId}`);

      // Wait for page to load
      await page.waitForTimeout(2000);

      // Verify the countdown timer is visible on public listing page
      // The timer shows "Time Remaining" or countdown with units
      const countdownElement = page.locator('text=/Time Remaining|HR|MIN|SEC/i').first();
      await expect(countdownElement).toBeVisible({ timeout: 10000 });
    }
  });
});
