import { adminResponse, isAdminRequest } from "@/lib/chat/admin-auth";
import { getAdminDatabase } from "@/lib/chat/admin-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request): Promise<Response> {
  const auth = request.headers.get("authorization");
  if (!auth) return adminResponse(401);
  if (!isAdminRequest(request, process.env.CHAT_ADMIN_SECRET)) return adminResponse(403);

  let operation: unknown;
  let conversationId: unknown;
  try {
    ({ operation, conversationId } = await request.json() as { operation?: unknown; conversationId?: unknown });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (operation !== "expired" && operation !== "conversation") {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (operation === "conversation" && (typeof conversationId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(conversationId))) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const sql = getAdminDatabase();
    if (operation === "expired") {
      await sql`SELECT purge_expired_chat_data()`;
    } else {
      await sql`DELETE FROM chat_conversations WHERE id = ${conversationId as string}`;
    }
    return Response.json({ ok: true, operation }, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return Response.json({ error: "Deletion unavailable" }, { status: 503 });
  }
}
