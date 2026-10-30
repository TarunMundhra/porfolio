import { describe, expect, it } from "vitest";

import {
  createCorrelationId,
  createInFlightCounter,
  createRateLimiter,
  getSecurityHeaders,
  isAllowedOrigin,
  parseChatRequest,
  publicError,
  redactForAnalytics,
} from "@/lib/chat/security";

describe("chat security", () => {
  it("matches origins exactly and rejects lookalikes", () => {
    expect(isAllowedOrigin("https://tarunmundhra.tech", ["https://tarunmundhra.tech"])).toBe(true);
    expect(isAllowedOrigin("https://tarunmundhra.tech.evil", ["https://tarunmundhra.tech"])).toBe(false);
    expect(isAllowedOrigin("http://localhost:3000", ["https://tarunmundhra.tech"])).toBe(false);
  });

  it("strictly parses bounded questions and history", () => {
    expect(parseChatRequest({ question: "  Tell me about projects  " })).toEqual({
      question: "Tell me about projects",
      history: [],
    });
    expect(() => parseChatRequest({ question: "" })).toThrow();
    expect(() => parseChatRequest({ question: "x".repeat(2001) })).toThrow();
    expect(() => parseChatRequest({ question: "hello", extra: true })).toThrow();
    expect(() =>
      parseChatRequest({
        question: "hello",
        history: Array.from({ length: 11 }, () => ({ role: "user", content: "x" })),
      }),
    ).toThrow();
    expect(() =>
      parseChatRequest({ question: "hello", history: [{ role: "user", content: "x".repeat(1001) }] }),
    ).toThrow();
  });

  it("redacts personal data, credentials, and opaque tokens", () => {
    const redacted = redactForAnalytics(
      "email tarun@example.com phone +1 (555) 123-4567 Bearer abcdefghijklmnop api_key=sk-live-secret opaque=eyJlongopaquevalue123456789",
    );
    expect(redacted).not.toMatch(/tarun@example\.com|555|sk-live-secret|abcdefghijklmnop|eyJlongopaquevalue/);
    expect(redacted).toContain("[REDACTED]");
  });

  it("redacts plain key assignments and short provider keys", () => {
    const providerKey = ["sk", "test", "secret"].join("-");
    const redacted = redactForAnalytics(`key=${providerKey} provider=${providerKey}`);
    expect(redacted).not.toContain(providerKey);
    expect(redacted).toContain("[REDACTED]");
  });

  it("provides replaceable memory-safe rate limiting and bounded in-flight work", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => 1_000 });
    expect(limiter.allow("visitor")).toBe(true);
    expect(limiter.allow("visitor")).toBe(false);
    limiter.reset();
    expect(limiter.allow("visitor")).toBe(true);

    const counter = createInFlightCounter(1);
    expect(counter.tryAcquire()).toBe(true);
    expect(counter.tryAcquire()).toBe(false);
    counter.release();
    expect(counter.tryAcquire()).toBe(true);
  });

  it("creates correlation IDs, headers, and generic public errors", () => {
    expect(createCorrelationId()).toMatch(/^[a-zA-Z0-9_-]{16,}$/);
    expect(getSecurityHeaders()["Content-Security-Policy"]).toContain("default-src 'self'");
    expect(publicError(new Error("database password=secret"))).toEqual({
      code: "unavailable",
      message: "The assistant is temporarily unavailable.",
    });
  });
});
