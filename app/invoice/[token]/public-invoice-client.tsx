"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseJson } from "@/lib/client-json";

type InvoiceData = {
  orderNumber: string;
  invoiceNumber: string;
  buyerName: string;
  buyerWhatsapp: string;
  invoiceName?: string | null;
  companyName?: string | null;
  subtotal: number;
  paymentMethod: string;
  paymentStatus: string;
  paidAt?: string | null;
  items: { id: number; productNameSnapshot: string; variantNameSnapshot: string; priceSnapshot: number; quantity: number; subtotal: number }[];
};
type Settings = { storeName: string; storeAddress?: string | null; storePhone?: string | null; storeEmail?: string | null; invoiceNote?: string | null };
const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export default function PublicInvoiceClient({ token }: { token: string }) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [settings, setSettings] = useState<Settings>({ storeName: "Miztel Digital" });
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/invoices/${encodeURIComponent(token)}`).then(async (response) => {
      const data = await parseJson<{ invoice: InvoiceData; settings: Settings }>(response);
      if (!response.ok) throw new Error(data.error ?? "Invoice gagal dimuat");
      setInvoice(data.invoice);
      setSettings(data.settings);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "Invoice gagal dimuat"));
  }, [token]);

  useEffect(() => {
    if (!invoice) return;
    const mode = new URLSearchParams(window.location.search);
    if (mode.has("print") || mode.has("download")) window.setTimeout(() => window.print(), 250);
  }, [invoice]);

  if (error) return <main className="grid min-h-screen place-items-center bg-[#F8F0F1] p-5"><div className="max-w-md rounded-[24px] border border-[#EBCBD2] bg-white p-8 text-center"><h1 className="text-2xl font-black text-[#2A1620]">Invoice tidak tersedia</h1><p className="mt-3 text-sm text-[#6B7280]">{error}</p></div></main>;
  if (!invoice) return <main className="grid min-h-screen place-items-center bg-[#F8F0F1]"><p className="font-bold text-[#8d5060]">Memuat invoice...</p></main>;

  return <main className="min-h-screen bg-[#F8F0F1] print:bg-white"><header className="border-b border-[#EBCBD2] bg-white print:hidden"><div className="mx-auto flex h-[72px] max-w-4xl items-center justify-between px-5"><Link href="/" className="font-black text-[#2A1620]">Miztel Digital</Link><span className="text-sm font-bold text-[#8d5060]">Invoice resmi</span></div></header><div className="mx-auto max-w-4xl px-4 py-8 print:p-0"><div className="mb-5 flex flex-wrap justify-end gap-2 print:hidden"><Button variant="outline" onClick={() => window.print()} className="border-[#EBCBD2]"><Download /> Download PDF</Button><Button variant="outline" onClick={() => window.print()} className="border-[#EBCBD2]"><Printer /> Print Invoice</Button></div><article className="invoice-sheet overflow-hidden rounded-[20px] border border-[#EBCBD2] bg-white print:border-0"><div className="h-3 bg-[#E9B8C2]" /><div className="p-7 sm:p-10"><div className="flex justify-between gap-5 border-b border-[#EBCBD2] pb-7"><div><h1 className="text-xl font-black text-[#2A1620]">{settings.storeName || "Miztel Digital"}</h1><p className="mt-1 text-sm text-[#6B7280]">{settings.storeAddress}</p><p className="text-sm text-[#6B7280]">{settings.storeEmail || settings.storePhone}</p></div><div className="text-right"><p className="text-xs font-black uppercase tracking-wider text-[#b05e73]">Invoice</p><p className="mt-1 font-black text-[#2A1620]">{invoice.invoiceNumber}</p><span className="mt-2 inline-flex rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-black text-[#15803d]">LUNAS</span></div></div><div className="grid gap-6 border-b border-[#EBCBD2] py-7 sm:grid-cols-2"><div><p className="text-xs font-black uppercase text-[#9c6875]">Ditagihkan kepada</p><p className="mt-2 font-black">{invoice.invoiceName || invoice.buyerName}</p><p className="text-sm text-[#6B7280]">{invoice.companyName}</p><p className="text-sm text-[#6B7280]">{invoice.buyerWhatsapp}</p></div><div className="sm:text-right"><p className="text-xs font-black uppercase text-[#9c6875]">Detail transaksi</p><p className="mt-2 text-sm">Order: <strong>{invoice.orderNumber}</strong></p><p className="text-sm">Tanggal pembayaran: <strong>{invoice.paidAt ? new Date(invoice.paidAt).toLocaleString("id-ID") : "-"}</strong></p><p className="text-sm">Metode: <strong>{invoice.paymentMethod === "manual_qris" ? "QRIS - Konfirmasi Manual" : "Pembayaran Manual"}</strong></p></div></div><Table className="mt-6"><TableHeader><TableRow className="bg-[#F8F0F1]"><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Harga</TableHead></TableRow></TableHeader><TableBody>{invoice.items.map((item) => <TableRow key={item.id}><TableCell><strong>{item.productNameSnapshot}</strong><span className="block text-sm text-[#6B7280]">{item.variantNameSnapshot}</span></TableCell><TableCell>{item.quantity}</TableCell><TableCell className="text-right">{rupiah(item.subtotal)}</TableCell></TableRow>)}</TableBody></Table><div className="ml-auto mt-6 max-w-sm space-y-2 text-sm"><p className="flex justify-between"><span>Subtotal produk</span><span>{rupiah(invoice.subtotal)}</span></p><p className="flex justify-between border-t border-[#EBCBD2] pt-3 text-lg font-black"><span>Total dibayar</span><span>{rupiah(invoice.subtotal)}</span></p></div><p className="mt-9 flex items-center gap-2 rounded-2xl bg-[#F8F0F1] p-4 text-sm text-[#6B7280]"><BadgeCheck className="size-5 text-[#b05e73]" /> {settings.invoiceNote || "Dokumen ini merupakan bukti pembelian yang sah"}</p></div></article></div></main>;
}
