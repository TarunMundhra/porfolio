import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  timeout: 10_000,
  use: { baseURL: "http://127.0.0.1:3000" },
});
