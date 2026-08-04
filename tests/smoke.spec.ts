import { test, expect } from '@playwright/test';

test('RBP booking homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Restful-booker-platform/i);
});
