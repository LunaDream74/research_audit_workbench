import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const useLocalServer = new URL(baseURL).hostname === "127.0.0.1" || new URL(baseURL).hostname === "localhost";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: { baseURL, channel: "chrome" },
  webServer: useLocalServer ? {
    command: "npm run dev",
    url: `${baseURL}/api/health`,
    reuseExistingServer: true,
    timeout: 120_000,
  } : undefined,
});
