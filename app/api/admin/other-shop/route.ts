import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { otherShopItems } from "@/db/schema";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
  const items = await getDb().select().from(otherShopItems).orderBy(desc(otherShopItems.createdAt));
  return Response.json({ items });
}

export async function POST(request: Request) {
  try {
    if (!(await getAuthenticatedAdmin(request))) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
    const body = await request.json() as { title?: string; imageUrl?: string; isActive?: boolean };
    if (!body.title?.trim() || !body.imageUrl?.trim()) return Response.json({ error: "Judul dan foto/poster wajib diisi" }, { status: 400 });
    const [item] = await getDb().insert(otherShopItems).values({ title: body.title.trim(), imageUrl: body.imageUrl.trim(), isActive: body.isActive !== false }).returning();
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Item Other Shop gagal disimpan" }, { status: 500 });
  }
}
