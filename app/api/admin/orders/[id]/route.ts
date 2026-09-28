import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orderItems, orders, payments } from "@/db/schema";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { createInvoicePublicId } from "@/lib/invoice";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
    const id = Number((await context.params).id);
    const body = await request.json() as { confirmPayment?: boolean; costAmount?: number };
    const hasCostAmount = body.costAmount !== undefined;
    if (!Number.isInteger(id) || (body.confirmPayment !== true && !hasCostAmount)) return Response.json({ error: "Aksi tidak valid" }, { status: 400 });
    if (hasCostAmount && (!Number.isInteger(body.costAmount) || body.costAmount! < 0)) return Response.json({ error: "Modal harus berupa angka nol atau lebih" }, { status: 400 });
    const db = getDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return Response.json({ error: "Order tidak ditemukan" }, { status: 404 });
    const now = new Date().toISOString();
    if (hasCostAmount) {
      await db.update(orders).set({ costAmount: body.costAmount!, updatedAt: now }).where(eq(orders.id, id));
    }
    if (body.confirmPayment !== true || order.paymentStatus === "paid") return Response.json({ success: true });
    const paidAt = order.paidAt || now;
    await db.update(orders).set({
      invoicePublicId: order.invoicePublicId || createInvoicePublicId(),
      paymentFee: 0,
      total: order.subtotal,
      paymentMethod: "manual_qris",
      paymentConfirmationMethod: "admin_manual",
      confirmedByAdmin: admin.id,
      paymentStatus: "paid",
      orderStatus: "lunas",
      paidAt,
      updatedAt: now,
    }).where(eq(orders.id, id));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Status gagal diperbarui" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
    const id = Number((await context.params).id);
    if (!Number.isInteger(id)) return Response.json({ error: "Order tidak valid" }, { status: 400 });
    const db = getDb();
    const [order] = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return Response.json({ error: "Order tidak ditemukan" }, { status: 404 });
    await db.batch([
      db.delete(payments).where(eq(payments.orderId, id)),
      db.delete(orderItems).where(eq(orderItems.orderId, id)),
      db.delete(orders).where(eq(orders.id, id)),
    ]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Order gagal dihapus" }, { status: 500 });
  }
}
