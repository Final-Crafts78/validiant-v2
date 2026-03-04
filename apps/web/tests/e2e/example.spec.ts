import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  // Next.js default might be "Create Next App", update this based on your app's actual title
  await expect(page).toHaveTitle(/Validiant|Create Next App/);
});
