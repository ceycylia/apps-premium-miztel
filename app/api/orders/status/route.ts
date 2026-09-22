import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orderItems, orders } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { orderNumber?: string; whatsapp?: string };
    const db = getDb();
    const [order] = await db.select().from(orders).where(and(eq(orders.orderNumber, body.orderNumber?.trim() ?? ""), eq(orders.buyerWhatsapp, body.whatsapp?.trim() ?? ""))).limit(1);
    if (!order) return Response.json({ error: "Order tidak ditemukan" }, { status: 404 });
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    return Response.json({ order: { ...order, items } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Status order gagal dimuat" }, { status: 500 });
  }
}
