import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orderItems, orders, products, productVariants } from "@/db/schema";

function documentNumbers() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const sequence = String(now.getTime()).slice(-4);
  return { orderNumber: `ORD-${date}-${sequence}`, invoiceNumber: `INV-${date}-${sequence}` };
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { productVariantId?: number; buyerName?: string; buyerWhatsapp?: string; buyerEmail?: string; needsInvoice?: boolean; invoiceName?: string; companyName?: string };
    if (!body.productVariantId || !body.buyerName?.trim() || !body.buyerWhatsapp?.trim()) return Response.json({ error: "Produk, nama, dan WhatsApp wajib diisi" }, { status: 400 });
    const db = getDb();
    const [variant] = await db.select({ variant: productVariants, product: products }).from(productVariants).innerJoin(products, eq(productVariants.productId, products.id)).where(eq(productVariants.id, body.productVariantId)).limit(1);
    if (!variant || !variant.product.isActive || !variant.variant.isActive) return Response.json({ error: "Varian tidak tersedia" }, { status: 404 });
    const fee = 1500;
    const numbers = documentNumbers();
    const [order] = await db.insert(orders).values({ ...numbers, buyerName: body.buyerName.trim(), buyerWhatsapp: body.buyerWhatsapp.trim(), buyerEmail: body.buyerEmail?.trim() || null, needsInvoice: !!body.needsInvoice, invoiceName: body.invoiceName?.trim() || body.buyerName.trim(), companyName: body.companyName?.trim() || null, subtotal: variant.variant.price, paymentFee: fee, total: variant.variant.price + fee, paymentMethod: "qris_midtrans" }).returning();
    await db.insert(orderItems).values({ orderId: order.id, productId: variant.product.id, productVariantId: variant.variant.id, productNameSnapshot: variant.product.name, variantNameSnapshot: `${variant.variant.variantName} · ${variant.variant.durationLabel}`, priceSnapshot: variant.variant.price, quantity: 1, subtotal: variant.variant.price });
    return Response.json({ order }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Gagal membuat order" }, { status: 500 });
  }
}
