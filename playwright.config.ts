import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://127.0.0.1:4173/digest/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: "iphone",
      use: { ...devices["iPhone 14 Pro"], viewport: { width: 393, height: 852 } }
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});

