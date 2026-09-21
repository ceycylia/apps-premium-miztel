import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, payments } from "@/db/schema";
import { isSuccessfulPayment, type MidtransNotification, verifyMidtransSignature } from "@/lib/midtrans";

export async function POST(request: Request) {
  try {
    const notification = await request.json() as MidtransNotification;
    if (!(await verifyMidtransSignature(notification))) return Response.json({ error: "Invalid signature" }, { status: 401 });
    const db = getDb();
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, notification.order_id)).limit(1);
    if (!order) return Response.json({ error: "Order tidak ditemukan" }, { status: 404 });
    const paid = isSuccessfulPayment(notification);
    const paymentStatus = paid ? "paid" : notification.transaction_status;
    const paidAt = paid ? (notification.settlement_time ?? new Date().toISOString()) : null;
    await db.batch([
      db.update(orders).set({ paymentStatus, orderStatus: paid ? "lunas" : order.orderStatus, paidAt, updatedAt: sqlNow() }).where(eq(orders.id, order.id)),
      db.insert(payments).values({ orderId: order.id, provider: "midtrans", transactionId: notification.transaction_id, paymentType: notification.payment_type, grossAmount: Math.round(Number(notification.gross_amount)), paymentStatus, rawResponse: notification, paidAt }),
    ]);
    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Webhook gagal diproses" }, { status: 500 });
  }
}

function sqlNow() { return new Date().toISOString(); }
