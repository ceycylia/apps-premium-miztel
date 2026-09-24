import { createSnapTransaction } from "@/lib/midtrans";

export async function POST(request: Request) {
  try {
    const payload = await request.json() as {
      orderId?: string;
      grossAmount?: number;
      itemName?: string;
      items?: { id: string; name: string; price: number; quantity: number }[];
      buyerName?: string;
      buyerEmail?: string;
      buyerWhatsapp?: string;
    };

    if (!payload.orderId || !payload.grossAmount || !payload.buyerName || !payload.buyerWhatsapp) {
      return Response.json({ error: "Data transaksi belum lengkap" }, { status: 400 });
    }

    const transaction = await createSnapTransaction({
      orderId: payload.orderId,
      grossAmount: payload.grossAmount,
      itemName: payload.itemName,
      itemDetails: payload.items,
      customer: { firstName: payload.buyerName, email: payload.buyerEmail, phone: payload.buyerWhatsapp },
    });

    return Response.json(transaction, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Gagal membuat transaksi" }, { status: 500 });
  }
}
