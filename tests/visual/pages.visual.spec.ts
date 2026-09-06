import { test, expect } from '../../fixtures/pages.fixture.js';

/**
 * Baselines are generated in a Linux-consistent environment (the Phase 7 Docker image), not a
 * bare Windows/macOS dev machine — font/anti-aliasing rendering differs enough between OSes
 * that a baseline from one won't pixel-match a run on the other. Playwright does suffix
 * screenshot filenames by platform automatically (e.g. `-linux`, `-win32`), so running this
 * natively on Windows won't false-fail against the committed Linux baseline — it'll report no
 * baseline exists for win32 and write one, which is expected, not a bug. Only the Linux
 * baselines (matching CI/CodeBuild) are committed. See README.md's "Visual regression" section.
 */
test.describe('visual regression', () => {
  test('booking homepage renders consistently', async ({ page, bookingHomePage }) => {
    await bookingHomePage.open();
    await expect(page).toHaveScreenshot('booking-homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('admin login page renders consistently', async ({ page, adminLoginPage }) => {
    await adminLoginPage.open();
    await expect(page).toHaveScreenshot('admin-login.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
});
