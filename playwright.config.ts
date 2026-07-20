import { defineConfig, devices } from "@playwright/test";

// Overridable because port 3000 is sometimes taken by other local dev servers;
// reuseExistingServer would otherwise happily test whatever is squatting there.
const port = Number(process.env.E2E_PORT ?? 3000);

export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // The smoke test mocks every /api call, so only the Vite client is needed.
  webServer: {
    command: `npm run dev --workspace client -- --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
