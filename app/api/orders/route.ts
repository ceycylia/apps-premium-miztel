import { desc, eq, inArray, like } from "drizzle-orm";
import { getDb } from "@/db";
import { orderItems, orders, products, productVariants } from "@/db/schema";
import { createInvoicePublicId } from "@/lib/invoice";

const PAYMENT_FEE = 1500;

async function documentNumbers() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const [latest] = await getDb().select({ orderNumber: orders.orderNumber }).from(orders).where(like(orders.orderNumber, `ORD-${date}-%`)).orderBy(desc(orders.orderNumber)).limit(1);
  const sequence = String(Number(latest?.orderNumber.split("-").pop() ?? 0) + 1).padStart(4, "0");
  return { orderNumber: `ORD-${date}-${sequence}`, invoiceNumber: `INV-${date}-${sequence}` };
}

type OrderItemInput = { productVariantId?: number; quantity?: number };

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      productVariantId?: number;
      items?: OrderItemInput[];
      buyerName?: string;
      buyerWhatsapp?: string;
      buyerEmail?: string;
      needsInvoice?: boolean;
      invoiceName?: string;
      companyName?: string;
    };

    if (!body.buyerName?.trim() || !body.buyerWhatsapp?.trim()) {
      return Response.json({ error: "Nama dan WhatsApp wajib diisi" }, { status: 400 });
    }

    const normalizedItems = body.items?.length
      ? body.items
      : body.productVariantId
        ? [{ productVariantId: body.productVariantId, quantity: 1 }]
        : [];

    if (!normalizedItems.length) {
      return Response.json({ error: "Keranjang kosong atau produk belum dipilih" }, { status: 400 });
    }

    const merged = new Map<number, number>();
    for (const item of normalizedItems) {
      if (!item.productVariantId || !Number.isInteger(item.quantity) || item.quantity! < 1 || item.quantity! > 99) {
        return Response.json({ error: "Setiap item wajib memiliki varian dan quantity valid" }, { status: 400 });
      }
      const nextQuantity = (merged.get(item.productVariantId) ?? 0) + item.quantity!;
      if (nextQuantity > 99) return Response.json({ error: "Quantity maksimal 99 per paket" }, { status: 400 });
      merged.set(item.productVariantId, nextQuantity);
    }

    const variantIds = [...merged.keys()];
    const db = getDb();
    const rows = await db
      .select({ variant: productVariants, product: products })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(inArray(productVariants.id, variantIds));

    if (rows.length !== variantIds.length) {
      return Response.json({ error: "Salah satu varian tidak ditemukan" }, { status: 404 });
    }

    const rowByVariantId = new Map(rows.map((row) => [row.variant.id, row]));
    let subtotal = 0;
    const lineItems: {
      productId: number;
      productVariantId: number;
      productNameSnapshot: string;
      variantNameSnapshot: string;
      priceSnapshot: number;
      quantity: number;
      subtotal: number;
    }[] = [];

    for (const [variantId, quantity] of merged) {
      const row = rowByVariantId.get(variantId);
      if (!row || !row.product.isActive || !row.variant.isActive) {
        return Response.json({ error: "Salah satu varian tidak tersedia" }, { status: 404 });
      }
      const lineSubtotal = row.variant.price * quantity;
      subtotal += lineSubtotal;
      lineItems.push({
        productId: row.product.id,
        productVariantId: row.variant.id,
        productNameSnapshot: row.product.name,
        variantNameSnapshot: [row.variant.variantName, row.variant.durationLabel].filter(Boolean).join(" · "),
        priceSnapshot: row.variant.price,
        quantity,
        subtotal: lineSubtotal,
      });
    }

    const numbers = await documentNumbers();
    const [order] = await db.insert(orders).values({
      ...numbers,
      invoicePublicId: createInvoicePublicId(),
      buyerName: body.buyerName.trim(),
      buyerWhatsapp: body.buyerWhatsapp.trim(),
      buyerEmail: body.buyerEmail?.trim() || null,
      needsInvoice: !!body.needsInvoice,
      invoiceName: body.invoiceName?.trim() || body.buyerName.trim(),
      companyName: body.companyName?.trim() || null,
      subtotal,
      paymentFee: PAYMENT_FEE,
      total: subtotal + PAYMENT_FEE,
      paymentMethod: "qris_midtrans",
    }).returning();

    await db.insert(orderItems).values(lineItems.map((item) => ({ ...item, orderId: order.id })));

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    return Response.json({ order: { ...order, items } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Gagal membuat order" }, { status: 500 });
  }
}
