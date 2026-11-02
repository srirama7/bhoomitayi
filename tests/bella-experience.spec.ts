import { test, expect, type Page } from "@playwright/test";

const target = process.env.BELLA_TEST_URL || "http://127.0.0.1:3010";
async function openBella(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "bhoomitayi-settings",
      JSON.stringify({ state: { hasSeenOnboarding: true }, version: 0 }),
    );
  });
  await page.goto(target, { waitUntil: "domcontentloaded" });
  await page.locator("#bella-chat-button").click();
  await expect(
    page.getByRole("dialog", { name: "Bella assistant" }),
  ).toBeVisible();
}
async function ask(page: Page, text: string) {
  await page.getByRole("textbox", { name: "Message Bella" }).fill(text);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".bella-transcript")).toHaveAttribute(
    "aria-busy",
    "false",
    { timeout: 20000 },
  );
  return page.locator('[data-role="assistant"]').last();
}

test("desktop: commands, language history, draft, export and reset", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openBella(page);
  await expect(page.getByText("Your next chapter")).toBeVisible();
  await page.locator("#bella-panel").screenshot({
    path: "test-results/bella-desktop.png",
  });
  await expect(await ask(page, "How to list my house")).toContainText(
    /register service/i,
  );
  await ask(page, "dark mode");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await ask(page, "font extra large");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("bhoomitayi-settings")!).state
            .fontSize,
      ),
    )
    .toBe("xlarge");
  const beforeLanguage = await page.locator('[data-role="user"]').count();
  await ask(page, "Kannada");
  expect(await page.locator('[data-role="user"]').count()).toBeGreaterThan(
    beforeLanguage,
  );
  await ask(page, "English");
  await ask(page, "font medium");
  await ask(page, "light mode");
  await expect(await ask(page, "Help me draft a listing")).toContainText(
    "Send the property type",
  );
  await expect(
    await ask(
      page,
      "2 BHK flat in Whitefield, 24000 rent, balcony and parking",
    ),
  ).toContainText("Your listing draft");
  await expect(page.locator('[data-role="assistant"]').last()).toContainText(
    "24000",
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download conversation" }).click();
  expect((await download).suggestedFilename()).toBe("bella-conversation.txt");
  await page.reload();
  await page.locator("#bella-chat-button").click();
  await expect(page.locator('[data-role="assistant"]').last()).toContainText(
    "Your listing draft",
  );
  await page.getByRole("button", { name: "New conversation" }).click();
  await expect(page.locator('[data-role="user"]')).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Bella assistant" }),
  ).toBeHidden();
  await expect(page.locator("#bella-chat-button")).toBeFocused();
});

test("mobile: live search or recoverable error stays inside viewport", async ({
  page,
}) => {
  test.setTimeout(70000);
  await page.setViewportSize({ width: 390, height: 844 });
  await openBella(page);
  const box = await page.locator("#bella-panel").boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  await page.locator("#bella-panel").screenshot({
    path: "test-results/bella-mobile.png",
  });
  const reply = await ask(page, "Find houses in Bangalore under 80 lakh");
  await expect(reply).toContainText(
    /matching listings|find a match|couldn't complete/i,
  );
  await expect(page.locator(".bella-filter-summary")).toContainText(
    "Bangalore",
  );
  await expect(await ask(page, "under 60 lakh")).toContainText(
    /matching listings|find a match|couldn't complete/i,
  );
  await expect(page.locator(".bella-filter-summary")).toContainText(
    "60,00,000",
  );
  await page.locator("#bella-panel").screenshot({
    path: "test-results/bella-mobile-search.png",
  });
  await expect(await ask(page, "compare")).toContainText(
    /two or three listings/i,
  );
  await expect(await ask(page, "unrecognized request xyz")).toContainText(
    /didn't quite understand/i,
  );
});
