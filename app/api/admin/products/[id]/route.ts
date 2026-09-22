import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { orderItems, products, productVariants } from "@/db/schema";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";

const categories = ["Music Apps", "Editing Apps", "Streaming Apps", "Other Apps"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
    const id = Number((await context.params).id);
    const body = await request.json() as { name?: string; category?: string; description?: string; imageUrl?: string; isActive?: boolean; variants?: { name?: string; price?: number }[] };
    if (!Number.isInteger(id) || !body.name?.trim() || !categories.includes(body.category ?? "") || !body.variants?.length || body.variants.some((variant) => !variant.name?.trim() || !Number.isInteger(variant.price) || Number(variant.price) <= 0)) return Response.json({ error: "Data produk tidak valid" }, { status: 400 });
    const db = getDb();
    await db.update(products).set({ name: body.name.trim(), category: body.category!, description: body.description?.trim() ?? "", imageUrl: body.imageUrl?.trim() || null, isActive: body.isActive !== false, updatedAt: new Date().toISOString() }).where(eq(products.id, id));
    await db.update(productVariants).set({ isActive: false, updatedAt: new Date().toISOString() }).where(eq(productVariants.productId, id));
    await db.insert(productVariants).values(body.variants.map((variant) => ({ productId: id, variantName: variant.name!.trim(), durationLabel: "", price: Number(variant.price) })));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Produk gagal diperbarui" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
    const id = Number((await context.params).id);
    const db = getDb();
    const [usage] = await db.select({ value: sql<number>`count(*)` }).from(orderItems).where(eq(orderItems.productId, id));
    if (Number(usage?.value ?? 0) > 0) {
      await db.batch([db.update(products).set({ isActive: false, updatedAt: new Date().toISOString() }).where(eq(products.id, id)), db.update(productVariants).set({ isActive: false, updatedAt: new Date().toISOString() }).where(eq(productVariants.productId, id))]);
      return Response.json({ success: true, archived: true });
    }
    await db.delete(productVariants).where(eq(productVariants.productId, id));
    await db.delete(products).where(eq(products.id, id));
    return Response.json({ success: true, archived: false });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Produk gagal dihapus" }, { status: 500 });
  }
}
