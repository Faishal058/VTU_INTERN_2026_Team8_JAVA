import { defineConfig, devices } from '@playwright/test';

/**
 * WealthWise Playwright Configuration
 * 
 * E2E tests auto-start the Vite dev server (frontend) before running.
 * The backend must be started separately on port 8080.
 *
 * Run: npx playwright test
 * UI:  npx playwright test --ui
 * Report: npx playwright show-report
 */
export default defineConfig({
  // Directory containing the test files
  testDir: './e2e',

  // Timeout per test
  timeout: 30_000,

  // Action timeout (click, fill, etc.)
  expect: {
    timeout: 5_000,
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Reporter: list in local dev, HTML on CI
  reporter: process.env.CI
    ? [['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],

  use: {
    baseURL: 'http://localhost:5173',

    // Collect trace only on first retry — useful for debugging
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Short timeout for navigation
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewport tests
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Auto-start the frontend Vite dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI, // reuse in local dev, always restart on CI
    timeout: 60_000,
  },
});
