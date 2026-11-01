import { describe, expect, it, vi } from "vitest";

import { createSharedRateLimiter } from "@/lib/chat/rate-limit";

describe("shared rate limiter", () => {
  it("uses one atomic database operation and honors its decision", async () => {
    const sql = vi.fn().mockResolvedValue([{ allowed: true }]);
    const limiter = createSharedRateLimiter({ sql, limit: 2, windowMs: 60_000 });

    expect(await limiter.allow("client")).toBe(true);
    expect(sql).toHaveBeenCalledTimes(1);
    expect(sql.mock.calls[0][0].join("")).toContain("ON CONFLICT");
  });

  it("fails closed when the shared backend is unavailable or unconfigured", async () => {
    const unavailable = createSharedRateLimiter({
      sql: vi.fn().mockRejectedValue(new Error("database down")),
      limit: 2,
      windowMs: 60_000,
    });
    const unconfigured = createSharedRateLimiter({ limit: 2, windowMs: 60_000 });

    expect(await unavailable.allow("client")).toBe(false);
    expect(await unconfigured.allow("client")).toBe(false);
  });
});
