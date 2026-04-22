# Playwright E2E Tests

## Admin Timer Tests

Tests for admin timer management functionality on propnest-admin.vercel.app

### Run Tests

```bash
# Run all tests (headless)
npm test

# Run tests with browser UI (headed mode)
npm run test:headed

# Run with Playwright UI mode
npm run test:ui

# Run specific test file
npx playwright test tests/admin-timer.spec.ts

# Run specific test by name
npx playwright test --grep "admin can log in"
```

### Test Credentials

- **Username:** admin
- **Password:** admin

### Test Coverage

1. **Admin Login & Timer Set** - Logs into admin panel and sets timer duration for listings
2. **Timer Countdown View** - Verifies admin can see countdown timers on listings
3. **Public Timer Visibility** - Verifies timer is visible on main website listing pages
