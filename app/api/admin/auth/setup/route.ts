import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { admins, storeSettings } from "@/db/schema";
import { createAdminSession, hashPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: string; email?: string; password?: string };
    if (!body.name?.trim() || !body.email?.trim() || !body.password || body.password.length < 8) return Response.json({ error: "Nama, email, dan password minimal 8 karakter wajib diisi" }, { status: 400 });
    const db = getDb();
    const [count] = await db.select({ value: sql<number>`count(*)` }).from(admins);
    if (Number(count?.value ?? 0) > 0) return Response.json({ error: "Admin sudah dibuat" }, { status: 409 });
    const [admin] = await db.insert(admins).values({ name: body.name.trim(), email: body.email.trim().toLowerCase(), passwordHash: await hashPassword(body.password) }).returning();
    const [settingsCount] = await db.select({ value: sql<number>`count(*)` }).from(storeSettings);
    if (Number(settingsCount?.value ?? 0) === 0) await db.insert(storeSettings).values({ storeName: "Miztel Digital", storeEmail: body.email.trim().toLowerCase() });
    return Response.json({ admin: { id: admin.id, name: admin.name, email: admin.email } }, { status: 201, headers: { "Set-Cookie": await createAdminSession(request, admin.id) } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Gagal membuat admin" }, { status: 500 });
  }
}
