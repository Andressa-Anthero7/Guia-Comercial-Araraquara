import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";

const localPython = path.resolve("../backend/gca_venv/Scripts/python.exe");
const python = process.env.GCA_TEST_PYTHON || (existsSync(localPython) ? localPython : "python");

export default defineConfig({
  testDir: "./integration",
  outputDir: "./integration-results",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  timeout: 60000,
  use: { baseURL: "http://127.0.0.1:3001", trace: "retain-on-failure" },
  projects: [{ name: "chromium-real-api", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `"${python}" ../backend/run_portal_e2e.py`,
      url: "http://127.0.0.1:8001/api/health/",
      reuseExistingServer: false,
      timeout: 60000,
    },
    {
      command: "npm run dev -- --port=3001 --host=127.0.0.1 --strictPort",
      url: "http://127.0.0.1:3001",
      env: { GCA_API_PROXY_TARGET: "http://127.0.0.1:8001" },
      reuseExistingServer: false,
    },
  ],
});
