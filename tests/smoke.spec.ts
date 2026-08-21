import { test, expect } from '../fixtures/pages.fixture.js';

test('RBP booking homepage loads', async ({ page, bookingHomePage }) => {
  await bookingHomePage.open();
  await expect(page).toHaveTitle(/this-title-will-never-match-xyz/i);
});
