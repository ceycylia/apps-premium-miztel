import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { createInvoicePublicId } from "@/lib/invoice";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { orderNumber?: string; whatsapp?: string };
    const db = getDb();
    const [order] = await db.select().from(orders).where(and(eq(orders.orderNumber, body.orderNumber?.trim() ?? ""), eq(orders.buyerWhatsapp, body.whatsapp?.trim() ?? ""))).limit(1);
    if (!order) return Response.json({ error: "Order tidak ditemukan" }, { status: 404 });
    let currentOrder = order;
    if (order.paymentStatus === "paid" && !order.invoicePublicId) {
      const invoicePublicId = createInvoicePublicId();
      await db.update(orders).set({ invoicePublicId, paidAt: order.paidAt || new Date().toISOString(), updatedAt: new Date().toISOString() }).where(eq(orders.id, order.id));
      currentOrder = { ...order, invoicePublicId, paidAt: order.paidAt || new Date().toISOString() };
    }
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    return Response.json({ order: { ...currentOrder, items } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Status order gagal dimuat" }, { status: 500 });
  }
}
