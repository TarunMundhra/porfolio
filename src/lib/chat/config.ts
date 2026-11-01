import { z } from "zod";

const positiveInteger = z.coerce.number().int().positive();

const environmentSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  CHAT_ADMIN_SECRET: z.string().min(1),
  CHAT_ALLOWED_ORIGINS: z.string().min(1),
  CHAT_MODEL: z.string().min(1),
  CHAT_EMBEDDING_MODEL: z.string().min(1),
  CHAT_MAX_INPUT_CHARS: positiveInteger,
  CHAT_MAX_OUTPUT_TOKENS: positiveInteger,
  CHAT_RATE_LIMIT_PER_MINUTE: positiveInteger,
  CHAT_ANALYTICS_RETENTION_DAYS: positiveInteger,
  CHAT_TRUSTED_IDENTITY_HEADER: z.string().optional(),
});

export type ChatConfig = {
  geminiApiKey: string;
  groqApiKey: string;
  databaseUrl: string;
  adminSecret: string;
  allowedOrigins: string[];
  model: string;
  embeddingModel: string;
  maxInputChars: number;
  maxOutputTokens: number;
  rateLimitPerMinute: number;
  analyticsRetentionDays: number;
  trustedIdentityHeader?: string;
};

function normalizeOrigins(origins: string): string[] {
  return origins
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export function parseChatConfig(
  env: Record<string, unknown> = process.env,
): ChatConfig {
  const parsed = environmentSchema.parse(env);
  const allowedOrigins = normalizeOrigins(parsed.CHAT_ALLOWED_ORIGINS);

  if (allowedOrigins.length === 0) {
    throw new Error("CHAT_ALLOWED_ORIGINS must contain at least one origin");
  }

  return {
    geminiApiKey: parsed.GEMINI_API_KEY,
    groqApiKey: parsed.GROQ_API_KEY,
    databaseUrl: parsed.DATABASE_URL,
    adminSecret: parsed.CHAT_ADMIN_SECRET,
    allowedOrigins,
    model: parsed.CHAT_MODEL,
    embeddingModel: parsed.CHAT_EMBEDDING_MODEL,
    maxInputChars: parsed.CHAT_MAX_INPUT_CHARS,
    maxOutputTokens: parsed.CHAT_MAX_OUTPUT_TOKENS,
    rateLimitPerMinute: parsed.CHAT_RATE_LIMIT_PER_MINUTE,
    analyticsRetentionDays: parsed.CHAT_ANALYTICS_RETENTION_DAYS,
    ...(parsed.CHAT_TRUSTED_IDENTITY_HEADER?.trim()
      ? { trustedIdentityHeader: parsed.CHAT_TRUSTED_IDENTITY_HEADER.trim().toLowerCase() }
      : {}),
  };
}
