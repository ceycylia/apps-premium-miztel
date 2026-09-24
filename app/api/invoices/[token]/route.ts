import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orderItems, orders, storeSettings } from "@/db/schema";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const token = (await context.params).token;
    if (!/^[a-f0-9]{32}$/i.test(token)) return Response.json({ error: "Invoice tidak ditemukan" }, { status: 404 });

    const db = getDb();
    const [order] = await db.select({
      orderNumber: orders.orderNumber,
      invoiceNumber: orders.invoiceNumber,
      buyerName: orders.buyerName,
      buyerWhatsapp: orders.buyerWhatsapp,
      invoiceName: orders.invoiceName,
      companyName: orders.companyName,
      subtotal: orders.subtotal,
      paymentFee: orders.paymentFee,
      total: orders.total,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      paidAt: orders.paidAt,
    }).from(orders).where(and(eq(orders.invoicePublicId, token), eq(orders.paymentStatus, "paid"))).limit(1);

    if (!order) return Response.json({ error: "Invoice tidak ditemukan atau belum lunas" }, { status: 404 });
    const [fullOrder] = await db.select({ id: orders.id }).from(orders).where(eq(orders.invoicePublicId, token)).limit(1);
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, fullOrder.id));
    const [settings] = await db.select().from(storeSettings).orderBy(asc(storeSettings.id)).limit(1);
    return Response.json({
      invoice: { ...order, items },
      settings: settings ?? { storeName: "Miztel Digital", storeAddress: "", storePhone: "", storeEmail: "", invoiceNote: "Dokumen ini merupakan bukti pembelian yang sah" },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invoice gagal dimuat" }, { status: 500 });
  }
}
