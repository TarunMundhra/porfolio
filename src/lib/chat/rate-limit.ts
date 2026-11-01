type Query = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<ReadonlyArray<Record<string, unknown>>>;

export interface SharedRateLimiter {
  allow(key: string): Promise<boolean>;
}

export function createSharedRateLimiter(options: {
  sql?: Query;
  limit: number;
  windowMs: number;
}): SharedRateLimiter {
  return {
    async allow(key) {
      if (!options.sql) return false;
      try {
        const rows = await options.sql`
          INSERT INTO chat_rate_limits (key, window_started_at, request_count)
          VALUES (${key}, now(), 1)
          ON CONFLICT (key) DO UPDATE SET
            window_started_at = CASE
              WHEN chat_rate_limits.window_started_at <= now() - (${options.windowMs} * interval '1 millisecond')
              THEN now() ELSE chat_rate_limits.window_started_at END,
            request_count = CASE
              WHEN chat_rate_limits.window_started_at <= now() - (${options.windowMs} * interval '1 millisecond')
              THEN 1 ELSE chat_rate_limits.request_count + 1 END
          RETURNING request_count <= ${options.limit} AS allowed
        `;
        return rows[0]?.allowed === true;
      } catch {
        return false;
      }
    },
  };
}
