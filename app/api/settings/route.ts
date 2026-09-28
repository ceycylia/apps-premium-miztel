import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { storeSettings } from "@/db/schema";

export async function GET() {
  try {
    const [settings] = await getDb().select().from(storeSettings).orderBy(asc(storeSettings.id)).limit(1);
    return Response.json({ settings: settings ?? { storeName: "Miztel Digital", whatsappNumber: "", whatsappChannelUrl: "", storePhone: "", storeEmail: "", qrisImageUrl: null, qrisAccountName: "", paymentInstruction: "Scan QRIS di atas dan lakukan pembayaran sesuai total pesanan.", invoiceNote: "Dokumen ini merupakan bukti pembelian yang sah" } });
  } catch {
    return Response.json({ settings: { storeName: "Miztel Digital", whatsappNumber: "", whatsappChannelUrl: "", storePhone: "", storeEmail: "", qrisImageUrl: null, qrisAccountName: "", paymentInstruction: "Scan QRIS di atas dan lakukan pembayaran sesuai total pesanan.", invoiceNote: "Dokumen ini merupakan bukti pembelian yang sah" } });
  }
}
