# Bella assistant

Bella now offers a responsive light and dark chat interface with a keyboard-accessible launcher, quick actions, an expandable desktop panel, and a mobile layout that fits the viewport.

## Features

- Search active listings by category, location, maximum budget, BHK and purchase/rental preference. Indian budget formats such as `25k`, `80 lakh` and `1.5 crore` are supported.
- Refine the same search: `near Whitefield`, `under 25k`, `only for rent`, `any budget`, `any BHK`, or `new search`.
- Open listing details from result cards. Compare up to three listings by asking price, location, category, transaction, bedrooms and area.
- Create a structured listing draft using owner-provided details. Drafts are reviewed and published through the existing Register Service flow.
- Copy replies, download the conversation, start a new conversation and retry failed requests.
- Preserve text history and search filters across page reloads within the same browser tab. Sessions are separated by account; language changes retain history. Listing snapshots and comparison selections are not persisted.
- Continue using existing theme, accessibility, language, navigation and calculator commands. Opening a calculator closes the chat panel so that the tool remains accessible.

## Behavior and limits

Bella is a guided assistant with live Firestore search, not an external language model integration. No AI provider key, paid service or new backend is required. General guidance and the new interface are currently in English. Existing website-language commands remain available.

Search reads at most 120 active listings in one category and shows up to six matching results. Expired listings are filtered using the existing listing visibility rule. When the read limit is reached, the reply identifies the search as a limited batch. Search failures are distinct from an empty result, have a 15-second response deadline, and offer retry. Concurrent submissions and responses from a cleared conversation are ignored.

Listing prices and details are seller-provided. Missing values are labelled instead of guessed. Bella does not claim live market valuations, current lending rates, clear legal title or a hard-coded listing fee. Fees are checked in the existing listing flow.

Conversation text is stored in sessionStorage for the current tab, with a maximum of 60 messages. Use New conversation to clear it. Browser storage or clipboard restrictions do not prevent chat use.

## Verification

Run the app locally on port 3010, then:

```sh
npx playwright test tests/bella-search.spec.ts tests/bella-experience.spec.ts --reporter=line
```

Set `BELLA_TEST_URL` to use a different local address. The browser suite covers desktop and mobile layouts, live search or its recovery response, follow-up filters, settings commands, preserved language history, drafting, export, reload, reset, Escape and focus restoration. The parser suite checks Indian budgets, filter inheritance, command separation, missing data and purchase/rental matching.

Production validation: `npm run build`. Targeted ESLint validation covers the Bella component, engine, search, listings service and tests. Existing unrelated working-tree edits are outside this change.
