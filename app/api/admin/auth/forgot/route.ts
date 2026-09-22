import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { admins, passwordResetCodes } from "@/db/schema";
import { hashResetCode, makeResetCode, makeSalt } from "@/lib/admin-auth";
import { sendResetCodeEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const db = getDb();
    const [admin] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
    if (!admin) return Response.json({ success: true, message: "Jika email terdaftar, kode akan dikirim." });
    const recent = await db.select().from(passwordResetCodes).where(eq(passwordResetCodes.adminId, admin.id)).orderBy(desc(passwordResetCodes.createdAt)).limit(1);
    if (recent[0] && Date.now() - new Date(recent[0].createdAt).getTime() < 60_000) return Response.json({ error: "Tunggu satu menit sebelum meminta kode baru" }, { status: 429 });
    const code = makeResetCode();
    const salt = makeSalt();
    await db.insert(passwordResetCodes).values({ adminId: admin.id, codeHash: await hashResetCode(code, salt), codeSalt: salt, expiresAt: new Date(Date.now() + 10 * 60_000).toISOString() });
    const delivery = await sendResetCodeEmail({ to: admin.email, name: admin.name, code });
    return Response.json({ success: true, message: "Jika email terdaftar, kode akan dikirim.", previewCode: "previewCode" in delivery ? delivery.previewCode : undefined });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Kode reset gagal dikirim" }, { status: 500 });
  }
}
