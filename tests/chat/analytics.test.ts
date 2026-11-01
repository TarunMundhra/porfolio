import { describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createRedactedConversationRecord,
  createAnalytics,
  type RedactedConversationRecord,
} from "@/lib/chat/analytics";
import { createChatDatabase } from "@/lib/chat/db";
import { indexKnowledge, type KnowledgeIndexDatabase } from "../../scripts/index-knowledge";

describe("chat persistence and analytics", () => {
  it("creates records with redacted content and no raw prompt", () => {
    const record = createRedactedConversationRecord({
      conversationId: "conversation-1",
      ownerId: "owner-1",
      messages: [{ role: "user", content: "email me at me@example.com" }],
      event: { correlationId: "event-1", providerStatus: "refused" },
    });

    expect(record.messages[0]?.content).not.toContain("me@example.com");
    expect(record.messages[0]?.content).toContain("[REDACTED]");
    expect(record.event).toEqual({ correlationId: "event-1", providerStatus: "refused" });
    expect(record).toHaveProperty("createdAt");
  });

  it("allows only the owner to read and delete a conversation", async () => {
    const stored: RedactedConversationRecord[] = [];
    const database = {
      persistConversation: vi.fn(async (record: RedactedConversationRecord) => { stored.push(record); }),
      getConversation: vi.fn(async () => stored[0]),
      deleteConversation: vi.fn(async () => undefined),
    };
    const analytics = createAnalytics({ database });
    const record = createRedactedConversationRecord({ conversationId: "c1", ownerId: "o1", messages: [] });
    await analytics.recordConversation(record);

    await expect(analytics.readConversation("c1", "other")).rejects.toMatchObject({ code: "forbidden" });
    await expect(analytics.deleteConversation("c1", "other")).rejects.toMatchObject({ code: "forbidden" });
    expect(await analytics.readConversation("c1", "o1")).toEqual(record);
    await analytics.deleteConversation("c1", "o1");
    expect(database.deleteConversation).toHaveBeenCalledWith("c1");
  });

  it("records a redacted metric and swallows only analytics persistence failures", async () => {
    const metric = vi.fn();
    const analytics = createAnalytics({
      database: { persistConversation: vi.fn(async () => { throw new Error("database down"); }) },
      recordMetric: metric,
    });
    const record = createRedactedConversationRecord({ conversationId: "c1", ownerId: "o1", messages: [] });

    await expect(analytics.recordConversation(record)).resolves.toBeUndefined();
    expect(metric).toHaveBeenCalledWith("chat.analytics.persistence_failed", { correlationId: expect.any(String) });
  });

  it("migration defines vector tables, active/source/similarity indexes, and retention deletion", async () => {
    const migration = await readFile(resolve(process.cwd(), "scripts/migrations/001_chat.sql"), "utf8");
    expect(migration).toMatch(/CREATE EXTENSION IF NOT EXISTS vector/i);
    for (const table of ["chat_index_versions", "chat_chunks", "chat_conversations", "chat_messages", "chat_events", "chat_rate_limits"]) {
      expect(migration).toMatch(new RegExp(`CREATE TABLE[\\s\\S]*${table}`, "i"));
    }
    expect(migration).toMatch(/retention|DELETE FROM chat_messages/i);
    expect(migration).toMatch(/chat_chunks.*source_id|source_id.*chat_chunks/i);
    expect(migration).toMatch(/vector.*ivfflat|hnsw/i);
  });

  it("retrieves only chunks from the active version with citation metadata", async () => {
    const queries: string[] = [];
    const sql = Object.assign(
      (strings: TemplateStringsArray, ...values: unknown[]) => {
        queries.push(strings.join("?"));
        return Promise.resolve([{ id: "chunk-1", source_id: "about", title: "About", url: "/#about", section: "About", text: "hello", similarity: 0.9 }]);
      },
      { begin: vi.fn() },
    ) as never;
    const db = createChatDatabase(sql);
    const chunks = await db.retrieveChunks([0.1, 0.2], { limit: 3, minimumSimilarity: 0.7 });
    expect(chunks[0]).toMatchObject({ id: "chunk-1", sourceId: "about", title: "About", url: "/#about", similarity: 0.9 });
    expect(queries.join("\n")).toMatch(/active/i);
  });

  it("returns an indexed chunk through the active-version retrieval path", async () => {
    let indexed: Record<string, unknown> | undefined;
    const database: KnowledgeIndexDatabase = {
      async begin(callback) {
        return callback({
          createVersion: async () => undefined,
          upsertChunk: async (chunk) => { indexed = chunk as unknown as Record<string, unknown>; },
          promoteVersion: async () => undefined,
        });
      },
      async close() {},
    };
    await indexKnowledge({ embed: async () => [0.1, 0.2] }, database);
    const sql = Object.assign(
      (strings: TemplateStringsArray) => {
        expect(strings.join(" ")).toMatch(/chat_chunks/);
        return Promise.resolve([{
          id: "indexed-chunk",
          source_id: indexed?.sourceId,
          title: indexed?.title,
          url: indexed?.url,
          section: indexed?.section,
          text: indexed?.text,
          similarity: 0.95,
        }]);
      },
      { begin: vi.fn() },
    ) as never;
    const result = await createChatDatabase(sql).retrieveChunks([0.1, 0.2], { limit: 1, minimumSimilarity: 0.7 });
    expect(result[0]).toMatchObject({ sourceId: indexed?.sourceId, text: indexed?.text, title: indexed?.title });
  });

  it("replaces a conversation in one transaction and retries without duplicate ordinals", async () => {
    const operations: string[] = [];
    const tx = (strings: TemplateStringsArray) => {
      operations.push(strings.join(" ").includes("DELETE") ? "delete" : "insert");
      return Promise.resolve([]);
    };
    const sql = Object.assign(
      () => Promise.resolve([]),
      { begin: async (callback: (transaction: typeof tx) => Promise<void>) => callback(tx) },
    ) as never;
    const db = createChatDatabase(sql);
    const record = createRedactedConversationRecord({ conversationId: "retry", ownerId: "owner", messages: [
      { role: "user", content: "one" }, { role: "assistant", content: "two" },
    ]});
    await db.persistConversation(record);
    await db.persistConversation(record);
    expect(operations.filter((operation) => operation === "delete")).toHaveLength(2);
    expect(operations.filter((operation) => operation === "insert")).toHaveLength(6);
  });

  it("swallows analytics observability callback failures", async () => {
    const analytics = createAnalytics({
      database: { persistConversation: vi.fn(async () => { throw new Error("down"); }) },
      recordMetric: () => { throw new Error("metric logger down"); },
      logError: () => { throw new Error("error logger down"); },
    });
    await expect(analytics.recordConversation(createRedactedConversationRecord({
      conversationId: "c", ownerId: "o", messages: [],
    }))).resolves.toBeUndefined();
  });

  it("returns a generic error when the database logger throws", async () => {
    const logError = vi.fn(() => { throw new Error("logger leaked"); });
    const sql = Object.assign(
      () => Promise.reject(new Error("secret database detail")),
      { begin: vi.fn() },
    ) as never;
    await expect(createChatDatabase(sql, { logError }).retrieveChunks([1], { limit: 1, minimumSimilarity: 0 })).rejects.toThrow("Chat database unavailable");
    expect(logError).toHaveBeenCalledWith({ correlationId: expect.any(String) });
  });

  it("filters expired conversations at read time", async () => {
    const sql = Object.assign(
      (strings: TemplateStringsArray) => {
        expect(strings.join(" ")).toMatch(/expires_at > now\(\)/i);
        return Promise.resolve([]);
      },
      { begin: vi.fn() },
    ) as never;
    expect(await createChatDatabase(sql).getConversation("expired")).toBeUndefined();
  });

  it("defines one active index version and scheduled retention maintenance", async () => {
    const migration = await readFile(resolve(process.cwd(), "scripts/migrations/001_chat.sql"), "utf8");
    expect(migration).toMatch(/UNIQUE.*status.*WHERE status = 'active'|CREATE UNIQUE INDEX[\s\S]*status = 'active'/i);
    expect(migration).toMatch(/pg_cron|schedule|purge_expired_chat_data/i);
  });

  it("serializes concurrent promotions and preserves one active version", async () => {
    const migration = await readFile(resolve(process.cwd(), "scripts/migrations/001_chat.sql"), "utf8");
    const indexer = await readFile(resolve(process.cwd(), "scripts/index-knowledge.ts"), "utf8");
    expect(indexer).toMatch(/pg_advisory_xact_lock/i);
    const promotions = ["one", "two"];
    let active = 0;
    let maximumActive = 0;
    let queue = Promise.resolve();
    await Promise.all(promotions.map((version) => {
      const run = queue.then(async () => {
        active = 0;
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await Promise.resolve(version);
        active -= 1;
      });
      queue = run;
      return run;
    }));
    expect(maximumActive).toBe(1);
  });
});
