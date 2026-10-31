import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();
const sql = Object.assign(query, { end: vi.fn() });

vi.mock("postgres", () => ({ default: vi.fn(() => sql) }));

import { GET } from "@/app/api/admin/chat/route";
import { DELETE } from "@/app/api/admin/chat/delete/route";

function request(path: string, init: RequestInit = {}) {
  return new Request(`http://localhost${path}`, init);
}

describe("admin chat routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CHAT_ADMIN_SECRET = "test-admin-secret";
    process.env.DATABASE_URL = "postgresql://localhost:5432/portfolio";
    process.env.GEMINI_API_KEY = "test-gemini";
    process.env.GROQ_API_KEY = "test-groq";
    process.env.CHAT_ALLOWED_ORIGINS = "http://localhost:3000";
    process.env.CHAT_MODEL = "test-model";
    process.env.CHAT_EMBEDDING_MODEL = "test-embedding";
    process.env.CHAT_MAX_INPUT_CHARS = "4000";
    process.env.CHAT_MAX_OUTPUT_TOKENS = "800";
    process.env.CHAT_RATE_LIMIT_PER_MINUTE = "30";
    process.env.CHAT_ANALYTICS_RETENTION_DAYS = "90";
  });

  it("rejects missing and invalid credentials without describing the auth failure", async () => {
    expect((await GET(request("/api/admin/chat"))).status).toBe(401);
    expect((await GET(request("/api/admin/chat", {
      headers: { authorization: "Bearer wrong" },
    }))).status).toBe(403);
    expect(await (await GET(request("/api/admin/chat"))).json()).toEqual({ error: "Unauthorized" });
    expect(query).not.toHaveBeenCalled();
  });

  it("returns aggregate metrics and redacted paginated records to the owner", async () => {
    query
      .mockResolvedValueOnce([{ total_conversations: "2", total_messages: "4", total_events: "3", refused_messages: "1", error_messages: "0" }])
      .mockResolvedValueOnce([{ conversation_id: "c-1", created_at: "2026-01-01T00:00:00.000Z", expires_at: "2026-04-01T00:00:00.000Z", message_count: "2", refused_count: "0", error_count: "0" }]);

    const response = await GET(request("/api/admin/chat?page=1&pageSize=10", {
      headers: { authorization: "Bearer test-admin-secret" },
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      metrics: { totalConversations: 2, totalMessages: 4, totalEvents: 3, refusedMessages: 1, errorMessages: 0 },
      records: [{ conversationId: "c-1", createdAt: "2026-01-01T00:00:00.000Z", expiresAt: "2026-04-01T00:00:00.000Z", messageCount: 2, refusedCount: 0, errorCount: 0 }],
      pagination: { page: 1, pageSize: 10 },
    });
    const body = JSON.stringify(await (await GET(request("/api/admin/chat", {
      headers: { authorization: "Bearer test-admin-secret" },
    }))).json());
    expect(body).not.toMatch(/embedding|provider|ip|content|secret/i);
  });

  it("does not accept credentials in the query string", async () => {
    expect((await GET(request("/api/admin/chat?secret=test-admin-secret"))).status).toBe(401);
  });

  it("supports explicit conversation deletion and retention purge", async () => {
    query.mockResolvedValue([]);
    const headers = { authorization: "Bearer test-admin-secret", "content-type": "application/json" };
    const deleted = await DELETE(request("/api/admin/chat/delete", {
      method: "DELETE", headers, body: JSON.stringify({ operation: "conversation", conversationId: "c-1" }),
    }));
    expect(deleted.status).toBe(200);
    const purged = await DELETE(request("/api/admin/chat/delete", {
      method: "DELETE", headers, body: JSON.stringify({ operation: "expired" }),
    }));
    expect(purged.status).toBe(200);
    expect(query).toHaveBeenCalledTimes(2);
  });
});
