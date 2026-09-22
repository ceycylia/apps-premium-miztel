import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, payments } from "@/db/schema";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";

const statuses = ["menunggu_pembayaran", "lunas", "diproses", "selesai", "dibatalkan"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
    const id = Number((await context.params).id);
    const body = await request.json() as { orderStatus?: string; confirmPayment?: boolean };
    if (!Number.isInteger(id) || (body.orderStatus && !statuses.includes(body.orderStatus))) return Response.json({ error: "Status tidak valid" }, { status: 400 });
    const db = getDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return Response.json({ error: "Order tidak ditemukan" }, { status: 404 });
    const now = new Date().toISOString();
    if (body.confirmPayment) {
      await db.batch([
        db.update(orders).set({ paymentStatus: "paid", orderStatus: "lunas", paidAt: now, updatedAt: now }).where(eq(orders.id, id)),
        db.insert(payments).values({ orderId: id, provider: "manual", paymentType: "manual_confirmation", grossAmount: order.total, feeAmount: order.paymentFee, paymentStatus: "paid", paidAt: now }),
      ]);
    } else if (body.orderStatus) await db.update(orders).set({ orderStatus: body.orderStatus, updatedAt: now }).where(eq(orders.id, id));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Status gagal diperbarui" }, { status: 500 });
  }
}
