import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { admins } from "@/db/schema";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const [count] = await getDb().select({ value: sql<number>`count(*)` }).from(admins);
    const admin = await getAuthenticatedAdmin(request);
    return Response.json({ needsSetup: Number(count?.value ?? 0) === 0, authenticated: !!admin, admin });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Status admin tidak tersedia" }, { status: 500 });
  }
}
