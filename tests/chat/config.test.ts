import { describe, expect, it } from "vitest";

import { parseChatConfig } from "@/lib/chat/config";

describe("parseChatConfig", () => {
  it("fails when required configuration is missing", () => {
    expect(() => parseChatConfig({})).toThrow();
  });

  it("parses complete configuration without exposing raw environment values", () => {
    const config = parseChatConfig({
      GEMINI_API_KEY: "gemini-secret",
      GROQ_API_KEY: "groq-secret",
      DATABASE_URL: "postgresql://localhost:5432/portfolio",
      CHAT_ADMIN_SECRET: "admin-secret",
      CHAT_ALLOWED_ORIGINS: "https://example.com, http://localhost:3000",
      CHAT_MODEL: "gemini-2.0-flash",
      CHAT_EMBEDDING_MODEL: "text-embedding-004",
      CHAT_MAX_INPUT_CHARS: "4000",
      CHAT_MAX_OUTPUT_TOKENS: "800",
      CHAT_RATE_LIMIT_PER_MINUTE: "30",
      CHAT_ANALYTICS_RETENTION_DAYS: "90",
    });

    expect(config).toEqual({
      geminiApiKey: "gemini-secret",
      groqApiKey: "groq-secret",
      databaseUrl: "postgresql://localhost:5432/portfolio",
      adminSecret: "admin-secret",
      allowedOrigins: ["https://example.com", "http://localhost:3000"],
      model: "gemini-2.0-flash",
      embeddingModel: "text-embedding-004",
      maxInputChars: 4000,
      maxOutputTokens: 800,
      rateLimitPerMinute: 30,
      analyticsRetentionDays: 90,
    });
    expect(config).not.toHaveProperty("GEMINI_API_KEY");
    expect(config).not.toHaveProperty("raw");
  });
});
