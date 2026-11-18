import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4321/upTilt/', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run preview -- --ignore-lock --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321/upTilt/uk/',
    reuseExistingServer: !process.env.CI,
  },
});
