import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { orders } from "@/db/schema";

export async function POST(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const token = (await context.params).token;
    if (!/^[a-f0-9]{32}$/i.test(token)) return Response.json({ error: "Order tidak ditemukan" }, { status: 404 });

    const db = getDb();
    const [order] = await db.select({ id: orders.id, paymentStatus: orders.paymentStatus }).from(orders).where(eq(orders.publicOrderToken, token)).limit(1);
    if (!order) return Response.json({ error: "Order tidak ditemukan" }, { status: 404 });
    if (order.paymentStatus === "paid") return Response.json({ success: true, orderStatus: "lunas" });

    await db.update(orders).set({
      orderStatus: "menunggu_konfirmasi",
      updatedAt: new Date().toISOString(),
    }).where(and(eq(orders.id, order.id), ne(orders.paymentStatus, "paid")));

    return Response.json({ success: true, orderStatus: "menunggu_konfirmasi" });
  } catch (error) {
    console.error("Gagal mencatat pengiriman bukti pembayaran", { message: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ error: "Status bukti pembayaran gagal diperbarui" }, { status: 500 });
  }
}
