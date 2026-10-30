import { describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createRedactedConversationRecord,
  createAnalytics,
  type RedactedConversationRecord,
} from "@/lib/chat/analytics";
import { createChatDatabase } from "@/lib/chat/db";

describe("chat persistence and analytics", () => {
  it("creates records with redacted content and no raw prompt", () => {
    const record = createRedactedConversationRecord({
      conversationId: "conversation-1",
      ownerId: "owner-1",
      messages: [{ role: "user", content: "email me at me@example.com" }],
    });

    expect(record.messages[0]?.content).not.toContain("me@example.com");
    expect(record.messages[0]?.content).toContain("[REDACTED]");
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
    for (const table of ["chat_index_versions", "chat_chunks", "chat_conversations", "chat_messages", "chat_events"]) {
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
});
