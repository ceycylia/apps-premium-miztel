"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- Native home links work reliably in the current vinext runtime. */

import { useEffect, useState } from "react";
import { BarChart3, BadgeCheck, FileText, Images, KeyRound, LockKeyhole, LogOut, MessageCircle, Package, Pencil, Plus, Printer, ReceiptText, RefreshCw, Save, Settings, ShoppingBag, Trash2, User, WalletCards, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseJson } from "@/lib/client-json";
import { normalizeGoogleDriveImageUrl } from "@/lib/product-image";
import { OtherShopDialog, OtherShopPanel } from "./other-shop-admin";

type Admin = { id: number; name: string; email: string };
type Variant = { id?: number; variantName: string; price: number };
type Product = { id: number; name: string; category: string; description: string; imageUrl: string | null; isActive: boolean; variants: Variant[] };
type OtherShopItem = { id: number; title: string; imageUrl: string; isActive: boolean };
type OrderItem = { productNameSnapshot: string; variantNameSnapshot: string; quantity: number; subtotal: number };
type Order = { id: number; orderNumber: string; invoiceNumber: string; buyerName: string; buyerWhatsapp: string; companyName?: string | null; subtotal: number; costAmount: number; paymentFee: number; total: number; paymentMethod: string; paymentStatus: string; orderStatus: string; paidAt?: string | null; createdAt: string; items: OrderItem[] };
type StoreSettings = { whatsappNumber: string; whatsappChannelUrl: string; storePhone: string; storeEmail: string; storeAddress: string; qrisImageUrl?: string | null; qrisAccountName?: string | null; paymentInstruction: string; invoiceNote: string };
type Tab = "dashboard" | "orders" | "products" | "otherShop" | "invoices" | "settings" | "profile";

const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const inputClass = "h-11 w-full rounded-xl border border-[#EBCBD2] bg-white px-4 outline-none focus:border-[#bd7184] focus:ring-4 focus:ring-[#F2D8DE]";

function isGoogleDriveImageUrl(value: string | null | undefined) {
  return Boolean(value && normalizeGoogleDriveImageUrl(value).url);
}

function ProductThumbnail({ imageUrl, name, className, fallbackClassName }: { imageUrl?: string | null; name: string; className: string; fallbackClassName?: string }) {
  const [failed, setFailed] = useState(false);
  if (!imageUrl || failed) return <span aria-label={`Gambar ${name} tidak tersedia`} className={fallbackClassName ?? `${className} grid place-items-center bg-[#2A1620] text-sm font-black text-white`}>{name.slice(0, 1).toUpperCase() || "?"}</span>;
  return <img src={imageUrl} alt={`Icon ${name}`} className={className} onError={() => setFailed(true)} />;
}

async function requestJson<T = Record<string, never>>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const data = await parseJson<T>(response);
  if (!response.ok) throw new Error(data.error ?? "Permintaan gagal");
  return data;
}

export default function AdminClient() {
  const [checking, setChecking] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [statusError, setStatusError] = useState("");

  async function refreshStatus() {
    setChecking(true);
    setStatusError("");
    try { const data = await requestJson<{ needsSetup: boolean; admin: Admin | null }>("/api/admin/auth/status"); setNeedsSetup(data.needsSetup); setAdmin(data.admin ?? null); }
    catch (error) { setStatusError(error instanceof Error ? error.message : "Database Admin tidak tersedia"); }
    finally { setChecking(false); }
  }
  useEffect(() => { void refreshStatus(); }, []);
  if (checking) return <div className="grid min-h-screen place-items-center bg-[#F8F0F1]"><RefreshCw className="size-7 animate-spin text-[#a45d70]" /></div>;
  if (statusError) return <main className="grid min-h-screen place-items-center bg-[#F8F0F1] p-4"><div className="w-full max-w-md rounded-[24px] border border-[#EBCBD2] bg-white p-6 text-center sm:p-8"><h1 className="text-2xl font-black text-[#2A1620]">Admin belum dapat dimuat</h1><p className="mt-3 break-words text-sm text-[#6B7280]">{statusError}</p><Button onClick={() => void refreshStatus()} className="mt-6 w-full rounded-xl bg-[#2A1620]"><RefreshCw /> Coba Lagi</Button></div></main>;
  if (!admin) return <AuthScreen needsSetup={needsSetup} onAuthenticated={(value) => setAdmin(value)} />;
  return <AdminDashboard admin={admin} onLogout={async () => { await fetch("/api/admin/auth/logout", { method: "POST" }); setAdmin(null); }} />;
}

function AuthScreen({ needsSetup, onAuthenticated }: { needsSetup: boolean; onAuthenticated: (admin: Admin) => void }) {
  const [mode, setMode] = useState<"login" | "setup" | "forgot">(needsSetup ? "setup" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const data = await requestJson<{ admin: Admin }>(mode === "setup" ? "/api/admin/auth/setup" : "/api/admin/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
      onAuthenticated(data.admin);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Gagal masuk"); }
    finally { setBusy(false); }
  }

  if (mode === "forgot") return <div className="min-h-screen bg-[#F8F0F1] p-5"><ForgotPassword initialEmail={email} onDone={() => setMode("login")} onCancel={() => setMode("login")} /></div>;
  return <main className="grid min-h-screen overflow-x-hidden bg-[#F8F0F1] lg:grid-cols-[.85fr_1.15fr]"><section className="hidden bg-[#2A1620] p-12 text-white lg:flex lg:flex-col lg:justify-between"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#E9B8C2] text-xl font-black text-[#2A1620]">M</span><strong className="text-xl">Miztel Digital</strong></div><div><span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">Portal Admin</span><h1 className="mt-6 max-w-lg text-5xl font-black leading-[1.08] tracking-[-.04em]">Kelola produk, pesanan, invoice, dan toko.</h1></div><a href="/" className="text-sm text-[#e8cbd2]">← Kembali ke toko</a></section><section className="flex items-center justify-center p-4 sm:p-5"><form onSubmit={submit} className="w-full max-w-md rounded-[28px] border border-[#EBCBD2] bg-white p-6 shadow-[0_18px_60px_rgba(87,38,57,.08)] sm:p-9"><span className="grid size-12 place-items-center rounded-2xl bg-[#F2D8DE]"><LockKeyhole className="size-5 text-[#8d5060]" /></span><h2 className="mt-6 text-3xl font-black text-[#2A1620]">{mode === "setup" ? "Buat admin pertama" : "Masuk sebagai admin"}</h2><p className="mt-2 text-[#6B7280]">{mode === "setup" ? "Data ini menjadi akun pengelola Miztel Digital." : "Masukkan email dan password admin."}</p><div className="mt-7 space-y-4">{mode === "setup" && <Field label="Nama admin" value={name} setValue={setName} />}<Field label="Email" value={email} setValue={setEmail} type="email" /><Field label="Password" value={password} setValue={setPassword} type="password" />{error && <p className="rounded-xl bg-[#fee2e2] p-3 text-sm font-semibold text-[#b91c1c]">{error}</p>}<Button disabled={busy} type="submit" className="h-12 w-full rounded-xl bg-[#2A1620] text-white">{busy ? "Memproses..." : mode === "setup" ? "Buat Admin" : "Masuk"}</Button>{mode === "login" && <button type="button" onClick={() => setMode("forgot")} className="w-full text-sm font-bold text-[#9a5265]">Lupa Password?</button>}</div></form></section></main>;
}

function ForgotPassword({ initialEmail = "", onDone, onCancel }: { initialEmail?: string; onDone: () => void; onCancel: () => void }) {
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [previewCode, setPreviewCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function send() { setBusy(true); setError(""); try { const data = await requestJson<{ previewCode?: string; message: string }>("/api/admin/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); setPreviewCode(data.previewCode ?? ""); setStep("code"); setMessage(data.message); } catch (reason) { setError(reason instanceof Error ? reason.message : "Gagal mengirim kode"); } finally { setBusy(false); } }
  async function verify() { setBusy(true); setError(""); try { await requestJson("/api/admin/auth/verify-reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) }); setStep("password"); } catch (reason) { setError(reason instanceof Error ? reason.message : "Kode tidak valid"); } finally { setBusy(false); } }
  async function reset() { setBusy(true); setError(""); try { await requestJson("/api/admin/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code, password }) }); onDone(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Reset gagal"); } finally { setBusy(false); } }
  return <div className="mx-auto mt-10 w-full max-w-md rounded-[28px] border border-[#EBCBD2] bg-white p-7 shadow-[0_18px_60px_rgba(87,38,57,.08)]"><h2 className="text-2xl font-black text-[#2A1620]">Reset password</h2><p className="mt-2 text-sm text-[#6B7280]">Kode berlaku 10 menit dan hanya dapat digunakan satu kali.</p>{step === "email" && <div className="mt-6 space-y-4"><Field label="Email admin" value={email} setValue={setEmail} type="email" /><Button disabled={busy} onClick={send} className="w-full bg-[#2A1620]">Kirim Kode</Button></div>}{step === "code" && <div className="mt-6"><p className="mb-3 text-sm text-[#6B7280]">{message}</p>{previewCode && <p className="mb-3 rounded-xl bg-[#fff3d6] p-3 text-sm font-bold text-[#8a5c00]">Preview lokal: {previewCode}</p>}<InputOTP maxLength={6} value={code} onChange={setCode} containerClassName="justify-center"><InputOTPGroup>{Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} className="h-12 w-11" />)}</InputOTPGroup></InputOTP><Button disabled={busy || code.length !== 6} onClick={verify} className="mt-5 w-full bg-[#2A1620]">Verifikasi Kode</Button></div>}{step === "password" && <div className="mt-6 space-y-4"><Field label="Password baru" value={password} setValue={setPassword} type="password" /><Button disabled={busy} onClick={reset} className="w-full bg-[#2A1620]">Simpan Password Baru</Button></div>}{error && <p className="mt-4 rounded-xl bg-[#fee2e2] p-3 text-sm font-semibold text-[#b91c1c]">{error}</p>}<button onClick={onCancel} className="mt-5 w-full text-sm font-bold text-[#9a5265]">Kembali</button></div>;
}

function Field({ label, value, setValue, type = "text" }: { label: string; value: string; setValue: (value: string) => void; type?: string }) { return <label className="block"><span className="mb-2 block text-sm font-bold text-[#2A1620]">{label}</span><input required type={type} value={value} onChange={(event) => setValue(event.target.value)} className={inputClass} /></label>; }

function AdminDashboard({ admin, onLogout }: { admin: Admin; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [otherShopItems, setOtherShopItems] = useState<OtherShopItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({ whatsappNumber: "", whatsappChannelUrl: "", storePhone: "", storeEmail: "", storeAddress: "", qrisImageUrl: null, qrisAccountName: "", paymentInstruction: "Scan QRIS di atas dan lakukan pembayaran sesuai total pesanan.", invoiceNote: "Dokumen ini merupakan bukti pembelian yang sah" });
  const [productDialog, setProductDialog] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [otherShopDialog, setOtherShopDialog] = useState(false);
  const [editingOtherShop, setEditingOtherShop] = useState<OtherShopItem | null>(null);
  const [invoice, setInvoice] = useState<Order | null>(null);
  const [profileReset, setProfileReset] = useState(false);
  const [notice, setNotice] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function loadAll() {
    const [productData, otherShopData, orderData, settingData] = await Promise.all([requestJson<{ products: Product[] }>("/api/admin/products"), requestJson<{ items: OtherShopItem[] }>("/api/admin/other-shop"), requestJson<{ orders: Order[] }>("/api/admin/orders"), requestJson<{ settings: StoreSettings }>("/api/admin/settings")]);
    setProducts(productData.products); setOtherShopItems(otherShopData.items); setOrders(orderData.orders); setSettings(settingData.settings);
  }
  async function loadOrders() {
    const orderData = await requestJson<{ orders: Order[] }>("/api/admin/orders");
    setOrders(orderData.orders);
  }
  useEffect(() => { const timer = window.setTimeout(() => { void loadAll().catch((error) => setNotice(error.message)); }, 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { const timer = window.setInterval(() => { void loadOrders().catch(() => undefined); }, 5_000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(""), 5_000); return () => window.clearTimeout(timer); }, [notice]);
  const revenue = orders.filter((order) => order.paymentStatus === "paid").reduce((total, order) => {
    const saleAmount = Number(order.subtotal);
    const costAmount = Number(order.costAmount ?? 0);
    return total + (Number.isFinite(saleAmount) ? saleAmount : 0) - (Number.isFinite(costAmount) ? costAmount : 0);
  }, 0);
  const today = new Date().toLocaleDateString("en-CA");
  const todayOrders = orders.filter((order) => new Date(order.createdAt).toLocaleDateString("en-CA") === today).length;
  const pendingOrders = orders.filter((order) => order.paymentStatus !== "paid" && order.orderStatus !== "dibatalkan").length;
  const paidOrders = orders.filter((order) => order.paymentStatus === "paid").length;
  const metrics = [
    [ShoppingBag, "Order hari ini", todayOrders],
    [WalletCards, "Pending", pendingOrders],
    [BadgeCheck, "Lunas", paidOrders],
    [BarChart3, "Pendapatan", rupiah(revenue)],
  ];
  const nav: [Tab, typeof BarChart3, string][] = [["dashboard", BarChart3, "Dashboard"], ["orders", ShoppingBag, "Pesanan"], ["products", Package, "Produk"], ["otherShop", Images, "Other Shop"], ["invoices", ReceiptText, "Invoice"], ["settings", Settings, "Pengaturan"], ["profile", User, "Profil Admin"]];

  return <main className="min-h-screen overflow-x-hidden bg-[#f9f4f5] text-[#22304A]">
    {mobileNavOpen && <button type="button" aria-label="Tutup menu" onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-40 bg-black/35 lg:hidden" />}
    <div className="grid min-h-screen min-w-0 lg:grid-cols-[245px_minmax(0,1fr)]">
      <aside className={`fixed inset-y-0 left-0 z-50 w-[245px] min-w-0 transform overflow-y-auto bg-[#2A1620] p-4 text-white transition-transform duration-200 lg:static lg:z-auto lg:w-auto lg:translate-x-0 lg:p-5 ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <button type="button" onClick={() => setMobileNavOpen(false)} aria-label="Sembunyikan menu" className="absolute right-3 top-3 grid size-9 place-items-center rounded-xl bg-white/10 text-2xl lg:hidden">‹</button>
        <div className="flex items-center gap-3 px-2 py-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#E9B8C2] font-black text-[#2A1620]">M</span><div className="min-w-0"><strong className="block truncate">Miztel Digital</strong><span className="text-xs text-[#cbb7bd]">Admin workspace</span></div></div>
        <nav className="mt-5 grid gap-2 text-sm font-bold lg:mt-8">{nav.map(([value, Icon, label]) => <button key={value} onClick={() => { setTab(value); setMobileNavOpen(false); }} className={`flex min-w-0 items-center gap-3 rounded-xl px-4 py-3 text-left ${tab === value ? "bg-white/10 text-white" : "text-[#cebcc1] hover:bg-white/5"}`}><Icon className="size-4 shrink-0" /><span className="min-w-0 break-words">{label}</span></button>)}</nav>
        <div className="mt-5 rounded-2xl bg-white/5 p-4 lg:mt-10"><p className="text-xs text-[#bdaab0]">Login sebagai</p><p className="mt-1 break-words text-sm font-bold">{admin.name}</p><button onClick={onLogout} className="mt-3 flex items-center gap-2 text-xs font-bold text-[#E9B8C2]"><LogOut className="size-3.5" /> Keluar</button></div>
      </aside>
      <div className="min-w-0">
        <header className="flex min-h-[72px] items-center justify-between gap-3 border-b border-[#EBCBD2] bg-white px-4 py-3 sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={() => setMobileNavOpen(true)} aria-label="Tampilkan menu" className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#EBCBD2] bg-white text-2xl text-[#8d5060] lg:hidden">›</button><div className="min-w-0"><p className="truncate text-xs font-bold uppercase tracking-wider text-[#a66a78]">Miztel Digital</p><h1 className="truncate text-xl font-black text-[#2A1620]">{nav.find(([value]) => value === tab)?.[2]}</h1></div></div>
          <Button asChild size="sm" variant="outline" className="shrink-0 rounded-xl border-[#EBCBD2] text-[#8d5060]"><a href="/" target="_blank" rel="noreferrer">Lihat toko →</a></Button>
        </header>
        <div className="min-w-0 p-4 sm:p-5 lg:p-8">{notice && <p className="mb-5 break-words rounded-xl bg-[#fff3d6] p-3 text-sm font-semibold text-[#8a5c00]">{notice}</p>}
          {tab === "dashboard" && <>
            <div className="sm:hidden"><div className="grid grid-cols-3 gap-2">{[["Order", todayOrders], ["Pending", pendingOrders], ["Lunas", paidOrders]].map(([label, value]) => <div key={String(label)} className="min-w-0 rounded-2xl border border-[#EBCBD2] bg-white px-2 py-3 text-center"><p className="truncate text-[11px] font-bold text-[#6B7280]">{String(label)}</p><p className="mt-1 text-lg font-black text-[#2A1620]">{String(value)}</p></div>)}</div><div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-[#EBCBD2] bg-white px-4 py-3"><span className="text-xs font-bold text-[#6B7280]">Keuntungan seluruh order</span><strong className="text-lg text-[#2A1620]">{rupiah(revenue)}</strong></div></div>
            <div className="hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([Icon, label, value]) => { const I = Icon as typeof ShoppingBag; return <div key={String(label)} className="min-w-0 rounded-[20px] border border-[#EBCBD2] bg-white p-5"><span className="grid size-10 place-items-center rounded-xl bg-[#F2D8DE]"><I className="size-4 text-[#8d5060]" /></span><p className="mt-5 text-sm text-[#6B7280]">{String(label)}</p><p className="mt-1 break-words text-2xl font-black text-[#2A1620]">{String(value)}</p></div>; })}</div>
            <OrdersTable orders={orders.slice(0, 5)} onUpdated={loadAll} onInvoice={setInvoice} />
          </>}
          {tab === "orders" && <OrdersTable orders={orders} onUpdated={loadAll} onInvoice={setInvoice} enableFilteringAndPagination />}
          {tab === "products" && <ProductsPanel products={products} onCreate={() => { setEditing(null); setProductDialog(true); }} onEdit={(product) => { setEditing(product); setProductDialog(true); }} onUpdated={loadAll} />}
          {tab === "otherShop" && <OtherShopPanel items={otherShopItems} onCreate={() => { setEditingOtherShop(null); setOtherShopDialog(true); }} onEdit={(item) => { setEditingOtherShop(item); setOtherShopDialog(true); }} onUpdated={loadAll} />}
          {tab === "invoices" && <InvoicesPanel orders={orders.filter((order) => order.paymentStatus === "paid")} onInvoice={setInvoice} />}
          {tab === "settings" && <SettingsPanel settings={settings} setSettings={setSettings} onSaved={() => { setNotice("Pengaturan berhasil disimpan."); void loadAll(); }} />}
          {tab === "profile" && <ProfilePanel admin={admin} onReset={() => setProfileReset(true)} onChanged={onLogout} />}
        </div>
      </div>
    </div>
    <ProductDialog key={productDialog ? (editing?.id ?? "new") : "closed"} open={productDialog} product={editing} onOpenChange={setProductDialog} onSaved={async () => { setProductDialog(false); await loadAll(); }} />
    <OtherShopDialog key={otherShopDialog ? (editingOtherShop?.id ?? "new") : "closed"} open={otherShopDialog} item={editingOtherShop} onOpenChange={setOtherShopDialog} onSaved={async () => { setOtherShopDialog(false); await loadAll(); }} />
    <InvoiceDialog order={invoice} onOpenChange={(open) => !open && setInvoice(null)} />
    <Dialog open={profileReset} onOpenChange={setProfileReset}><DialogContent className="max-w-lg rounded-[24px] border-[#EBCBD2] bg-[#F8F0F1] p-0"><ForgotPassword initialEmail={admin.email} onDone={onLogout} onCancel={() => setProfileReset(false)} /></DialogContent></Dialog>
  </main>;
}

function StatusPill({ value }: { value: string }) {
  const success = value === "paid" || value === "lunas" || value === "selesai";
  const warning = value === "pending" || value === "menunggu_pembayaran" || value === "menunggu_konfirmasi";
  const labels: Record<string, string> = {
    pending: "MENUNGGU PEMBAYARAN",
    menunggu_pembayaran: "MENUNGGU PEMBAYARAN",
    menunggu_konfirmasi: "MENUNGGU KONFIRMASI",
    paid: "LUNAS",
    lunas: "LUNAS",
    diproses: "DIPROSES",
    selesai: "SELESAI",
    dibatalkan: "DIBATALKAN",
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${success ? "bg-[#dcfce7] text-[#15803d]" : warning ? "bg-[#fff3d6] text-[#a66600]" : "bg-[#F2D8DE] text-[#8d5060]"}`}>{labels[value] ?? value.replaceAll("_", " ").toUpperCase()}</span>;
}

function OrdersTable({
  orders,
  onUpdated,
  onInvoice,
  enableFilteringAndPagination = false,
}: {
  orders: Order[];
  onUpdated: () => Promise<void>;
  onInvoice: (order: Order) => void;
  enableFilteringAndPagination?: boolean;
}) {
  const [confirming, setConfirming] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [costDrafts, setCostDrafts] = useState<Record<number, string>>({});
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const filteredOrders = dateFilter
    ? orders.filter((order) => new Date(order.createdAt).toLocaleDateString("en-CA") === dateFilter)
    : orders;
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const visibleOrders = enableFilteringAndPagination
    ? filteredOrders.slice((page - 1) * pageSize, page * pageSize)
    : filteredOrders;

  useEffect(() => { setPage(1); }, [dateFilter]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  async function update(order: Order, payload: object) {
    setBusy(true);
    setError("");

    try {
      await requestJson(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      await onUpdated();
      return true;
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Status gagal diperbarui"
      );

      return false;
    } finally {
      setBusy(false);
    }
  }

  async function confirmPayment() {
    if (!confirming) return;

    if (await update(confirming, { confirmPayment: true })) {
      setConfirming(null);
    }
  }

  async function saveCost(order: Order) {
    const value = Number(
      costDrafts[order.id] ?? order.costAmount ?? 0
    );

    if (!Number.isInteger(value) || value < 0) {
      setError("Modal harus berupa angka nol atau lebih.");
      return;
    }

    if (await update(order, { costAmount: value })) {
      setCostDrafts((current) => {
        const next = { ...current };
        delete next[order.id];
        return next;
      });
    }
  }

  async function deleteOrder() {
    if (!deleting) return;

    setBusy(true);
    setError("");

    try {
      await requestJson(`/api/admin/orders/${deleting.id}`, {
        method: "DELETE",
      });

      setDeleting(null);
      await onUpdated();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Order gagal dihapus"
      );
    } finally {
      setBusy(false);
    }
  }

  function whatsappUrl(order: Order) {
    const phone = order.buyerWhatsapp
      .replace(/\D/g, "")
      .replace(/^0/, "62");

    const message = encodeURIComponent(
      `Halo ${order.buyerName}, terkait order ${order.orderNumber}`
    );

    return `https://wa.me/${phone}?text=${message}`;
  }

  return (
    <>
      <div className="mt-6 overflow-hidden rounded-[22px] border border-[#EBCBD2] bg-white">
        <div className="border-b border-[#EBCBD2] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="font-black text-[#2A1620]">Pesanan</h2><p className="mt-1 text-sm text-[#6B7280]">Konfirmasi pembayaran, buka invoice, atau hapus data pesanan testing.</p></div>
            {enableFilteringAndPagination && <label className="block w-full sm:w-auto"><span className="mb-1 block text-xs font-bold text-[#6B7280]">Filter tanggal</span><div className="flex gap-2"><input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="h-10 min-w-0 flex-1 rounded-xl border border-[#EBCBD2] bg-white px-3 text-sm outline-none focus:border-[#bd7184] sm:w-44" />{dateFilter && <Button type="button" size="sm" variant="outline" onClick={() => setDateFilter("")} className="h-10 border-[#EBCBD2]">Semua</Button>}</div></label>}
          </div>

          {error && (
            <p className="mt-3 break-words rounded-xl bg-[#fee2e2] p-3 text-sm font-semibold text-[#b91c1c]">
              {error}
            </p>
          )}
        </div>

        {visibleOrders.length ? (
          <>
            {/* =========================
                MOBILE
            ========================== */}
            <div className="space-y-4 p-4 md:hidden">
              {visibleOrders.map((order) => (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-[20px] border border-[#EBCBD2] bg-white"
                >
                  {/* Header Card */}
                  <div className="border-b border-[#F1DDE2] bg-[#FDF8F9] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-all text-sm font-black text-[#2A1620]">
                          {order.orderNumber}
                        </p>

                        <p className="mt-1 text-xs text-[#7C7F87]">
                          {new Date(order.createdAt).toLocaleString(
                            "id-ID"
                          )}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <StatusPill
                          value={
                            order.paymentStatus === "paid"
                              ? "lunas"
                              : order.orderStatus
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className="space-y-5 p-4">
                    {/* Pembeli */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#A66A78]">
                        Pembeli
                      </p>

                      <p className="mt-1 break-words font-bold text-[#2A1620]">
                        {order.buyerName}
                      </p>

                      <p className="mt-0.5 break-all text-sm text-[#6B7280]">
                        {order.buyerWhatsapp}
                      </p>
                    </div>

                    {/* Produk */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#A66A78]">
                        Produk
                      </p>

                      <div className="mt-2 space-y-2">
                        {order.items.length ? (
                          order.items.map((item, index) => (
                            <div
                              key={index}
                              className="rounded-xl bg-[#FDF8F9] p-3"
                            >
                              <p className="break-words text-sm font-bold text-[#2A1620]">
                                {item.productNameSnapshot}
                              </p>

                              <p className="mt-1 break-words text-xs text-[#6B7280]">
                                {item.variantNameSnapshot}
                              </p>

                              <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                                <span className="text-[#6B7280]">
                                  Qty {item.quantity}
                                </span>

                                <strong className="text-[#2A1620]">
                                  {rupiah(item.subtotal)}
                                </strong>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-[#6B7280]">
                            -
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between gap-4 border-t border-[#F1DDE2] pt-4">
                      <span className="text-sm text-[#6B7280]">
                        Total
                      </span>

                      <strong className="text-lg text-[#2A1620]">
                        {rupiah(order.subtotal)}
                      </strong>
                    </div>

                    {/* Modal */}
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#A66A78]">
                        Modal
                      </p>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          aria-label={`Modal order ${order.orderNumber}`}
                          value={
                            costDrafts[order.id] ??
                            String(order.costAmount ?? 0)
                          }
                          onChange={(event) =>
                            setCostDrafts((current) => ({
                              ...current,
                              [order.id]: event.target.value,
                            }))
                          }
                          className="h-11 min-w-0 flex-1 rounded-xl border border-[#EBCBD2] bg-white px-3 text-sm outline-none focus:border-[#bd7184] focus:ring-2 focus:ring-[#F2D8DE]"
                        />

                        <Button
                          disabled={busy}
                          variant="outline"
                          onClick={() => void saveCost(order)}
                          className="h-11 shrink-0 border-[#EBCBD2] px-4"
                        >
                          <Save className="size-4" />
                          Simpan
                        </Button>
                      </div>
                    </div>

                    {/* Aksi */}
                    <div className="grid gap-2 border-t border-[#F1DDE2] pt-4">
                      {order.paymentStatus !== "paid" && (
                        <Button
                          disabled={busy}
                          onClick={() => {
                            setError("");
                            setConfirming(order);
                          }}
                          className="h-11 w-full rounded-xl bg-[#16A34A] text-white hover:bg-[#15803d]"
                        >
                          <BadgeCheck className="size-4" />
                          Konfirmasi Pembayaran
                        </Button>
                      )}

                      {order.paymentStatus === "paid" && (
                        <Button
                          variant="outline"
                          onClick={() => onInvoice(order)}
                          className="h-11 w-full rounded-xl border-[#EBCBD2]"
                        >
                          <FileText className="size-4" />
                          Lihat Invoice
                        </Button>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          asChild
                          variant="outline"
                          className="h-11 rounded-xl border-[#EBCBD2]"
                        >
                          <a
                            href={whatsappUrl(order)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <MessageCircle className="size-4" />
                            WhatsApp
                          </a>
                        </Button>

                        <Button
                          disabled={busy}
                          variant="outline"
                          onClick={() => {
                            setError("");
                            setDeleting(order);
                          }}
                          className="h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="size-4" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* =========================
                DESKTOP
            ========================== */}
            <div className="hidden max-w-full overflow-x-auto md:block">
              <Table className="min-w-[1180px]">
                <TableHeader>
                  <TableRow className="bg-[#FDF8F9]">
                    <TableHead className="px-5">
                      Order
                    </TableHead>

                    <TableHead>
                      Pembeli
                    </TableHead>

                    <TableHead>
                      Produk
                    </TableHead>

                    <TableHead>
                      Total
                    </TableHead>

                    <TableHead>
                      Modal
                    </TableHead>

                    <TableHead>
                      Tanggal
                    </TableHead>

                    <TableHead>
                      Pembayaran
                    </TableHead>

                    <TableHead className="px-5 text-right">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {visibleOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="px-5 font-bold">
                        {order.orderNumber}
                      </TableCell>

                      <TableCell>
                        <strong>
                          {order.buyerName}
                        </strong>

                        <span className="block text-xs text-[#6B7280]">
                          {order.buyerWhatsapp}
                        </span>
                      </TableCell>

                      <TableCell className="min-w-52">
                        <span className="line-clamp-2 text-sm">
                          {order.items
                            .map(
                              (item) =>
                                `${item.productNameSnapshot} - ${item.variantNameSnapshot} × ${item.quantity}`
                            )
                            .join(", ") || "-"}
                        </span>
                      </TableCell>

                      <TableCell className="font-bold">
                        {rupiah(order.subtotal)}
                      </TableCell>

                      <TableCell>
                        <div className="flex min-w-[180px] items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            aria-label={`Modal order ${order.orderNumber}`}
                            value={
                              costDrafts[order.id] ??
                              String(order.costAmount ?? 0)
                            }
                            onChange={(event) =>
                              setCostDrafts((current) => ({
                                ...current,
                                [order.id]: event.target.value,
                              }))
                            }
                            className="h-9 w-28 rounded-lg border border-[#EBCBD2] bg-white px-3 text-sm outline-none focus:border-[#bd7184] focus:ring-2 focus:ring-[#F2D8DE]"
                          />

                          <Button
                            disabled={busy}
                            size="icon-sm"
                            variant="outline"
                            onClick={() => void saveCost(order)}
                            className="border-[#EBCBD2]"
                            aria-label={`Simpan modal order ${order.orderNumber}`}
                          >
                            <Save />
                          </Button>
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(
                          order.createdAt
                        ).toLocaleString("id-ID")}
                      </TableCell>

                      <TableCell>
                        <StatusPill
                          value={
                            order.paymentStatus === "paid"
                              ? "lunas"
                              : order.orderStatus
                          }
                        />
                      </TableCell>

                      <TableCell className="px-5 text-right">
                        <div className="flex min-w-max justify-end gap-2">
                          {order.paymentStatus !== "paid" && (
                            <Button
                              disabled={busy}
                              size="sm"
                              onClick={() => {
                                setError("");
                                setConfirming(order);
                              }}
                              className="bg-[#16A34A]"
                            >
                              Konfirmasi Pembayaran
                            </Button>
                          )}

                          {order.paymentStatus === "paid" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                onInvoice(order)
                              }
                              className="border-[#EBCBD2]"
                            >
                              Invoice
                            </Button>
                          )}

                          <Button
                            asChild
                            size="icon-sm"
                            variant="outline"
                            className="border-[#EBCBD2]"
                          >
                            <a
                              href={whatsappUrl(order)}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`WhatsApp ${order.buyerName}`}
                            >
                              <MessageCircle />
                            </a>
                          </Button>

                          <Button
                            disabled={busy}
                            size="icon-sm"
                            variant="outline"
                            onClick={() => {
                              setError("");
                              setDeleting(order);
                            }}
                            className="border-red-200 text-red-600"
                            aria-label={`Hapus order ${order.orderNumber}`}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <p className="p-10 text-center text-[#6B7280]">
            {dateFilter ? "Tidak ada pesanan pada tanggal tersebut." : "Belum ada pesanan."}
          </p>
        )}
        {enableFilteringAndPagination && filteredOrders.length > 0 && <div className="flex flex-col gap-3 border-t border-[#EBCBD2] px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"><span className="text-center text-[#6B7280]">Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredOrders.length)} dari {filteredOrders.length} pesanan</span><div className="flex items-center justify-center gap-2"><Button type="button" size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="border-[#EBCBD2]">Sebelumnya</Button><span className="min-w-16 text-center font-bold text-[#2A1620]">{page} / {totalPages}</span><Button type="button" size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="border-[#EBCBD2]">Berikutnya</Button></div></div>}
      </div>

      {/* =========================
          DIALOG KONFIRMASI
      ========================== */}
      <Dialog
        open={!!confirming}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setConfirming(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[24px] border-[#EBCBD2] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#2A1620]">
              Konfirmasi Pembayaran
            </DialogTitle>

            <DialogDescription>
              Pastikan pembayaran sudah benar-benar masuk sebelum
              mengonfirmasi.
            </DialogDescription>
          </DialogHeader>

          {confirming && (
            <div className="mt-3 rounded-2xl bg-[#FDF8F9] p-4 text-sm">
              <p className="flex justify-between gap-4">
                <span>
                  Order
                </span>

                <strong className="break-all text-right">
                  {confirming.orderNumber}
                </strong>
              </p>

              <p className="mt-2 flex justify-between gap-4">
                <span>
                  Total
                </span>

                <strong>
                  {rupiah(confirming.subtotal)}
                </strong>
              </p>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button
              disabled={busy}
              variant="outline"
              onClick={() =>
                setConfirming(null)
              }
              className="border-[#EBCBD2]"
            >
              Batal
            </Button>

            <Button
              disabled={busy}
              onClick={() =>
                void confirmPayment()
              }
              className="bg-[#16A34A]"
            >
              {busy
                ? "Mengonfirmasi..."
                : "Ya, Konfirmasi"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================
          DIALOG HAPUS
      ========================== */}
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setDeleting(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[24px] border-[#EBCBD2] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#2A1620]">
              Yakin ingin menghapus?
            </DialogTitle>

            <DialogDescription>
              Data pesanan dan item terkait akan dihapus permanen
              dari daftar Admin.
            </DialogDescription>
          </DialogHeader>

          {deleting && (
            <div className="mt-3 rounded-2xl bg-[#FDF8F9] p-4 text-sm">
              <p className="flex justify-between gap-4">
                <span>
                  Order
                </span>

                <strong className="break-all text-right">
                  {deleting.orderNumber}
                </strong>
              </p>

              <p className="mt-2 flex justify-between gap-4">
                <span>
                  Pembeli
                </span>

                <strong className="break-words text-right">
                  {deleting.buyerName}
                </strong>
              </p>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button
              disabled={busy}
              variant="outline"
              onClick={() =>
                setDeleting(null)
              }
              className="border-[#EBCBD2]"
            >
              Batal
            </Button>

            <Button
              disabled={busy}
              onClick={() =>
                void deleteOrder()
              }
              variant="destructive"
            >
              {busy ? "Menghapus..." : "Ya, Hapus Pesanan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProductsPanel({ products, onCreate, onEdit, onUpdated }: { products: Product[]; onCreate: () => void; onEdit: (product: Product) => void; onUpdated: () => Promise<void> }) {
  async function toggle(product: Product) {
    await requestJson(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, isActive: !product.isActive, variants: product.variants.map((variant) => ({ name: variant.variantName, price: variant.price })) }),
    });
    await onUpdated();
  }

  async function remove(product: Product) {
    if (!window.confirm(`Hapus ${product.name}? Produk yang sudah memiliki transaksi akan diarsipkan.`)) return;
    await requestJson(`/api/admin/products/${product.id}`, { method: "DELETE" });
    await onUpdated();
  }

  return <section className="min-w-0">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-2xl font-black text-[#2A1620]">Produk</h2><p className="text-sm text-[#6B7280]">Produk aktif otomatis tampil di halaman pembeli.</p></div>
      <Button onClick={onCreate} className="w-full rounded-xl bg-[#2A1620] sm:w-auto"><Plus /> Tambah Produk</Button>
    </div>
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => <article key={product.id} className="min-w-0 rounded-[20px] border border-[#EBCBD2] bg-white p-5">
        <div className="flex items-start gap-3">
          <ProductThumbnail imageUrl={product.imageUrl} name={product.name} className="size-12 shrink-0 rounded-xl object-cover ring-1 ring-[#EBCBD2]" fallbackClassName="grid size-12 shrink-0 place-items-center rounded-xl bg-[#2A1620] font-black text-white" />
          <div className="min-w-0 flex-1"><div className="flex min-w-0 items-center justify-between gap-2"><strong className="truncate text-[#2A1620]">{product.name}</strong><StatusPill value={product.isActive ? "aktif" : "nonaktif"} /></div><p className="text-sm text-[#6B7280]">{product.category}</p></div>
        </div>
        <div className="mt-5 space-y-2 border-t border-[#f0dce1] pt-4">{product.variants.map((variant) => <div key={`${product.id}-${variant.id}`} className="flex justify-between gap-3 text-sm"><span className="min-w-0 break-words">{variant.variantName}</span><strong className="shrink-0">{rupiah(variant.price)}</strong></div>)}</div>
        <div className="mt-5 grid gap-2 min-[390px]:grid-cols-2"><Button size="sm" variant="outline" onClick={() => onEdit(product)} className="border-[#EBCBD2]"><Pencil /> Edit</Button><Button size="sm" variant="outline" onClick={() => void toggle(product)} className="border-[#EBCBD2]">{product.isActive ? "Nonaktifkan" : "Aktifkan"}</Button><Button size="sm" variant="outline" onClick={() => void remove(product)} className="border-red-200 text-red-600 min-[390px]:col-span-2"><Trash2 /> Hapus</Button></div>
      </article>)}
    </div>
    {!products.length && <p className="mt-6 rounded-2xl border border-dashed border-[#EBCBD2] bg-white p-8 text-center text-[#6B7280] sm:p-10">Belum ada produk. Klik “Tambah Produk”.</p>}
  </section>;
}

function ProductDialog({ open, product, onOpenChange, onSaved }: { open: boolean; product: Product | null; onOpenChange: (open: boolean) => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "Music Apps");
  const [description, setDescription] = useState(product?.description ?? "");
  const [driveLink, setDriveLink] = useState(() => isGoogleDriveImageUrl(product?.imageUrl) ? product!.imageUrl! : "");
  const [variants, setVariants] = useState<{ name: string; price: string }[]>(() => product?.variants.length ? product.variants.map((variant) => ({ name: variant.variantName, price: String(variant.price) })) : [{ name: "", price: "" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const driveImage = normalizeGoogleDriveImageUrl(driveLink);

  function updateDriveLink(value: string) {
    setDriveLink(value);
    setError("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (driveLink.trim() && driveImage.error) {
      setError(driveImage.error);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const endpoint = product ? "/api/admin/products/" + product.id : "/api/admin/products";
      const payload = { name, category, description, imageUrl: driveImage.url, isActive: product?.isActive ?? true, variants: variants.map((variant) => ({ name: variant.name, price: Number(variant.price) })) };
      await requestJson(endpoint, { method: product ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      await onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Produk gagal disimpan");
    } finally {
      setBusy(false);
    }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-[24px] border-[#EBCBD2] bg-white">
      <DialogHeader>
        <DialogTitle className="break-words pr-6 text-2xl font-black text-[#2A1620]">{product ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
        <DialogDescription>Isi detail aplikasi dan satu atau lebih paket.</DialogDescription>
      </DialogHeader>
      <form onSubmit={save} className="mt-3 min-w-0 space-y-5">
        <label className="block"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Link gambar Google Drive</span><input required type="url" value={driveLink} onChange={(event) => updateDriveLink(event.target.value)} placeholder="https://drive.google.com/file/d/FILE_ID/view" className={inputClass} /></label>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Nama aplikasi" value={name} setValue={setName} /><label><span className="mb-2 block text-sm font-bold text-[#2A1620]">Kategori</span><NativeSelect value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 min-w-full rounded-xl border-[#EBCBD2]"><NativeSelectOption value="Music Apps">Music Apps</NativeSelectOption><NativeSelectOption value="Editing Apps">Editing Apps</NativeSelectOption><NativeSelectOption value="Streaming Apps">Streaming Apps</NativeSelectOption><NativeSelectOption value="Other Apps">Other Apps</NativeSelectOption></NativeSelect></label></div>
        <label className="block"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Deskripsi singkat</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-24 w-full rounded-xl border border-[#EBCBD2] p-4 outline-none focus:ring-4 focus:ring-[#F2D8DE]" /></label>
        <div><div className="flex flex-col gap-3 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between"><span className="text-sm font-bold text-[#2A1620]">Paket / varian</span><Button type="button" size="sm" variant="outline" onClick={() => setVariants([...variants, { name: "", price: "" }])} className="w-full border-[#EBCBD2] min-[390px]:w-auto"><Plus /> Tambah Paket</Button></div><div className="mt-3 space-y-3">{variants.map((variant, index) => <div key={index} className="grid gap-2 rounded-2xl bg-[#FDF8F9] p-3 sm:grid-cols-[1fr_1fr_auto]"><input required placeholder="Nama paket" value={variant.name} onChange={(event) => setVariants(variants.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} className={inputClass} /><input required min="1" type="number" placeholder="Harga" value={variant.price} onChange={(event) => setVariants(variants.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item))} className={inputClass} /><Button type="button" variant="ghost" disabled={variants.length === 1} onClick={() => setVariants(variants.filter((_, itemIndex) => itemIndex !== index))} className="w-full sm:size-9"><X /> <span className="sm:hidden">Hapus paket</span></Button></div>)}</div></div>
        {error && <p className="break-words rounded-xl bg-[#fee2e2] p-3 text-sm font-semibold text-[#b91c1c]">{error}</p>}
        <Button disabled={busy} type="submit" className="h-12 w-full rounded-xl bg-[#2A1620]"><Save /> {busy ? "Menyimpan..." : "Simpan Produk"}</Button>
      </form>
    </DialogContent>
  </Dialog>;
}

function InvoicesPanel({ orders, onInvoice }: { orders: Order[]; onInvoice: (order: Order) => void }) {
  return <section className="min-w-0"><h2 className="text-2xl font-black text-[#2A1620]">Invoice</h2><p className="mt-1 text-sm text-[#6B7280]">Invoice tersedia untuk pesanan yang sudah lunas.</p><div className="mt-6 overflow-hidden rounded-[22px] border border-[#EBCBD2] bg-white">{orders.length ? <div className="max-w-full touch-pan-x overflow-x-auto overscroll-x-contain"><Table className="min-w-[680px]"><TableHeader><TableRow className="bg-[#FDF8F9]"><TableHead className="px-5">Nomor Invoice</TableHead><TableHead>Pembeli</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead className="px-5 text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{orders.map((order) => <TableRow key={order.id}><TableCell className="px-5 font-bold">{order.invoiceNumber}</TableCell><TableCell>{order.buyerName}</TableCell><TableCell className="font-bold">{rupiah(order.total)}</TableCell><TableCell><StatusPill value="lunas" /></TableCell><TableCell className="px-5 text-right"><Button size="sm" variant="outline" onClick={() => onInvoice(order)} className="border-[#EBCBD2]"><FileText /> Lihat Invoice</Button></TableCell></TableRow>)}</TableBody></Table></div> : <p className="p-8 text-center text-[#6B7280] sm:p-10">Belum ada invoice lunas.</p>}</div></section>;
}

function SettingsPanel({ settings, setSettings, onSaved }: { settings: StoreSettings; setSettings: (value: StoreSettings) => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  async function save(event: React.FormEvent) { event.preventDefault(); const qrisImage = normalizeGoogleDriveImageUrl(settings.qrisImageUrl ?? ""); if (qrisImage.error || !qrisImage.url) { setError(qrisImage.error ?? "Link gambar QRIS Google Drive wajib diisi"); return; } setBusy(true); setError(""); try { await requestJson("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...settings, qrisImageUrl: qrisImage.url, adminPassword }) }); setSettings({ ...settings, qrisImageUrl: qrisImage.url }); setAdminPassword(""); onSaved(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Gagal menyimpan"); } finally { setBusy(false); } }
  return <section className="w-full min-w-0 max-w-3xl"><h2 className="text-2xl font-black text-[#2A1620]">Pengaturan Toko</h2><p className="mt-1 text-sm text-[#6B7280]">Atur WhatsApp penjual dan QRIS manual yang tampil setelah checkout.</p>
  <form onSubmit={save} className="mt-6 grid min-w-0 gap-5 rounded-[24px] border border-[#EBCBD2] bg-white p-4 sm:grid-cols-2 sm:p-6">
  <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Link gambar QRIS Google Drive</span><input required type="url" value={settings.qrisImageUrl ?? ""} onChange={(event) => { setSettings({ ...settings, qrisImageUrl: event.target.value }); setError(""); }} placeholder="https://drive.google.com/file/d/FILE_ID/view" className={inputClass} /></label>
  <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Nama pemilik QRIS <em className="font-normal not-italic text-[#8b8f99]">Opsional</em></span><input value={settings.qrisAccountName ?? ""} onChange={(event) => setSettings({ ...settings, qrisAccountName: event.target.value })} placeholder="Contoh: Miztel Digital" className={inputClass} /></label>
  <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Instruksi pembayaran</span><textarea value={settings.paymentInstruction ?? ""} onChange={(event) => setSettings({ ...settings, paymentInstruction: event.target.value })} className="min-h-24 w-full rounded-xl border border-[#EBCBD2] bg-white p-4 outline-none focus:border-[#bd7184] focus:ring-4 focus:ring-[#F2D8DE]" /></label>
  <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Nomor WhatsApp Penjual</span><input required value={settings.whatsappNumber ?? ""} onChange={(event) => setSettings({ ...settings, whatsappNumber: event.target.value })} placeholder="Contoh: 6281234567890" className={inputClass} /></label>
  <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Link Channel WhatsApp</span><input type="url" value={settings.whatsappChannelUrl ?? ""} onChange={(event) =>
        setSettings({ ...settings, whatsappChannelUrl: event.target.value, })} placeholder="https://whatsapp.com/channel/..." className={inputClass}/></label>
  <label><span className="mb-2 block text-sm font-bold text-[#2A1620]">Telepon toko</span><input value={settings.storePhone ?? ""} onChange={(event) => setSettings({ ...settings, storePhone: event.target.value })} className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-[#2A1620]">Email toko</span><input type="email" value={settings.storeEmail ?? ""} onChange={(event) => setSettings({ ...settings, storeEmail: event.target.value })} className={inputClass} /></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Alamat / identitas toko</span><input value={settings.storeAddress ?? ""} onChange={(event) => setSettings({ ...settings, storeAddress: event.target.value })} className={inputClass} /></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Catatan invoice</span><input value={settings.invoiceNote ?? ""} onChange={(event) => setSettings({ ...settings, invoiceNote: event.target.value })} className={inputClass} /></label><label className="sm:col-span-2"><span className="mb-2 flex items-center gap-2 text-sm font-bold text-[#2A1620]"><LockKeyhole className="size-4" /> Konfirmasi password admin</span><input required type="password" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="Password yang digunakan untuk login" className={inputClass} /><small className="mt-2 block text-[#6B7280]">Wajib diisi untuk mengubah foto QRIS, nomor WhatsApp, atau pengaturan lainnya.</small></label>{error && <p className="break-words rounded-xl bg-[#fee2e2] p-3 text-sm text-[#b91c1c] sm:col-span-2">{error}</p>}<Button disabled={busy} type="submit" className="h-11 w-full rounded-xl bg-[#2A1620] sm:col-span-2"><Save /> {busy ? "Menyimpan..." : "Simpan Pengaturan"}</Button></form></section>;
}

function ProfilePanel({ admin, onReset, onChanged }: { admin: Admin; onReset: () => void; onChanged: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  async function change(event: React.FormEvent) { event.preventDefault(); setMessage(""); try { await requestJson("/api/admin/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) }); setMessage("Password berhasil diganti. Silakan login kembali."); setTimeout(onChanged, 1000); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Gagal mengganti password"); } }
  return <section className="w-full min-w-0 max-w-3xl"><h2 className="text-2xl font-black text-[#2A1620]">Profil Admin</h2><div className="mt-6 grid gap-6 md:grid-cols-2"><div className="min-w-0 rounded-[24px] border border-[#EBCBD2] bg-white p-5 sm:p-6"><span className="grid size-12 place-items-center rounded-2xl bg-[#F2D8DE]"><User className="text-[#8d5060]" /></span><h3 className="mt-5 break-words font-black text-[#2A1620]">{admin.name}</h3><p className="break-all text-sm text-[#6B7280]">{admin.email}</p><Button variant="outline" onClick={onReset} className="mt-6 h-auto min-h-10 w-full whitespace-normal border-[#EBCBD2] py-2"><KeyRound /> Reset via Kode Email</Button></div><form onSubmit={change} className="min-w-0 rounded-[24px] border border-[#EBCBD2] bg-white p-5 sm:p-6"><h3 className="font-black text-[#2A1620]">Ganti Password</h3><div className="mt-5 space-y-4"><Field label="Password saat ini" value={currentPassword} setValue={setCurrentPassword} type="password" /><Field label="Password baru" value={newPassword} setValue={setNewPassword} type="password" />{message && <p className="break-words text-sm font-semibold text-[#8d5060]">{message}</p>}<Button type="submit" className="w-full bg-[#2A1620]"><Save /> Ganti Password</Button></div></form></div></section>;
}

function InvoiceDialog({ order, onOpenChange }: { order: Order | null; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={!!order} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-[24px] border-[#EBCBD2] bg-white"><DialogHeader><DialogTitle className="break-words pr-6 text-2xl font-black text-[#2A1620]">Invoice {order?.invoiceNumber}</DialogTitle><DialogDescription>Bukti pembelian lunas Miztel Digital.</DialogDescription></DialogHeader>{order && <div className="invoice-sheet mt-3 min-w-0 border-t border-[#EBCBD2] pt-6"><div className="flex flex-col gap-3 min-[390px]:flex-row min-[390px]:justify-between"><div className="min-w-0"><strong className="text-lg text-[#2A1620]">Miztel Digital</strong><p className="break-words text-sm text-[#6B7280]">Ditagihkan kepada {order.buyerName}</p><p className="mt-1 text-xs text-[#6B7280]">QRIS - Konfirmasi Manual</p><p className="text-xs text-[#6B7280]">Tanggal pembayaran: {order.paidAt ? new Date(order.paidAt).toLocaleString("id-ID") : "-"}</p></div><div><StatusPill value="lunas" /></div></div><div className="mt-6 max-w-full touch-pan-x overflow-x-auto"><Table className="min-w-[520px]"><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader><TableBody>{order.items.map((item, index) => <TableRow key={index}><TableCell><strong>{item.productNameSnapshot}</strong><span className="block text-sm text-[#6B7280]">{item.variantNameSnapshot}</span></TableCell><TableCell>{item.quantity}</TableCell><TableCell className="text-right">{rupiah(item.subtotal)}</TableCell></TableRow>)}</TableBody></Table></div><div className="ml-auto mt-6 max-w-sm space-y-2 text-sm"><p className="flex justify-between gap-4"><span>Subtotal produk</span><span>{rupiah(order.subtotal)}</span></p><p className="flex justify-between gap-4 border-t border-[#EBCBD2] pt-3 text-lg font-black"><span>Total dibayar</span><span>{rupiah(order.subtotal)}</span></p></div><Button onClick={() => window.print()} className="mt-6 h-auto min-h-10 w-full whitespace-normal bg-[#2A1620] py-2"><Printer /> Print / Download PDF</Button></div>}</DialogContent></Dialog>;
}
