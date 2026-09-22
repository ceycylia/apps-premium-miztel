import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { admins, adminSessions, passwordResetCodes } from "@/db/schema";
import { hashPassword, hashResetCode } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; code?: string; password?: string };
    if (!body.password || body.password.length < 8) return Response.json({ error: "Password baru minimal 8 karakter" }, { status: 400 });
    const db = getDb();
    const [admin] = await db.select().from(admins).where(eq(admins.email, body.email?.trim().toLowerCase() ?? "")).limit(1);
    if (!admin || !body.code) return Response.json({ error: "Kode tidak valid atau sudah kedaluwarsa" }, { status: 400 });
    const [reset] = await db.select().from(passwordResetCodes).where(and(eq(passwordResetCodes.adminId, admin.id), isNull(passwordResetCodes.usedAt), gt(passwordResetCodes.expiresAt, new Date().toISOString()))).orderBy(desc(passwordResetCodes.createdAt)).limit(1);
    if (!reset || reset.attempts >= 5 || await hashResetCode(body.code, reset.codeSalt) !== reset.codeHash) return Response.json({ error: "Kode tidak valid atau sudah kedaluwarsa" }, { status: 400 });
    const now = new Date().toISOString();
    await db.batch([
      db.update(admins).set({ passwordHash: await hashPassword(body.password), updatedAt: now }).where(eq(admins.id, admin.id)),
      db.update(passwordResetCodes).set({ usedAt: now, updatedAt: now }).where(eq(passwordResetCodes.id, reset.id)),
      db.delete(adminSessions).where(eq(adminSessions.adminId, admin.id)),
    ]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Reset password gagal" }, { status: 500 });
  }
}
