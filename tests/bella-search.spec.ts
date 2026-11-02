import { test, expect } from "@playwright/test";
import {
  bellaSearchUrl,
  matchesBellaSearch,
  parseBellaSearch,
} from "../src/lib/bella-search";
import type { Listing } from "../src/lib/types/database";
import { isListingPubliclyVisible } from "../src/lib/listing-timer";
import { createBellaEngine, matchIntent } from "../src/lib/bella-engine";
import type { SiteSettings } from "../src/lib/settings-store";

test("understands Indian budgets, BHK and location, then refines the same search", () => {
  const initial = parseBellaSearch(
    "Find 2 BHK houses in Bangalore under 80 lakh",
  );
  expect(initial).toEqual({
    category: "house",
    bedrooms: 2,
    location: "Bangalore",
    maxPrice: 8000000,
  });
  expect(parseBellaSearch("only for rent under 25k", initial!)).toEqual({
    ...initial,
    transaction: "rent",
    maxPrice: 25000,
  });
  expect(parseBellaSearch("near Whitefield", initial!)).toEqual({
    ...initial,
    location: "Whitefield",
  });
  expect(parseBellaSearch("plots under 1.5 crore", initial!)).toEqual({
    category: "land",
    location: "Bangalore",
    maxPrice: 15000000,
  });
  expect(parseBellaSearch("any budget", initial!)).not.toHaveProperty(
    "maxPrice",
  );
  expect(parseBellaSearch("new search", initial!)).toEqual({});
});

test("keeps questions and settings out of the search flow", () => {
  for (const input of [
    "How to list my house",
    "EMI calculator",
    "go to houses",
    "What is land conversion?",
    "change language to Kannada",
    "draft a listing",
    "dark mode",
  ]) {
    expect(parseBellaSearch(input, { category: "house" })).toBeNull();
  }
});

test("filters real fields without treating missing prices or bedrooms as matches", () => {
  const house = {
    category: "house",
    title: "2 BHK apartment",
    price: 22000,
    transaction_type: "rent",
    address: "Whitefield, Bangalore",
    details: { bedrooms: 2 },
  } as Listing;
  const filters = {
    category: "house" as const,
    maxPrice: 25000,
    bedrooms: 2,
    location: "whitefield",
    transaction: "rent" as const,
  };
  expect(matchesBellaSearch(house, filters)).toBe(true);
  expect(matchesBellaSearch({ ...house, price: undefined }, filters)).toBe(
    false,
  );
  expect(
    matchesBellaSearch({ ...house, details: {}, title: "Apartment" }, filters),
  ).toBe(false);
  expect(matchesBellaSearch({ ...house, price: 26000 }, filters)).toBe(false);
  expect(
    matchesBellaSearch(
      { ...house, transaction_type: "sell" },
      { ...filters, transaction: "buy" },
    ),
  ).toBe(true);
  expect(bellaSearchUrl(filters)).toBe(
    "/houses?q=whitefield&maxPrice=25000&txn=rent",
  );
});

test("expired or pending listings are not public search results", () => {
  expect(
    isListingPubliclyVisible({
      status: "active",
      expires_at: "2000-01-01T00:00:00Z",
    } as Listing),
  ).toBe(false);
  expect(isListingPubliclyVisible({ status: "pending" } as Listing)).toBe(
    false,
  );
  expect(
    isListingPubliclyVisible({
      status: "active",
      expires_at: "2099-01-01T00:00:00Z",
    } as Listing),
  ).toBe(true);
});

test("specific commands win over broad category and calculator words", async () => {
  const calls: [string, unknown][] = [];
  const settings = new Proxy(
    {},
    { get: (_, key) => (value: unknown) => calls.push([String(key), value]) },
  ) as SiteSettings;
  const engine = createBellaEngine(
    (value) => calls.push(["theme", value]),
    (value) => calls.push(["language", value]),
    settings,
    null,
    { push: (value) => calls.push(["navigate", value]) },
  );
  const translate = (key: string) => key;
  const guide = await matchIntent("How to list my house", engine, translate);
  expect(guide.response).toContain("Register Service");
  await matchIntent("date difference", engine, translate);
  expect(calls.at(-1)).toEqual(["setActiveCalculator", "datediff"]);
  await matchIntent("open age calculator", engine, translate);
  expect(calls.at(-1)).toEqual(["setActiveCalculator", "age"]);
  const font = await matchIntent("font extra large", engine, translate);
  font.action?.();
  expect(calls.at(-1)).toEqual(["setFontSize", "xlarge"]);
  const language = await matchIntent("Kannada", engine, translate);
  language.action?.();
  expect(calls.at(-1)).toEqual(["language", "kn"]);
  await matchIntent("open houses", engine, translate);
  expect(calls.at(-1)).toEqual(["navigate", "/houses"]);
});
