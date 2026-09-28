import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { orderItems, orders, products, productVariants } from "@/db/schema";

export async function GET() {
  try {
    const db = getDb();
    const soldQuantity = sql<number>`coalesce(sum(case when ${orders.paymentStatus} = 'paid' then ${orderItems.quantity} else 0 end), 0)`.mapWith(Number).as("sold_quantity");
    const productRows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        category: products.category,
        description: products.description,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        soldQuantity,
      })
      .from(products)
      .leftJoin(orderItems, eq(orderItems.productId, products.id))
      .leftJoin(orders, eq(orders.id, orderItems.orderId))
      .where(eq(products.isActive, true))
      .groupBy(products.id)
      .orderBy(desc(soldQuantity), asc(products.name));
    const variantRows = await db.select().from(productVariants).where(eq(productVariants.isActive, true)).orderBy(asc(productVariants.price));
    return Response.json({ products: productRows.map((product) => ({ ...product, variants: variantRows.filter((variant) => variant.productId === product.id) })).filter((product) => product.variants.length > 0) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Katalog belum tersedia" }, { status: 500 });
  }
}
