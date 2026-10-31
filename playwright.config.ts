import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  timeout: 10_000,
  use: { baseURL: "http://127.0.0.1:3000" },
  webServer: {
    command: "npm run dev -- -p 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      CHAT_TEST_MODE: "1",
      CHAT_ALLOWED_ORIGINS: "http://127.0.0.1:3000",
      GEMINI_API_KEY: "test-only-gemini-key",
      GROQ_API_KEY: "test-only-groq-key",
      DATABASE_URL: "postgresql://test:test@127.0.0.1:5432/test",
      CHAT_ADMIN_SECRET: "test-only-admin-secret",
      CHAT_MODEL: "test-model",
      CHAT_EMBEDDING_MODEL: "test-embedding",
      CHAT_MAX_INPUT_CHARS: "2000",
      CHAT_MAX_OUTPUT_TOKENS: "100",
      CHAT_RATE_LIMIT_PER_MINUTE: "100",
      CHAT_ANALYTICS_RETENTION_DAYS: "1",
    },
  },
});
