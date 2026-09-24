import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { otherShopItems } from "@/db/schema";

export async function GET() {
  try {
    const items = await getDb().select().from(otherShopItems).where(eq(otherShopItems.isActive, true)).orderBy(asc(otherShopItems.createdAt));
    return Response.json({ items });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Katalog Other Shop belum tersedia" }, { status: 500 });
  }
}
