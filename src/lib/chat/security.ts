import { z } from "zod";

import type { ChatRequest } from "./contracts";

const MAX_QUESTION_CHARS = 2_000;
const MAX_HISTORY_ITEMS = 10;
const MAX_HISTORY_CONTENT_CHARS = 1_000;
const MAX_BODY_BYTES = 32_000;

const historyItemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(MAX_HISTORY_CONTENT_CHARS),
}).strict();

const requestSchema = z.object({
  question: z.string().trim().min(1).max(MAX_QUESTION_CHARS),
  history: z.array(historyItemSchema).max(MAX_HISTORY_ITEMS).optional().default([]),
}).strict();

export function parseChatRequest(value: unknown, contentLength?: number): ChatRequest & {
  history: ReadonlyArray<{ role: "user" | "assistant"; content: string }>;
} {
  if (contentLength !== undefined && (!Number.isInteger(contentLength) || contentLength < 0 || contentLength > MAX_BODY_BYTES)) {
    throw new Error("Request body is too large");
  }
  const parsed = requestSchema.parse(value);
  return parsed;
}

export function isAllowedOrigin(origin: string | null | undefined, allowedOrigins: readonly string[]): boolean {
  if (!origin) return false;
  return allowedOrigins.some((allowed) => origin === allowed);
}

export interface RateLimiter {
  allow(key: string): boolean;
  reset(): void;
}

export function createRateLimiter(options: {
  limit: number;
  windowMs: number;
  now?: () => number;
  maxKeys?: number;
}): RateLimiter {
  const entries = new Map<string, { startedAt: number; count: number }>();
  const now = options.now ?? Date.now;
  const maxKeys = options.maxKeys ?? 10_000;
  return {
    allow(key) {
      const current = now();
      const existing = entries.get(key);
      if (!existing || current - existing.startedAt >= options.windowMs) {
        if (entries.size >= maxKeys) {
          const oldest = entries.keys().next().value;
          if (oldest !== undefined) entries.delete(oldest);
        }
        entries.set(key, { startedAt: current, count: 1 });
        return true;
      }
      if (existing.count >= options.limit) return false;
      existing.count += 1;
      return true;
    },
    reset() {
      entries.clear();
    },
  };
}

export function createInFlightCounter(limit: number): {
  tryAcquire(): boolean;
  release(): void;
  current(): number;
} {
  let active = 0;
  return {
    tryAcquire() {
      if (active >= limit) return false;
      active += 1;
      return true;
    },
    release() {
      active = Math.max(0, active - 1);
    },
    current() {
      return active;
    },
  };
}

export function createCorrelationId(): string {
  const bytes = new Uint8Array(12);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
    return Buffer.from(bytes).toString("base64url");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function redactForAnalytics(value: string): string {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED]")
    .replace(/(?<!\d)(?:\+?\d[\d\s().-]{7,}\d)(?!\d)/g, "[REDACTED]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/gi, "Bearer [REDACTED]")
    .replace(/\b(?:key|api[_-]?key|token|secret|password|opaque)\s*[:=]\s*\S+/gi, "[REDACTED]")
    .replace(/\b(?:(?:sk|pk|ghp)[-_][A-Za-z0-9_-]{4,}|AIzaSy[A-Za-z0-9_-]{8,})\b/g, "[REDACTED]")
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, "[REDACTED]");
}

export function getSecurityHeaders(): Record<string, string> {
  return {
    "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'; base-uri 'self'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cache-Control": "no-store",
  };
}

export function publicError(_error: unknown): { code: "unavailable"; message: string } {
  return { code: "unavailable", message: "The assistant is temporarily unavailable." };
}
