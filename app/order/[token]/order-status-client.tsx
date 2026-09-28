"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- Native home links work reliably in the current vinext runtime. */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Clock3, Download, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseJson } from "@/lib/client-json";

type OrderItem = {
  productNameSnapshot: string;
  variantNameSnapshot: string;
  quantity: number;
  subtotal: number;
};

type PublicOrder = {
  orderNumber: string;
  subtotal: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  paidAt?: string | null;
  invoicePublicId?: string | null;
  items: OrderItem[];
};

type PaymentSettings = {
  whatsappNumber: string;
  qrisImageUrl?: string | null;
  qrisAccountName?: string | null;
  paymentInstruction: string;
};

const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

function whatsappUrl(number: string, message: string) {
  const digits = number.replace(/\D/g, "").replace(/^0/, "62");
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : "#";
}

export default function OrderStatusClient({ token }: { token: string }) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [payment, setPayment] = useState<PaymentSettings | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(token)}`, { cache: "no-store" });
      const data = await parseJson<{ order: PublicOrder; payment: PaymentSettings }>(response);
      if (!response.ok) throw new Error(data.error ?? "Status order gagal dimuat");
      setOrder(data.order);
      setPayment(data.payment);
      setError("");
    } catch (reason) {
      if (!quiet) setError(reason instanceof Error ? reason.message : "Status order gagal dimuat");
    } finally {
      if (!quiet) setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(true), 15_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [load]);

  const proofMessage = useMemo(() => {
    if (!order) return "";
    const itemLines = order.items.map((item) => `${item.productNameSnapshot} - ${item.variantNameSnapshot} x ${item.quantity}`).join("\n");
    return [
      "Halo kak, saya sudah melakukan pembayaran.",
      "",
      `Order: ${order.orderNumber}`,
      "",
      "Item:",
      itemLines,
      "",
      `Total: ${rupiah(order.total)}`,
      "",
      "Mohon dicek dan dikonfirmasi ya kak.",
      "Bukti pembayaran akan saya lampirkan di chat ini.",
    ].join("\n");
  }, [order]);

  function markProofSent() {
    if (!order || order.paymentStatus === "paid") return;
    setOrder({ ...order, orderStatus: "menunggu_konfirmasi" });
    void fetch(`/api/orders/${encodeURIComponent(token)}/payment-proof`, { method: "POST", keepalive: true });
  }

  if (error && !order) return <main className="grid min-h-screen place-items-center bg-[#F8F0F1] p-4"><div className="w-full max-w-md rounded-[24px] border border-[#EBCBD2] bg-white p-7 text-center"><h1 className="text-2xl font-black text-[#2A1620]">Order tidak tersedia</h1><p className="mt-3 text-sm text-[#6B7280]">{error}</p><Button asChild className="mt-6 rounded-xl bg-[#2A1620]"><Link href="/">Kembali ke toko</Link></Button></div></main>;
  if (!order || !payment) return <main className="grid min-h-screen place-items-center bg-[#F8F0F1]"><p className="font-bold text-[#8d5060]">Memuat status order...</p></main>;

  const paid = order.paymentStatus === "paid";
  const waitingConfirmation = order.orderStatus === "menunggu_konfirmasi";
  const canRefresh = !paid && ["menunggu_pembayaran", "menunggu_konfirmasi"].includes(order.orderStatus);
  const invoicePath = order.invoicePublicId ? `/invoice/${order.invoicePublicId}` : "";
  const processMessage = `Halo kak, pembayaran order ${order.orderNumber} sudah dikonfirmasi. Mohon diproses ya kak.`;

  return <main className="min-h-screen overflow-x-hidden bg-[#F8F0F1] text-[#22304A]">
    <header className="border-b border-[#EBCBD2] bg-white"><div className="mx-auto flex h-[72px] max-w-4xl items-center justify-between gap-4 px-4 sm:px-5"><Link href="/" className="font-black text-[#2A1620]">Miztel Digital</Link><span className="text-sm font-bold text-[#8d5060]">Status Order</span></div></header>
    <div className="mx-auto w-full max-w-2xl px-3 py-5 min-[390px]:px-4 sm:px-5 sm:py-10">
      <section className="rounded-[28px] border border-[#EBCBD2] bg-white p-5 text-center sm:p-7">
        {paid
          ? <span className="inline-flex items-center gap-2 rounded-full bg-[#dcfce7] px-4 py-2 text-sm font-black text-[#15803d]"><BadgeCheck className="size-4" /> Pembayaran Dikonfirmasi</span>
          : <span className="inline-flex items-center gap-2 rounded-full bg-[#fff3d6] px-4 py-2 text-sm font-black text-[#a66600]"><Clock3 className="size-4" /> {waitingConfirmation ? "Menunggu Konfirmasi Pembayaran" : "Menunggu Pembayaran"}</span>}
        <h1 className="mt-5 break-words text-2xl font-black text-[#2A1620] sm:text-3xl">{order.orderNumber}</h1>

        {!paid && payment.qrisImageUrl && <>
          <div className="mx-auto mt-6 w-full max-w-72 rounded-[22px] border-2 border-[#2A1620] bg-white p-3 shadow-[7px_7px_0_#E9B8C2]">
            <img src={payment.qrisImageUrl} alt="QRIS Miztel Digital" className="block h-auto w-full" />
          </div>
          {payment.qrisAccountName && <p className="mt-4 text-sm font-bold text-[#2A1620]">QRIS atas nama {payment.qrisAccountName}</p>}
        </>}

        <div className="mx-auto mt-6 max-w-md rounded-2xl bg-[#FDF8F9] p-4 text-left sm:p-5">
          <div className="space-y-3 text-sm">
            {order.items.map((item, index) => <div key={`${item.productNameSnapshot}-${index}`} className="flex items-start justify-between gap-3"><span className="min-w-0 break-words">{item.productNameSnapshot} - {item.variantNameSnapshot} × {item.quantity}</span><strong className="shrink-0">{rupiah(item.subtotal)}</strong></div>)}
            <div className="flex justify-between gap-3 border-t border-[#EBCBD2] pt-4 text-base"><strong>Total pembayaran</strong><strong className="shrink-0">{rupiah(order.total)}</strong></div>
          </div>
        </div>

        {!paid && <div className="mx-auto mt-6 max-w-lg text-sm leading-6 text-[#6B7280]">
          {payment.qrisImageUrl
            ? <><p>{payment.paymentInstruction}</p><p className="mt-2">Setelah pembayaran berhasil, kirim bukti pembayaran melalui WhatsApp agar pembayaran dapat dikonfirmasi admin. Lampirkan screenshot bukti secara manual di chat WhatsApp.</p></>
            : <p className="rounded-xl bg-[#fee2e2] p-4 font-semibold text-[#b91c1c]">Metode pembayaran QRIS belum tersedia. Silakan hubungi penjual.</p>}
        </div>}

        {!paid && payment.qrisImageUrl && payment.whatsappNumber && <Button asChild className="mt-6 h-auto min-h-12 w-full max-w-md whitespace-normal rounded-xl bg-[#2A1620] px-5 py-3 text-white"><a href={whatsappUrl(payment.whatsappNumber, proofMessage)} target="_blank" rel="noreferrer" onClick={markProofSent}><MessageCircle /> Kirim Bukti Pembayaran via WhatsApp</a></Button>}

        {paid && <div className="mx-auto mt-7 grid max-w-md gap-3 sm:grid-cols-2">
          {invoicePath && <><Button asChild className="h-12 rounded-xl bg-[#2A1620] text-white"><a href={invoicePath} target="_blank" rel="noreferrer"><BadgeCheck /> Lihat Invoice</a></Button><Button asChild variant="outline" className="h-12 rounded-xl border-[#EBCBD2]"><a href={`${invoicePath}?download=1`} target="_blank" rel="noreferrer"><Download /> Download Invoice PDF</a></Button></>}
          {payment.whatsappNumber && <Button asChild variant="outline" className="h-auto min-h-12 whitespace-normal rounded-xl border-[#EBCBD2] sm:col-span-2"><a href={whatsappUrl(payment.whatsappNumber, processMessage)} target="_blank" rel="noreferrer"><MessageCircle /> Proses Pesanan via WhatsApp</a></Button>}
          <Button asChild variant="ghost" className="h-12 rounded-xl text-[#8d5060] sm:col-span-2"><a href="/">Kembali ke Home</a></Button>
        </div>}

        {canRefresh && <Button disabled={refreshing} onClick={() => void load()} variant="ghost" className="mt-5 rounded-xl text-[#8d5060]"><RefreshCw className={refreshing ? "animate-spin" : ""} /> {refreshing ? "Memperbarui..." : "Perbarui Status"}</Button>}
        {error && <p className="mt-3 text-sm font-semibold text-[#b91c1c]">{error}</p>}
      </section>
    </div>
  </main>;
}
