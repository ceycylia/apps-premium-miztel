import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { storeSettings } from "@/db/schema";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
  const [settings] = await getDb().select().from(storeSettings).orderBy(asc(storeSettings.id)).limit(1);
  return Response.json({ settings: settings ?? { storeName: "Miztel Digital", whatsappNumber: "", storePhone: "", storeEmail: "", storeAddress: "", invoiceNote: "Dokumen ini merupakan bukti pembelian yang sah" } });
}

export async function PUT(request: Request) {
  try {
    if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
    const body = await request.json() as { whatsappNumber?: string; storePhone?: string; storeEmail?: string; storeAddress?: string; invoiceNote?: string };
    const whatsapp = (body.whatsappNumber ?? "").replace(/[^0-9+]/g, "");
    if (whatsapp && whatsapp.replace(/\D/g, "").length < 9) return Response.json({ error: "Nomor WhatsApp tidak valid" }, { status: 400 });
    const db = getDb();
    const [count] = await db.select({ value: sql<number>`count(*)` }).from(storeSettings);
    const values = { storeName: "Miztel Digital", whatsappNumber: whatsapp, storePhone: body.storePhone?.trim() || whatsapp, storeEmail: body.storeEmail?.trim() || null, storeAddress: body.storeAddress?.trim() || null, invoiceNote: body.invoiceNote?.trim() || "Dokumen ini merupakan bukti pembelian yang sah", updatedAt: new Date().toISOString() };
    if (Number(count?.value ?? 0) === 0) await db.insert(storeSettings).values(values);
    else {
      const [settings] = await db.select().from(storeSettings).orderBy(asc(storeSettings.id)).limit(1);
      await db.update(storeSettings).set(values).where(eq(storeSettings.id, settings.id));
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Pengaturan gagal disimpan" }, { status: 500 });
  }
}
