import { defineConfig, devices } from '@playwright/test';
import { environmentConfig } from './config/environments.js';

const baseURL = process.env['BASE_URL'] ?? environmentConfig.baseURL;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: environmentConfig.retries,
  reporter: 'html',
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
