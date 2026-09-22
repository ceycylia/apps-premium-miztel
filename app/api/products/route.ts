import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products, productVariants } from "@/db/schema";

export async function GET() {
  try {
    const db = getDb();
    const productRows = await db.select().from(products).where(eq(products.isActive, true)).orderBy(asc(products.name));
    const variantRows = await db.select().from(productVariants).where(eq(productVariants.isActive, true)).orderBy(asc(productVariants.price));
    return Response.json({ products: productRows.map((product) => ({ ...product, variants: variantRows.filter((variant) => variant.productId === product.id) })).filter((product) => product.variants.length > 0) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Katalog belum tersedia" }, { status: 500 });
  }
}
