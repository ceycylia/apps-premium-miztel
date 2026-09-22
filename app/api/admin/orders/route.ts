import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
    const db = getDb();
    const orderRows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100);
    const itemRows = await db.select().from(orderItems);
    return Response.json({ orders: orderRows.map((order) => ({ ...order, items: itemRows.filter((item) => item.orderId === order.id) })) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Pesanan gagal dimuat" }, { status: 500 });
  }
}
