import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { storeSettings } from "@/db/schema";
import { getAuthenticatedAdmin, verifyAdminPassword } from "@/lib/admin-auth";
import { normalizeGoogleDriveImageUrl } from "@/lib/product-image";

function normalizeChannelUrl(value?: string) {
  const raw = value?.trim() ?? "";
  if (!raw) return "";
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const parsed = new URL(candidate);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error("Link Channel WhatsApp harus berupa URL yang valid");
  return parsed.toString();
}

const defaultSettings = {
  storeName: "Miztel Digital",
  whatsappNumber: "",
  whatsappChannelUrl: "",
  storePhone: "",
  storeEmail: "",
  storeAddress: "",
  qrisImageUrl: null,
  qrisAccountName: "",
  paymentInstruction: "Scan QRIS di atas dan lakukan pembayaran sesuai total pesanan.",
  invoiceNote: "Dokumen ini merupakan bukti pembelian yang sah",
};

export async function GET(request: Request) {
  if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
  const [settings] = await getDb().select().from(storeSettings).orderBy(asc(storeSettings.id)).limit(1);
  return Response.json({ settings: settings ?? defaultSettings });
}

export async function PUT(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
    const body = await request.json() as { adminPassword?: string; whatsappNumber?: string; whatsappChannelUrl?: string; storePhone?: string; storeEmail?: string; storeAddress?: string; qrisImageUrl?: string; qrisAccountName?: string; paymentInstruction?: string; invoiceNote?: string };
    if (!(await verifyAdminPassword(admin.id, body.adminPassword ?? ""))) return Response.json({ error: "Password admin salah" }, { status: 403 });
    const whatsapp = (body.whatsappNumber ?? "").replace(/[^0-9+]/g, "");
    if (whatsapp && whatsapp.replace(/\D/g, "").length < 9) return Response.json({ error: "Nomor WhatsApp tidak valid" }, { status: 400 });
    let whatsappChannelUrl = "";
    try { whatsappChannelUrl = normalizeChannelUrl(body.whatsappChannelUrl); }
    catch { return Response.json({ error: "Link Channel WhatsApp tidak valid" }, { status: 400 }); }
    const qrisImage = normalizeGoogleDriveImageUrl(body.qrisImageUrl ?? "");
    if (qrisImage.error || !qrisImage.url) return Response.json({ error: qrisImage.error ?? "Link gambar QRIS Google Drive wajib diisi" }, { status: 400 });
    const db = getDb();
    const [count] = await db.select({ value: sql<number>`count(*)` }).from(storeSettings);
    const [currentSettings] = await db.select().from(storeSettings).orderBy(asc(storeSettings.id)).limit(1);
    const values = {
      storeName: "Miztel Digital",
      whatsappNumber: whatsapp,
      whatsappChannelUrl,
      storePhone: body.storePhone?.trim() || whatsapp,
      storeEmail: body.storeEmail?.trim() || null,
      storeAddress: body.storeAddress?.trim() || null,
      qrisImageUrl: qrisImage.url,
      qrisAccountName: body.qrisAccountName?.trim().slice(0, 100) || null,
      paymentInstruction: body.paymentInstruction?.trim().slice(0, 500) || defaultSettings.paymentInstruction,
      invoiceNote: body.invoiceNote?.trim() || defaultSettings.invoiceNote,
      updatedAt: new Date().toISOString(),
    };
    if (Number(count?.value ?? 0) === 0) await db.insert(storeSettings).values(values);
    else if (currentSettings) await db.update(storeSettings).set(values).where(eq(storeSettings.id, currentSettings.id));

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Pengaturan gagal disimpan" }, { status: 500 });
  }
}
