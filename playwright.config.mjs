import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:4173',
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
  webServer: [
    {
      command: 'npm run start --workspace server',
      url: 'http://localhost:3100/owner',
      env: {
        CLIENT_ORIGIN: 'http://localhost:4173',
        PORT: '3100',
      },
      reuseExistingServer: false,
    },
    {
      command:
        'npm run dev:web --workspace client -- --host localhost --port 4173',
      url: 'http://localhost:4173',
      env: {
        VITE_API_BASE_URL: 'http://localhost:3100',
      },
      reuseExistingServer: false,
    },
  ],
});
