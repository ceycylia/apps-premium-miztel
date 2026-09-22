import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { admins, passwordResetCodes } from "@/db/schema";
import { hashResetCode } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; code?: string };
    const db = getDb();
    const [admin] = await db.select().from(admins).where(eq(admins.email, body.email?.trim().toLowerCase() ?? "")).limit(1);
    if (!admin || !body.code) return Response.json({ error: "Kode tidak valid atau sudah kedaluwarsa" }, { status: 400 });
    const [reset] = await db.select().from(passwordResetCodes).where(and(eq(passwordResetCodes.adminId, admin.id), isNull(passwordResetCodes.usedAt), gt(passwordResetCodes.expiresAt, new Date().toISOString()))).orderBy(desc(passwordResetCodes.createdAt)).limit(1);
    if (!reset || reset.attempts >= 5 || await hashResetCode(body.code, reset.codeSalt) !== reset.codeHash) {
      if (reset) await db.update(passwordResetCodes).set({ attempts: reset.attempts + 1, updatedAt: new Date().toISOString() }).where(eq(passwordResetCodes.id, reset.id));
      return Response.json({ error: "Kode tidak valid atau sudah kedaluwarsa" }, { status: 400 });
    }
    return Response.json({ verified: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Verifikasi gagal" }, { status: 500 });
  }
}
