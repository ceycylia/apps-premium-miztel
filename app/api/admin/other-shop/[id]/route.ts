import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { otherShopItems } from "@/db/schema";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { normalizeProductImageUrl } from "@/lib/product-image";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
    const id = Number((await context.params).id);
    const body = await request.json() as { title?: string; imageUrl?: string; isActive?: boolean };
    if (!Number.isInteger(id) || !body.title?.trim() || !body.imageUrl?.trim()) return Response.json({ error: "Data Other Shop tidak valid" }, { status: 400 });
    const image = normalizeProductImageUrl(body.imageUrl);
    if (image.error || !image.url) return Response.json({ error: image.error ?? "Link gambar tidak valid" }, { status: 400 });
    await getDb().update(otherShopItems).set({ title: body.title.trim(), imageUrl: image.url, isActive: body.isActive !== false, updatedAt: new Date().toISOString() }).where(eq(otherShopItems.id, id));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Item Other Shop gagal diperbarui" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
    const id = Number((await context.params).id);
    if (!Number.isInteger(id)) return Response.json({ error: "ID tidak valid" }, { status: 400 });
    await getDb().delete(otherShopItems).where(eq(otherShopItems.id, id));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Item Other Shop gagal dihapus" }, { status: 500 });
  }
}
