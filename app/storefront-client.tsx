"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Clock3, Download, Headphones, LayoutGrid, MessageCircle, Play, Printer, QrCode, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Variant = { id: number; variantName: string; price: number };
type Product = { id: number; name: string; category: string; description: string; imageUrl: string | null; variants: Variant[] };
type Settings = { storeName: string; whatsappNumber: string; storePhone?: string; storeEmail?: string; invoiceNote?: string };
type Order = { id: number; orderNumber: string; invoiceNumber: string; subtotal: number; paymentFee: number; total: number; paymentStatus: string; orderStatus: string; paidAt?: string | null };

const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const categories = ["Semua", "Music Apps", "Editing Apps", "Streaming Apps", "Other Apps"];

function whatsappUrl(number: string, message: string) {
  const digits = number.replace(/\D/g, "").replace(/^0/, "62");
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : "#";
}

function ProductIcon({ product, size = "normal" }: { product: Product; size?: "normal" | "small" }) {
  const dimensions = size === "small" ? "size-11 rounded-xl" : "size-14 rounded-[18px]";
  if (product.imageUrl) return <img src={product.imageUrl} alt={`Icon ${product.name}`} className={`${dimensions} object-cover ring-1 ring-[#EBCBD2]`} />;
  return <span className={`grid ${dimensions} place-items-center bg-[#2A1620] text-lg font-black text-white`}>{product.name.slice(0, 1).toUpperCase()}</span>;
}

export default function StorefrontClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings>({ storeName: "Miztel Digital", whatsappNumber: "" });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [selected, setSelected] = useState<Product | null>(null);
  const [variantId, setVariantId] = useState(0);
  const [view, setView] = useState<"store" | "checkout" | "payment" | "invoice">("store");
  const [buyerName, setBuyerName] = useState("");
  const [buyerWhatsapp, setBuyerWhatsapp] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [needsInvoice, setNeedsInvoice] = useState(true);
  const [invoiceName, setInvoiceName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/products").then((response) => response.json()), fetch("/api/settings").then((response) => response.json())])
      .then(([catalog, store]) => { setProducts(catalog.products ?? []); setSettings(store.settings ?? settings); })
      .catch(() => setMessage("Katalog sedang tidak tersedia. Silakan hubungi penjual."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()) && (category === "Semua" || product.category === category)), [products, query, category]);
  const chosenVariant = selected?.variants.find((variant) => variant.id === variantId) ?? selected?.variants[0];
  const chatLink = whatsappUrl(settings.whatsappNumber, "Halo Miztel Digital, saya ingin bertanya tentang produk digital.");

  const openProduct = (product: Product) => { setSelected(product); setVariantId(product.variants[0]?.id ?? 0); };

  async function createOrder() {
    if (!selected || !chosenVariant) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productVariantId: chosenVariant.id, buyerName, buyerWhatsapp, buyerEmail, needsInvoice, invoiceName: invoiceName || buyerName, companyName }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Order gagal dibuat");
      setOrder(data.order);
      const paymentResponse = await fetch("/api/midtrans/transaction", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: data.order.orderNumber, grossAmount: data.order.total, itemName: `${selected.name} - ${chosenVariant.variantName}`, buyerName, buyerEmail, buyerWhatsapp }) });
      const payment = await paymentResponse.json();
      if (paymentResponse.ok) setPaymentUrl(payment.redirect_url ?? "");
      setView("payment");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Order gagal dibuat"); }
    finally { setSubmitting(false); }
  }

  async function checkStatus() {
    if (!order) return;
    setSubmitting(true);
    const response = await fetch("/api/orders/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber: order.orderNumber, whatsapp: buyerWhatsapp }) });
    const data = await response.json();
    setSubmitting(false);
    if (!response.ok) return setMessage(data.error ?? "Status gagal diperiksa");
    setOrder(data.order);
    if (data.order.paymentStatus === "paid") setView("invoice");
    else setMessage("Pembayaran belum terkonfirmasi. Coba lagi sebentar.");
  }

  if (view === "checkout" && selected && chosenVariant) return <Checkout product={selected} variant={chosenVariant} values={{ buyerName, buyerWhatsapp, buyerEmail, needsInvoice, invoiceName, companyName }} setters={{ setBuyerName, setBuyerWhatsapp, setBuyerEmail, setNeedsInvoice, setInvoiceName, setCompanyName }} onBack={() => setView("store")} onSubmit={createOrder} message={message} submitting={submitting} />;
  if (view === "payment" && selected && chosenVariant && order) return <Payment product={selected} variant={chosenVariant} order={order} paymentUrl={paymentUrl} whatsapp={settings.whatsappNumber} buyerWhatsapp={buyerWhatsapp} onBack={() => setView("checkout")} onCheck={checkStatus} message={message} submitting={submitting} />;
  if (view === "invoice" && selected && chosenVariant && order) return <Invoice product={selected} variant={chosenVariant} order={order} settings={settings} buyer={{ buyerName, buyerWhatsapp, invoiceName: invoiceName || buyerName, companyName }} onBack={() => setView("store")} />;

  return <main className="min-h-screen bg-[#F8F0F1] text-[#22304A]">
    <header className="sticky top-0 z-30 border-b border-[#EBCBD2] bg-white/95 backdrop-blur"><div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8"><a href="#top" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-[#2A1620] text-lg font-black text-white shadow-[4px_4px_0_#E9B8C2]">M</span><span><strong className="block text-[17px] leading-5 text-[#2A1620]">Miztel Digital</strong><small className="text-xs font-semibold tracking-[.16em] text-[#9a6672]">DIGITAL GOODS</small></span></a><nav className="hidden items-center gap-7 text-sm font-semibold md:flex"><a href="#produk">Produk</a><a href="#cara">Cara pembelian</a><a href="#bantuan">Bantuan</a></nav><Button asChild variant="outline" className="rounded-xl border-[#EBCBD2] bg-white text-[#2A1620] hover:bg-[#F8F0F1]"><a href={chatLink} target="_blank" rel="noreferrer"><MessageCircle /><span className="hidden sm:inline">Chat Penjual</span></a></Button></div></header>

    <section id="top" className="mx-auto grid max-w-7xl gap-6 px-5 pb-9 pt-9 lg:grid-cols-[1.35fr_.65fr] lg:px-8 lg:pb-12 lg:pt-12"><div className="flex flex-col justify-center rounded-[30px] border border-[#EBCBD2] bg-white p-7 shadow-[0_18px_60px_rgba(87,38,57,.07)] sm:p-10"><span className="mb-5 w-fit rounded-full bg-[#F2D8DE] px-4 py-2 text-sm font-black text-[#713548]">✓ Trusted 100%</span><h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-[-.04em] text-[#2A1620] sm:text-5xl">Lakukan pembayaran melalui web jika perlu Struk/Invoice</h1><p className="mt-4 text-base font-semibold text-[#8e5b69] sm:text-lg">(Manual by WhatsApp jika tidak perlu struk)</p><div className="mt-7 flex flex-wrap gap-3"><Button size="lg" className="h-12 rounded-xl bg-[#2A1620] px-6 text-white hover:bg-[#4a2838]" asChild><a href="#produk">Lihat Katalog <ArrowRight /></a></Button><Button size="lg" variant="outline" className="h-12 rounded-xl border-[#EBCBD2] bg-white px-6 text-[#2A1620] hover:bg-[#F8F0F1]" asChild><a href="#cara">Cara Pembelian</a></Button></div></div><aside className="rounded-[30px] bg-[#E9B8C2] p-6 text-[#2A1620]"><div className="flex items-center justify-between"><span className="rounded-full bg-white/75 px-3 py-1 text-xs font-bold uppercase tracking-widest">Invoice preview</span><BadgeCheck className="size-5" /></div><div className="mx-auto mt-5 max-w-xs rounded-[18px] bg-white p-4 shadow-[7px_7px_0_rgba(42,22,32,.1)]"><div className="flex justify-between border-b border-dashed border-[#EBCBD2] pb-3"><div><p className="text-[11px] font-black tracking-wider text-[#a46775]">INVOICE</p><p className="text-sm font-black">INV-20260922-0001</p></div><span className="h-fit rounded-full bg-[#dcfce7] px-2 py-1 text-[10px] font-black text-[#15803d]">LUNAS</span></div><div className="flex justify-between py-4 text-sm"><span>Produk digital</span><strong>Rp65.000</strong></div><div className="flex justify-between border-t border-[#f1e2e5] pt-3 text-sm"><span>Total</span><strong>Rp65.000</strong></div></div></aside></section>

    <section id="produk" className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-black uppercase tracking-[.18em] text-[#b05e73]">Katalog</p><h2 className="mt-2 text-3xl font-black text-[#2A1620]">Pilih aplikasi</h2></div><label className="flex h-12 w-full items-center gap-3 rounded-2xl border border-[#EBCBD2] bg-white px-4 md:w-80"><Search className="size-5 text-[#b57b88]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk..." className="w-full bg-transparent text-base outline-none" /></label></div><div className="mt-6 flex gap-2 overflow-x-auto pb-2">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold ${category === item ? "border-[#2A1620] bg-[#2A1620] text-white" : "border-[#EBCBD2] bg-white text-[#6c4653]"}`}>{item}</button>)}</div>
      {message && view === "store" && <p className="mt-5 rounded-xl bg-[#fff3d6] p-4 text-sm font-semibold text-[#8a5c00]">{message}</p>}
      {loading ? <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-[24px] border border-[#EBCBD2] bg-white" />)}</div> : filtered.length ? <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((product) => <article key={product.id} className="rounded-[24px] border border-[#EBCBD2] bg-white p-5 shadow-[0_8px_30px_rgba(87,38,57,.05)]"><ProductIcon product={product} /><p className="mt-5 text-xs font-black uppercase tracking-[.15em] text-[#b17684]">{product.category}</p><h3 className="mt-1 text-xl font-black text-[#2A1620]">{product.name}</h3><div className="mt-5 flex items-end justify-between border-t border-[#f1e2e5] pt-4"><div><p className="text-xs text-[#8b8f99]">Mulai dari</p><p className="text-lg font-black text-[#2A1620]">{rupiah(Math.min(...product.variants.map((variant) => variant.price)))}</p></div><Button onClick={() => openProduct(product)} className="rounded-xl bg-[#E9B8C2] text-[#2A1620] hover:bg-[#dda4b1]">Pilih Paket</Button></div></article>)}</div> : <div className="mt-7 rounded-3xl border border-dashed border-[#d8aeb8] bg-white p-12 text-center"><p className="font-bold text-[#2A1620]">Belum ada produk aktif.</p><p className="mt-1 text-sm text-[#6B7280]">Produk yang ditambahkan admin akan otomatis muncul di sini.</p></div>}
    </section>

    <section id="cara" className="border-y border-[#EBCBD2] bg-white py-12"><div className="mx-auto max-w-7xl px-5 lg:px-8"><h2 className="text-3xl font-black text-[#2A1620]">Cara Pembelian</h2><div className="mt-7 grid gap-4 md:grid-cols-3">{[[LayoutGrid, "Pilih paket", "Pilih aplikasi dan paket yang dibutuhkan."], [Play, "Bayar", "Isi data pembeli lalu selesaikan pembayaran."], [BadgeCheck, "Unduh invoice", "Setelah lunas, invoice siap dicetak atau diunduh."]].map(([Icon, title, copy], index) => { const I = Icon as typeof LayoutGrid; return <div key={String(title)} className="rounded-[22px] border border-[#EBCBD2] bg-[#FDF9FA] p-6"><div className="flex justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-[#F2D8DE]"><I className="size-5 text-[#914e60]" /></span><span className="font-black text-[#d39baa]">0{index + 1}</span></div><h3 className="mt-7 text-lg font-black text-[#2A1620]">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-[#6B7280]">{String(copy)}</p></div>; })}</div></div></section>
    <footer id="bantuan" className="bg-[#2A1620] text-white"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-9 md:flex-row md:items-center md:justify-between lg:px-8"><div><strong className="text-lg">Miztel Digital</strong><p className="mt-1 text-sm text-[#d8bdc5]">Produk digital dengan bukti pembelian yang jelas.</p></div><Button asChild className="rounded-xl bg-white text-[#2A1620] hover:bg-[#F2D8DE]"><a href={chatLink} target="_blank" rel="noreferrer"><Headphones /> Chat Penjual</a></Button></div></footer>

    <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-w-xl overflow-hidden rounded-[26px] border-[#EBCBD2] bg-white p-0">{selected && <><div className="bg-[#F2D8DE] p-6 pr-12"><DialogHeader><DialogTitle className="text-2xl font-black text-[#2A1620]">{selected.name}</DialogTitle><DialogDescription>Pilih satu paket untuk melanjutkan checkout.</DialogDescription></DialogHeader></div><div className="p-6"><RadioGroup value={String(variantId)} onValueChange={(value) => setVariantId(Number(value))}>{selected.variants.map((variant) => <label key={variant.id} htmlFor={`variant-${variant.id}`} className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 ${variantId === variant.id ? "border-[#bd7184] bg-[#FDF7F8] ring-2 ring-[#F2D8DE]" : "border-[#EBCBD2]"}`}><RadioGroupItem id={`variant-${variant.id}`} value={String(variant.id)} /><div className="flex flex-1 items-center justify-between"><strong className="text-[#2A1620]">{variant.variantName}</strong><strong className="text-[#2A1620]">{rupiah(variant.price)}</strong></div></label>)}</RadioGroup><Button onClick={() => { setSelected(selected); setView("checkout"); }} className="mt-6 h-12 w-full rounded-xl bg-[#2A1620] text-white">Lanjut Checkout <ArrowRight /></Button></div></>}</DialogContent></Dialog>
  </main>;
}

function MiniHeader({ label, onBack }: { label: string; onBack: () => void }) { return <header className="border-b border-[#EBCBD2] bg-white"><div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5"><button onClick={onBack} className="flex items-center gap-2 text-sm font-bold"><ArrowLeft className="size-4" /> Kembali</button><strong className="text-[#2A1620]">{label}</strong><span className="w-16" /></div></header>; }
function Field({ label, value, setValue, required = true, type = "text" }: { label: string; value: string; setValue: (value: string) => void; required?: boolean; type?: string }) { return <label className="block"><span className="mb-2 block text-sm font-bold text-[#2A1620]">{label}{!required && <em className="ml-2 font-normal not-italic text-[#8b8f99]">Opsional</em>}</span><input required={required} type={type} value={value} onChange={(event) => setValue(event.target.value)} className="h-12 w-full rounded-xl border border-[#EBCBD2] bg-white px-4 outline-none focus:border-[#bd7184] focus:ring-4 focus:ring-[#F2D8DE]" /></label>; }

function Checkout({ product, variant, values, setters, onBack, onSubmit, message, submitting }: { product: Product; variant: Variant; values: { buyerName: string; buyerWhatsapp: string; buyerEmail: string; needsInvoice: boolean; invoiceName: string; companyName: string }; setters: { setBuyerName: (v: string) => void; setBuyerWhatsapp: (v: string) => void; setBuyerEmail: (v: string) => void; setNeedsInvoice: (v: boolean) => void; setInvoiceName: (v: string) => void; setCompanyName: (v: string) => void }; onBack: () => void; onSubmit: () => void; message: string; submitting: boolean }) {
  return <main className="min-h-screen bg-[#F8F0F1]"><MiniHeader label="Checkout" onBack={onBack} /><div className="mx-auto grid max-w-6xl gap-6 px-5 py-9 lg:grid-cols-[1fr_360px]"><form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} className="rounded-[26px] border border-[#EBCBD2] bg-white p-6 sm:p-8"><h1 className="text-3xl font-black text-[#2A1620]">Data pembeli</h1><div className="mt-7 grid gap-5 sm:grid-cols-2"><Field label="Nama pembeli" value={values.buyerName} setValue={setters.setBuyerName} /><Field label="Nomor WhatsApp" value={values.buyerWhatsapp} setValue={setters.setBuyerWhatsapp} /><Field label="Email" value={values.buyerEmail} setValue={setters.setBuyerEmail} required={false} type="email" /></div><label className="mt-6 flex cursor-pointer gap-3 rounded-2xl border border-[#EBCBD2] bg-[#FDF8F9] p-4"><Checkbox checked={values.needsInvoice} onCheckedChange={(value) => setters.setNeedsInvoice(value === true)} className="mt-1" /><span><strong className="block text-sm text-[#2A1620]">Butuh invoice untuk reimbursement</strong><small className="text-[#6B7280]">Tambahkan identitas resmi pada invoice.</small></span></label>{values.needsInvoice && <div className="mt-5 grid gap-5 rounded-2xl border border-dashed border-[#d8aeb8] p-5 sm:grid-cols-2"><Field label="Nama pada invoice" value={values.invoiceName} setValue={setters.setInvoiceName} required={false} /><Field label="Instansi / perusahaan" value={values.companyName} setValue={setters.setCompanyName} required={false} /></div>}{message && <p className="mt-5 rounded-xl bg-[#fee2e2] p-3 text-sm font-semibold text-[#b91c1c]">{message}</p>}<Button disabled={submitting} type="submit" className="mt-7 h-12 rounded-xl bg-[#2A1620] px-7 text-white">{submitting ? "Membuat order..." : "Lanjut Pembayaran"} <ArrowRight /></Button></form><aside className="h-fit rounded-[24px] border border-[#EBCBD2] bg-white p-6"><h2 className="font-black text-[#2A1620]">Ringkasan</h2><div className="mt-5 flex gap-3"><ProductIcon product={product} size="small" /><div><strong className="text-[#2A1620]">{product.name}</strong><p className="text-sm text-[#6B7280]">{variant.variantName}</p></div></div><div className="mt-5 space-y-3 border-t border-[#EBCBD2] pt-5 text-sm"><div className="flex justify-between"><span>Subtotal</span><strong>{rupiah(variant.price)}</strong></div><div className="flex justify-between"><span>Biaya pembayaran</span><strong>{rupiah(1500)}</strong></div><div className="flex justify-between border-t border-[#EBCBD2] pt-4 text-lg"><strong>Total</strong><strong>{rupiah(variant.price + 1500)}</strong></div></div></aside></div></main>;
}

function Payment({ product, variant, order, paymentUrl, whatsapp, buyerWhatsapp, onBack, onCheck, message, submitting }: { product: Product; variant: Variant; order: Order; paymentUrl: string; whatsapp: string; buyerWhatsapp: string; onBack: () => void; onCheck: () => void; message: string; submitting: boolean }) {
  const manualLink = whatsappUrl(whatsapp, `Halo Miztel Digital, saya ingin konfirmasi order ${order.orderNumber} atas nama ${buyerWhatsapp}.`);
  return <main className="min-h-screen bg-[#F8F0F1]"><MiniHeader label="Pembayaran" onBack={onBack} /><div className="mx-auto max-w-2xl px-5 py-10"><div className="rounded-[28px] border border-[#EBCBD2] bg-white p-7 text-center"><span className="inline-flex items-center gap-2 rounded-full bg-[#fff3d6] px-4 py-2 text-sm font-black text-[#a66600]"><Clock3 className="size-4" /> Menunggu pembayaran</span><h1 className="mt-5 text-3xl font-black text-[#2A1620]">Selesaikan pembayaran</h1><div className="mx-auto mt-6 grid size-44 place-items-center rounded-[22px] border-2 border-[#2A1620] bg-[#F8F0F1] shadow-[7px_7px_0_#E9B8C2]"><QrCode className="size-28 text-[#2A1620]" /></div><div className="mx-auto mt-6 max-w-md rounded-2xl bg-[#FDF8F9] p-5 text-left"><p className="flex justify-between text-sm"><span>Order</span><strong>{order.orderNumber}</strong></p><p className="mt-2 flex justify-between text-sm"><span>{product.name} · {variant.variantName}</span><strong>{rupiah(order.total)}</strong></p></div>{paymentUrl ? <Button asChild className="mt-6 h-12 rounded-xl bg-[#2A1620] px-7"><a href={paymentUrl} target="_blank" rel="noreferrer">Buka Pembayaran QRIS <ArrowRight /></a></Button> : <Button asChild className="mt-6 h-12 rounded-xl bg-[#16A34A] px-7"><a href={manualLink} target="_blank" rel="noreferrer"><MessageCircle /> Konfirmasi Manual</a></Button>}<div><Button disabled={submitting} onClick={onCheck} variant="outline" className="mt-3 rounded-xl border-[#EBCBD2]">{submitting ? "Memeriksa..." : "Saya sudah bayar — cek status"}</Button></div>{message && <p className="mt-4 text-sm font-semibold text-[#9a6672]">{message}</p>}</div></div></main>;
}

function Invoice({ product, variant, order, settings, buyer, onBack }: { product: Product; variant: Variant; order: Order; settings: Settings; buyer: { buyerName: string; buyerWhatsapp: string; invoiceName: string; companyName: string }; onBack: () => void }) {
  const sendLink = whatsappUrl(settings.whatsappNumber, `Halo Miztel Digital, mohon kirim invoice ${order.invoiceNumber}.`);
  return <main className="min-h-screen bg-[#F8F0F1] print:bg-white"><div className="print:hidden"><MiniHeader label="Invoice" onBack={onBack} /></div><div className="mx-auto max-w-4xl px-4 py-8 print:p-0"><div className="mb-5 flex flex-wrap justify-end gap-2 print:hidden"><Button variant="outline" onClick={() => window.print()} className="border-[#EBCBD2]"><Download /> Download PDF</Button><Button variant="outline" onClick={() => window.print()} className="border-[#EBCBD2]"><Printer /> Print</Button><Button asChild className="bg-[#16A34A]"><a href={sendLink} target="_blank" rel="noreferrer"><MessageCircle /> Kirim ke WhatsApp</a></Button></div><article className="invoice-sheet overflow-hidden rounded-[20px] border border-[#EBCBD2] bg-white print:border-0"><div className="h-3 bg-[#E9B8C2]" /><div className="p-7 sm:p-10"><div className="flex justify-between gap-5 border-b border-[#EBCBD2] pb-7"><div><h1 className="text-xl font-black text-[#2A1620]">Miztel Digital</h1><p className="mt-1 text-sm text-[#6B7280]">{settings.storeEmail || settings.storePhone}</p></div><div className="text-right"><p className="text-xs font-black uppercase tracking-wider text-[#b05e73]">Invoice</p><p className="mt-1 font-black text-[#2A1620]">{order.invoiceNumber}</p><span className="mt-2 inline-flex rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-black text-[#15803d]">LUNAS</span></div></div><div className="grid gap-6 border-b border-[#EBCBD2] py-7 sm:grid-cols-2"><div><p className="text-xs font-black uppercase text-[#9c6875]">Ditagihkan kepada</p><p className="mt-2 font-black">{buyer.invoiceName}</p><p className="text-sm text-[#6B7280]">{buyer.companyName}</p><p className="text-sm text-[#6B7280]">{buyer.buyerWhatsapp}</p></div><div className="sm:text-right"><p className="text-xs font-black uppercase text-[#9c6875]">Detail transaksi</p><p className="mt-2 text-sm">Order: <strong>{order.orderNumber}</strong></p><p className="text-sm">Metode: <strong>QRIS / Manual</strong></p></div></div><Table className="mt-6"><TableHeader><TableRow className="bg-[#F8F0F1]"><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Harga</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell><strong>{product.name}</strong><span className="block text-sm text-[#6B7280]">{variant.variantName}</span></TableCell><TableCell>1</TableCell><TableCell className="text-right">{rupiah(variant.price)}</TableCell></TableRow></TableBody></Table><div className="ml-auto mt-6 max-w-sm space-y-2 text-sm"><p className="flex justify-between"><span>Subtotal</span><span>{rupiah(order.subtotal)}</span></p><p className="flex justify-between"><span>Biaya admin</span><span>{rupiah(order.paymentFee)}</span></p><p className="flex justify-between border-t border-[#EBCBD2] pt-3 text-lg font-black"><span>Total</span><span>{rupiah(order.total)}</span></p></div><p className="mt-9 flex items-center gap-2 rounded-2xl bg-[#F8F0F1] p-4 text-sm text-[#6B7280]"><BadgeCheck className="size-5 text-[#b05e73]" /> {settings.invoiceNote || "Dokumen ini merupakan bukti pembelian yang sah"}</p></div></article></div></main>;
}
