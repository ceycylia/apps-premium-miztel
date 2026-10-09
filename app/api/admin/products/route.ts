import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products, productVariants } from "@/db/schema";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { normalizeProductImageUrl } from "@/lib/product-image";

const categories = ["Music Apps", "Editing Apps", "Streaming Apps", "Other Apps"];

function validPayload(body: { name?: string; category?: string; variants?: { name?: string; price?: number }[] }) {
  return !!body.name?.trim() && categories.includes(body.category ?? "") && Array.isArray(body.variants) && body.variants.length > 0 && body.variants.every((variant) => !!variant.name?.trim() && Number.isInteger(variant.price) && Number(variant.price) > 0);
}

function slugify(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
  const db = getDb();
  const productRows = await db.select().from(products).orderBy(asc(products.name));
  const variantRows = await db.select().from(productVariants).orderBy(asc(productVariants.price));
  return Response.json({ products: productRows.map((product) => ({ ...product, variants: variantRows.filter((variant) => variant.productId === product.id && variant.isActive) })) });
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
    const body = await request.json() as { name?: string; category?: string; description?: string; imageUrl?: string; variants?: { name?: string; price?: number }[] };
    if (!validPayload(body)) return Response.json({ error: "Nama, kategori, dan minimal satu paket valid wajib diisi" }, { status: 400 });
    const image = normalizeProductImageUrl(body.imageUrl);
    if (image.error) return Response.json({ error: image.error }, { status: 400 });
    const db = getDb();
    const [product] = await db.insert(products).values({ name: body.name!.trim(), slug: `${slugify(body.name!)}-${Date.now().toString().slice(-6)}`, category: body.category!, description: body.description?.trim() ?? "", imageUrl: image.url || null }).returning();
    try {
      await db.insert(productVariants).values(body.variants!.map((variant) => ({ productId: product.id, variantName: variant.name!.trim(), durationLabel: "", price: Number(variant.price) })));
    } catch (error) {
      await db.delete(products).where(eq(products.id, product.id));
      throw error;
    }
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Produk gagal disimpan" }, { status: 500 });
  }
}
