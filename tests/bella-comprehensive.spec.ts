import { test, expect } from "@playwright/test";

test.describe("Bella AI Comprehensive Query Verification Suite", () => {
  // Set test timeout to 5 minutes to verify all queries
  test.setTimeout(300000);
  const targetUrl = process.env.TEST_URL || "http://localhost:3000";

  test("verify Bella can answer and handle all expected queries and settings", async ({ page }) => {
    // 1. Navigate to BhoomiTayi home
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    console.log("Navigation complete. Waiting a bit for hydration...");
    await page.waitForTimeout(4000);

    // Dismiss onboarding if present
    console.log("Attempting to dismiss onboarding dialogs...");
    const skipTourBtn = page.locator("button:has-text('Skip'), button[aria-label='Skip tour']").first();
    try {
      if (await skipTourBtn.isVisible()) {
        await skipTourBtn.click({ force: true });
        console.log("Onboarding tour skipped.");
      }
    } catch (e) {
      console.log("No onboarding tour dialog found or skipped already.");
    }

    // Dismiss Tommy's Guide if present
    const skipGuideBtn = page.locator("button:has-text('Skip guide'), button:has-text('Skip Guide')").first();
    try {
      if (await skipGuideBtn.isVisible()) {
        await skipGuideBtn.click({ force: true });
        console.log("Tommy guide dismissed.");
      }
    } catch (e) {
      console.log("No Tommy guide found.");
    }

    // 2. Open Bella Chat
    console.log("Locating Bella Chat button...");
    const chatButton = page.locator("#bella-chat-button");
    await expect(chatButton).toBeVisible({ timeout: 15000 });

    const chatInput = page.locator("#bella-chat-root form input").first();
    
    // Hydration buffer
    await page.waitForTimeout(2000);

    for (let attempt = 1; attempt <= 5; attempt++) {
      console.log(`Clicking Bella Chat button (attempt ${attempt}/5)...`);
      await chatButton.click({ force: true });
      await page.waitForTimeout(2000);
      if (await chatInput.isVisible()) {
        console.log("Chat opened successfully!");
        break;
      }
    }

    // 3. Verify chat window is open
    console.log("Verifying chat input is visible...");
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Define all test queries and expected answers
    const testCases = [
      // ── Appearance & Display settings ──
      { query: "dark mode", expectedPattern: /dark/i },
      { query: "light mode", expectedPattern: /light/i },
      { query: "system mode", expectedPattern: /theme follows/i },
      { query: "reading mode", expectedPattern: /activated|warm sepia/i },
      { query: "reading mode off", expectedPattern: /disabled/i },
      { query: "high contrast", expectedPattern: /enabled|visibility/i },
      { query: "high contrast off", expectedPattern: /disabled/i },
      { query: "compact mode", expectedPattern: /enabled|spacing/i },
      { query: "compact off", expectedPattern: /disabled/i },
      { query: "reduce animations", expectedPattern: /reduced/i },
      { query: "enable animations", expectedPattern: /restored/i },

      // ── Font Size ──
      { query: "font small", expectedPattern: /small/i },
      { query: "font medium", expectedPattern: /medium/i },
      { query: "font large", expectedPattern: /large/i },
      { query: "font extra large", expectedPattern: /extra large/i },

      // ── Languages (resets chat history to translated welcome message) ──
      { query: "English", expectedPattern: /Bella|Hi/i },
      { query: "Kannada", expectedPattern: /ಬೆಲ್ಲಾ|ನಮಸ್ಕಾರ/i },
      { query: "Hindi", expectedPattern: /बेला|नमस्ते/i },
      { query: "Telugu", expectedPattern: /బెల్లా|నమస్తే/i },
      { query: "Malayalam", expectedPattern: /ബെല്ല|നമസ്കാരം/i },
      { query: "Tamil", expectedPattern: /பெல்லா|வணக்கம்/i },
      { query: "English", expectedPattern: /Bella|Hi/i }, // Switch back to English to proceed with English checks

      // ── Navigation ──
      { query: "go home", expectedPattern: /homepage/i },
      { query: "go dashboard", expectedPattern: /dashboard/i },
      { query: "go sell", expectedPattern: /Register Service/i },
      { query: "go to houses", expectedPattern: /Houses section/i },
      { query: "go to land", expectedPattern: /Land plots/i },
      { query: "go to pg", expectedPattern: /PG & Hostel/i },
      { query: "go to commercial", expectedPattern: /Commercial spaces/i },
      { query: "go to vehicles", expectedPattern: /Vehicles/i },
      { query: "go to commodities", expectedPattern: /Commodities/i },
      { query: "go to about", expectedPattern: /About Us/i },
      { query: "go to contact", expectedPattern: /Contact/i },
      { query: "go to glossary", expectedPattern: /Glossary/i },
      { query: "go to privacy", expectedPattern: /Privacy/i },
      { query: "go to terms", expectedPattern: /Terms/i },

      // ── Notifications ──
      { query: "notification on", expectedPattern: /enabled/i },
      { query: "notification off", expectedPattern: /disabled/i },

      // ── Contact / Corporate info ──
      { query: "how to contact support?", expectedPattern: /bhoomitayi7@gmail.com|7760200927/i },
      { query: "support email", expectedPattern: /bhoomitayi7@gmail.com/i },
      { query: "phone number", expectedPattern: /7760200927/i },
      { query: "office address", expectedPattern: /Bangalore, Karnataka, India/i },

      // ── Company details FAQ ──
      { query: "who founded this?", expectedPattern: /founded in Bangalore|team of passionate/i },
      { query: "is registration free?", expectedPattern: /free for both|charges a nominal/i },
      { query: "how much to list", expectedPattern: /charges a nominal/i },

      // ── Glossary Term Q&A ──
      { query: "what is A Khata?", expectedPattern: /municipal record|tax assessments|A Khata/i },
      { query: "what is RTC?", expectedPattern: /Record of Rights, Tenancy, and Crops/i },
      { query: "what is mutation?", expectedPattern: /updating or changing the title ownership/i },
      { query: "what is EC?", expectedPattern: /Encumbrance Certificate|evidence that a property/i },
      { query: "what is Carpet Area?", expectedPattern: /actual usable area within/i },
      { query: "what is FSI?", expectedPattern: /Floor Space Index/i },
      { query: "what is NA land?", expectedPattern: /Non-Agricultural Land/i },
      { query: "what is guidance value?", expectedPattern: /minimum value of a property set/i },

      // ── Smart Tools & Calculators ──
      { query: "open emi calc", expectedPattern: /EMI Calculator/i },
      { query: "open roi calc", expectedPattern: /ROI /i },
      { query: "stamp duty", expectedPattern: /Stamp Duty/i },
      { query: "affordability", expectedPattern: /Affordability/i },
      { query: "area converter", expectedPattern: /Area/i },
      { query: "scientific calculator", expectedPattern: /Scientific/i },
      { query: "currency converter", expectedPattern: /Currency/i },
      { query: "open length measure", expectedPattern: /Length/i },
      { query: "open volume", expectedPattern: /Volume/i },
      { query: "open weight", expectedPattern: /Weight/i },
      { query: "open temperature", expectedPattern: /Temperature/i },
      { query: "open speed", expectedPattern: /Speed/i },
      { query: "open time converter", expectedPattern: /Time/i },
      { query: "sip calc", expectedPattern: /SIP/i },
      { query: "tax calc", expectedPattern: /Income Tax/i },
      { query: "retirement planning", expectedPattern: /Retirement/i },
      { query: "profit margin", expectedPattern: /Profit/i },
      { query: "discount calc", expectedPattern: /Discount/i },
      { query: "gst calc", expectedPattern: /GST/i },
      { query: "break-even", expectedPattern: /Break-even/i },
      { query: "age calc", expectedPattern: /Age/i },
      { query: "open date diff", expectedPattern: /Date/i },
      { query: "smart tools", expectedPattern: /calculators/i },

      // ── Tommy's Enhanced Knowledge ──
      { query: "how to list", expectedPattern: /COMPLETE LISTING GUIDE/i },
      { query: "negotiate", expectedPattern: /NEGOTIATION PLAYBOOK/i },
      { query: "market trends", expectedPattern: /MARKET ANALYSIS/i },
      { query: "photography tips", expectedPattern: /PHOTOGRAPHY GUIDE/i },
      { query: "when to sell", expectedPattern: /BEST TIME TO SELL/i },
      { query: "description guide", expectedPattern: /PERFECT DESCRIPTION/i },

      // ── Original Property Help ──
      { query: "sell property", expectedPattern: /Register Service/i },
      { query: "cost pricing", expectedPattern: /Pricing guidance|compare/i },
      { query: "loan guide", expectedPattern: /Home loan/i },
      { query: "deeds documents", expectedPattern: /Essential property/i },
      { query: "help", expectedPattern: /Bella/i },

      // ── Conversational / Fun ──
      { query: "hello", expectedPattern: /Bella/i },
      { query: "thanks", expectedPattern: /welcome|happy to help/i },
      { query: "bye", expectedPattern: /Come back/i },
      { query: "who are you", expectedPattern: /Bella/i },
    ];

    const results: { query: string; success: boolean; error?: string }[] = [];

    // Helper to check if dialog/modal is open and close it
    const checkAndCloseDialog = async () => {
      const dialog = page.locator("div[role='dialog']").first();
      try {
        if (await dialog.isVisible()) {
          console.log("Dialog modal detected. Dismissing with Escape...");
          await page.keyboard.press("Escape");
          await page.waitForTimeout(800);
        }
      } catch (e) {
        // Ignore
      }
    };

    // Process each query case sequentially
    for (const testCase of testCases) {
      console.log(`\nTesting Query: "${testCase.query}"...`);
      try {
        // Re-open chat if a navigation or page transition closed/reset it
        if (!await chatInput.isVisible()) {
          console.log("Chat input not visible (possibly due to route or modal change). Re-opening chat...");
          for (let attempt = 1; attempt <= 3; attempt++) {
            await chatButton.click({ force: true });
            await page.waitForTimeout(2000);
            if (await chatInput.isVisible()) break;
          }
          await expect(chatInput).toBeVisible({ timeout: 8000 });
        }

        await chatInput.fill(testCase.query);
        await page.keyboard.press("Enter");
        // Reduced wait timeout since modal/dialog is handled dynamically
        await page.waitForTimeout(1200);

        // Target page might have redirected. Check if we navigated to login page for dashboard route
        if (testCase.query === "go dashboard") {
          try {
            await page.waitForURL("**/auth/login**", { timeout: 8000 });
          } catch (e) {
            console.log("waitForURL to /auth/login timed out, checking current URL...");
          }
          const currentUrl = page.url();
          if (currentUrl.includes("/auth/login")) {
            console.log("Successfully redirected to auth/login as expected.");
            results.push({ query: testCase.query, success: true });
            continue;
          }
        }

        const lastResponse = page.locator("#bella-chat-root div.bg-zinc-100, #bella-chat-root div.dark\\:bg-zinc-800").last();
        await expect(lastResponse).toContainText(testCase.expectedPattern, { timeout: 5000 });
        console.log(`Success! Pattern ${testCase.expectedPattern} found in response.`);
        results.push({ query: testCase.query, success: true });
      } catch (err: any) {
        console.error(`Failure on query "${testCase.query}":`, err.message);
        results.push({ query: testCase.query, success: false, error: err.message });
      } finally {
        // Clean up any modals that might have opened
        await checkAndCloseDialog();
      }
    }

    // Print summary table to console logs
    console.log("\n================ TEST SUMMARY ================");
    console.table(results);
    console.log("==============================================");

    // Fail test if any query failed
    const failedTests = results.filter(r => !r.success);
    expect(failedTests.length).toBe(0);
  });
});
