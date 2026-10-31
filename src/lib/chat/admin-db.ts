import postgres from "postgres";

type AdminDatabase = ReturnType<typeof postgres>;

let cachedUrl: string | undefined;
let cachedDatabase: AdminDatabase | undefined;

export function getAdminDatabase(): AdminDatabase {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Database is not configured");
  if (!cachedDatabase || cachedUrl !== url) {
    cachedDatabase = postgres(url, { max: 1 });
    cachedUrl = url;
  }
  return cachedDatabase;
}
