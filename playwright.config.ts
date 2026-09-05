import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import { environmentConfig } from './config/environments.js';
import { env } from './config/env.js';

const baseURL = env.BASE_URL ?? environmentConfig.baseURL;

// Tests tagged `@quarantine` (a known flake that retries don't fix) are excluded from every
// normal run — local, CI smoke, and the nightly regression. `pnpm run test:quarantine` sets
// QUARANTINE_ONLY to flip this around and run only quarantined tests, to check whether one has
// stabilized. Playwright's CLI --grep ANDs with config's grepInvert rather than overriding it,
// so this can't be done via a CLI flag alone — it has to switch which config field is set.
const quarantineOnly = process.env['QUARANTINE_ONLY'] === 'true';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: environmentConfig.retries,
  reporter: [['html'], ['allure-playwright']],
  ...(quarantineOnly ? { grep: /@quarantine/ } : { grepInvert: /@quarantine/ }),
  use: {
    baseURL,
    actionTimeout: environmentConfig.actionTimeout,
    navigationTimeout: environmentConfig.navigationTimeout,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
