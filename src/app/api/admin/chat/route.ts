import postgres from "postgres";
import { adminResponse, isAdminRequest } from "@/lib/chat/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Sql = ReturnType<typeof postgres>;

function database(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Database is not configured");
  return postgres(url, { max: 1 });
}

function integer(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request: Request): Promise<Response> {
  const auth = request.headers.get("authorization");
  if (!auth) return adminResponse(401);
  if (!isAdminRequest(request, process.env.CHAT_ADMIN_SECRET)) return adminResponse(403);

  const url = new URL(request.url);
  const page = Math.min(Math.max(Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1), 10_000);
  const pageSize = Math.min(Math.max(Number.parseInt(url.searchParams.get("pageSize") ?? "25", 10) || 25, 1), 100);
  const offset = (page - 1) * pageSize;

  try {
    const sql = database();
    const [metricRows, recordRows] = await Promise.all([
      sql`
        SELECT
          (SELECT count(*) FROM chat_conversations) AS total_conversations,
          (SELECT count(*) FROM chat_messages) AS total_messages,
          (SELECT count(*) FROM chat_events) AS total_events,
          (SELECT count(*) FROM chat_messages WHERE refused = true) AS refused_messages,
          (SELECT count(*) FROM chat_messages WHERE error = true) AS error_messages
      `,
      sql`
        SELECT c.id AS conversation_id, c.created_at, c.expires_at,
               count(m.id) AS message_count,
               count(*) FILTER (WHERE m.refused = true) AS refused_count,
               count(*) FILTER (WHERE m.error = true) AS error_count
        FROM chat_conversations c
        LEFT JOIN chat_messages m ON m.conversation_id = c.id
        GROUP BY c.id, c.created_at, c.expires_at
        ORDER BY c.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
    ]);
    const metrics = metricRows[0] ?? {};
    const records = (recordRows ?? []).map((row) => ({
      conversationId: String(row.conversation_id),
      createdAt: new Date(String(row.created_at)).toISOString(),
      expiresAt: new Date(String(row.expires_at)).toISOString(),
      messageCount: integer(row.message_count),
      refusedCount: integer(row.refused_count),
      errorCount: integer(row.error_count),
    }));
    return Response.json({
      metrics: {
        totalConversations: integer(metrics.total_conversations),
        totalMessages: integer(metrics.total_messages),
        totalEvents: integer(metrics.total_events),
        refusedMessages: integer(metrics.refused_messages),
        errorMessages: integer(metrics.error_messages),
      },
      records,
      pagination: { page, pageSize },
    }, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return Response.json({ error: "Analytics unavailable" }, { status: 503 });
  }
}
