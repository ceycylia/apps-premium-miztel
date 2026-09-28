import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orderItems, orders, storeSettings } from "@/db/schema";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const token = (await context.params).token;
    if (!/^[a-f0-9]{32}$/i.test(token)) return Response.json({ error: "Order tidak ditemukan" }, { status: 404 });

    const db = getDb();
    const [order] = await db.select().from(orders).where(eq(orders.publicOrderToken, token)).limit(1);
    if (!order) return Response.json({ error: "Order tidak ditemukan" }, { status: 404 });

    const items = await db.select({
      productNameSnapshot: orderItems.productNameSnapshot,
      variantNameSnapshot: orderItems.variantNameSnapshot,
      quantity: orderItems.quantity,
      subtotal: orderItems.subtotal,
    }).from(orderItems).where(eq(orderItems.orderId, order.id));
    const [settings] = await db.select({
      whatsappNumber: storeSettings.whatsappNumber,
      qrisImageUrl: storeSettings.qrisImageUrl,
      qrisAccountName: storeSettings.qrisAccountName,
      paymentInstruction: storeSettings.paymentInstruction,
    }).from(storeSettings).orderBy(asc(storeSettings.id)).limit(1);

    return Response.json({
      order: {
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        total: order.subtotal,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        paidAt: order.paidAt,
        invoicePublicId: order.paymentStatus === "paid" ? order.invoicePublicId : null,
        items,
      },
      payment: {
        whatsappNumber: settings?.whatsappNumber ?? "",
        qrisImageUrl: settings?.qrisImageUrl ?? null,
        qrisAccountName: settings?.qrisAccountName ?? null,
        paymentInstruction: settings?.paymentInstruction ?? "Scan QRIS di atas dan lakukan pembayaran sesuai total pesanan.",
      },
    });
  } catch (error) {
    console.error("Gagal memuat status order publik", { message: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ error: "Status order gagal dimuat" }, { status: 500 });
  }
}
