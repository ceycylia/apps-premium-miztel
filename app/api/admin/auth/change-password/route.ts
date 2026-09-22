import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { admins, adminSessions } from "@/db/schema";
import { getAuthenticatedAdmin, hashPassword, verifyPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const sessionAdmin = await getAuthenticatedAdmin(request);
    if (!sessionAdmin) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
    const body = await request.json() as { currentPassword?: string; newPassword?: string };
    if (!body.newPassword || body.newPassword.length < 8) return Response.json({ error: "Password baru minimal 8 karakter" }, { status: 400 });
    const db = getDb();
    const [admin] = await db.select().from(admins).where(eq(admins.id, sessionAdmin.id)).limit(1);
    if (!admin || !body.currentPassword || !(await verifyPassword(body.currentPassword, admin.passwordHash))) return Response.json({ error: "Password saat ini salah" }, { status: 400 });
    await db.batch([
      db.update(admins).set({ passwordHash: await hashPassword(body.newPassword), updatedAt: new Date().toISOString() }).where(eq(admins.id, admin.id)),
      db.delete(adminSessions).where(eq(adminSessions.adminId, admin.id)),
    ]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Ganti password gagal" }, { status: 500 });
  }
}
