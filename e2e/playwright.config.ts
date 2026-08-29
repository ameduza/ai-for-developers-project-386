import { defineConfig, devices } from '@playwright/test';
import { resolveTargetSettings } from './support/execution-target.js';

const targetSettings = resolveTargetSettings(
  process.env.E2E_TARGET,
  Boolean(process.env.CI),
);

process.env.E2E_API_BASE_URL = targetSettings.apiOrigin;

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL: targetSettings.browserOrigin,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: targetSettings.webServer,
});
