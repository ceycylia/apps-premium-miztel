import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orderItems, orders, payments } from "@/db/schema";
import { createInvoicePublicId } from "@/lib/invoice";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Simulasi pembayaran hanya tersedia di development mode" }, { status: 404 });
  }

  try {
    const body = await request.json() as { orderNumber?: string; whatsapp?: string };
    const db = getDb();
    const [order] = await db.select().from(orders).where(and(
      eq(orders.orderNumber, body.orderNumber?.trim() ?? ""),
      eq(orders.buyerWhatsapp, body.whatsapp?.trim() ?? ""),
    )).limit(1);

    if (!order) return Response.json({ error: "Order tidak ditemukan" }, { status: 404 });

    if (order.paymentStatus !== "paid") {
      const paidAt = new Date().toISOString();
      const invoiceNumber = order.invoiceNumber || order.orderNumber.replace(/^ORD-/, "INV-");
      const invoicePublicId = order.invoicePublicId || createInvoicePublicId();
      await db.batch([
        db.update(orders).set({
          invoiceNumber,
          invoicePublicId,
          paymentStatus: "paid",
          orderStatus: "lunas",
          paidAt,
          updatedAt: paidAt,
        }).where(eq(orders.id, order.id)),
        db.insert(payments).values({
          orderId: order.id,
          provider: "development",
          transactionId: `DEV-${order.orderNumber}`,
          paymentType: "simulation",
          grossAmount: order.total,
          feeAmount: order.paymentFee,
          paymentStatus: "paid",
          rawResponse: { simulated: true },
          paidAt,
        }),
      ]);
    }

    const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, order.id)).limit(1);
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    return Response.json({ order: { ...updatedOrder, items } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Simulasi pembayaran gagal" }, { status: 500 });
  }
}
