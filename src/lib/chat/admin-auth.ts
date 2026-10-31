import { createHash, timingSafeEqual } from "node:crypto";

export function isAdminRequest(request: Request, secret: string | undefined): boolean {
  const authorization = request.headers.get("authorization");
  if (!secret || !authorization?.startsWith("Bearer ")) return false;
  const supplied = authorization.slice("Bearer ".length);
  const expectedHash = createHash("sha256").update(secret).digest();
  const suppliedHash = createHash("sha256").update(supplied).digest();
  return timingSafeEqual(suppliedHash, expectedHash);
}

export function adminResponse(status: 401 | 403): Response {
  return Response.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
}
