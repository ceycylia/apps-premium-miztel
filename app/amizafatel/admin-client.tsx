"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- Native home links work reliably in the current vinext runtime. */

import { useEffect, useState } from "react";
import { BarChart3, BadgeCheck, FileText, ImagePlus, Images, KeyRound, LockKeyhole, LogOut, MessageCircle, Package, Pencil, Plus, Printer, ReceiptText, RefreshCw, Save, Settings, ShoppingBag, Trash2, User, WalletCards, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseJson } from "@/lib/client-json";
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
  const revenue = orders.filter((order) => order.paymentStatus === "paid").reduce((total, order) => total + order.subtotal - (order.costAmount ?? 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const metrics = [
    [ShoppingBag, "Order hari ini", orders.filter((order) => order.createdAt.startsWith(today)).length],
    [WalletCards, "Pending", orders.filter((order) => order.paymentStatus !== "paid" && order.orderStatus !== "dibatalkan").length],
    [BadgeCheck, "Lunas", orders.filter((order) => order.paymentStatus === "paid").length],
    [BarChart3, "Pendapatan", rupiah(revenue)],
  ];
  const nav: [Tab, typeof BarChart3, string][] = [["dashboard", BarChart3, "Dashboard"], ["orders", ShoppingBag, "Pesanan"], ["products", Package, "Produk"], ["otherShop", Images, "Other Shop"], ["invoices", ReceiptText, "Invoice"], ["settings", Settings, "Pengaturan"], ["profile", User, "Profil Admin"]];

  return <main className="min-h-screen overflow-x-hidden bg-[#f9f4f5] text-[#22304A]"><div className="grid min-h-screen min-w-0 lg:grid-cols-[245px_minmax(0,1fr)]"><aside className="min-w-0 bg-[#2A1620] p-4 text-white lg:p-5"><div className="flex items-center gap-3 px-2 py-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#E9B8C2] font-black text-[#2A1620]">M</span><div className="min-w-0"><strong className="block truncate">Miztel Digital</strong><span className="text-xs text-[#cbb7bd]">Admin workspace</span></div></div><nav className="mt-5 grid grid-cols-2 gap-2 text-sm font-bold sm:grid-cols-3 lg:mt-8 lg:grid-cols-1">{nav.map(([value, Icon, label]) => <button key={value} onClick={() => setTab(value)} className={`flex min-w-0 items-center gap-2 rounded-xl px-3 py-3 text-left lg:gap-3 lg:px-4 ${tab === value ? "bg-white/10 text-white" : "text-[#cebcc1] hover:bg-white/5"}`}><Icon className="size-4 shrink-0" /><span className="min-w-0 break-words">{label}</span></button>)}</nav><div className="mt-5 rounded-2xl bg-white/5 p-4 lg:mt-10"><p className="text-xs text-[#bdaab0]">Login sebagai</p><p className="mt-1 break-words text-sm font-bold">{admin.name}</p><button onClick={onLogout} className="mt-3 flex items-center gap-2 text-xs font-bold text-[#E9B8C2]"><LogOut className="size-3.5" /> Keluar</button></div></aside><div className="min-w-0"><header className="flex min-h-[72px] items-center justify-between gap-3 border-b border-[#EBCBD2] bg-white px-4 py-3 sm:px-5 lg:px-8"><div className="min-w-0"><p className="truncate text-xs font-bold uppercase tracking-wider text-[#a66a78]">Miztel Digital</p><h1 className="truncate text-xl font-black text-[#2A1620]">{nav.find(([value]) => value === tab)?.[2]}</h1></div><Button asChild size="sm" variant="outline" className="shrink-0 rounded-xl border-[#EBCBD2] text-[#8d5060]"><a href="/" target="_blank" rel="noreferrer">Lihat toko →</a></Button></header><div className="min-w-0 p-4 sm:p-5 lg:p-8">{notice && <p className="mb-5 break-words rounded-xl bg-[#fff3d6] p-3 text-sm font-semibold text-[#8a5c00]">{notice}</p>}
    {tab === "dashboard" && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([Icon, label, value]) => { const I = Icon as typeof ShoppingBag; return <div key={String(label)} className="min-w-0 rounded-[20px] border border-[#EBCBD2] bg-white p-5"><span className="grid size-10 place-items-center rounded-xl bg-[#F2D8DE]"><I className="size-4 text-[#8d5060]" /></span><p className="mt-5 text-sm text-[#6B7280]">{String(label)}</p><p className="mt-1 break-words text-2xl font-black text-[#2A1620]">{String(value)}</p></div>; })}</div><OrdersTable orders={orders.slice(0, 5)} onUpdated={loadAll} onInvoice={setInvoice} /></>}
    {tab === "orders" && <OrdersTable orders={orders} onUpdated={loadAll} onInvoice={setInvoice} />}
    {tab === "products" && <ProductsPanel products={products} onCreate={() => { setEditing(null); setProductDialog(true); }} onEdit={(product) => { setEditing(product); setProductDialog(true); }} onUpdated={loadAll} />}
    {tab === "otherShop" && <OtherShopPanel items={otherShopItems} onCreate={() => { setEditingOtherShop(null); setOtherShopDialog(true); }} onEdit={(item) => { setEditingOtherShop(item); setOtherShopDialog(true); }} onUpdated={loadAll} />}
    {tab === "invoices" && <InvoicesPanel orders={orders.filter((order) => order.paymentStatus === "paid")} onInvoice={setInvoice} />}
    {tab === "settings" && <SettingsPanel settings={settings} setSettings={setSettings} onSaved={() => { setNotice("Pengaturan berhasil disimpan."); void loadAll(); }} />}
    {tab === "profile" && <ProfilePanel admin={admin} onReset={() => setProfileReset(true)} onChanged={onLogout} />}
  </div></div></div>
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

function OrdersTable({ orders, onUpdated, onInvoice }: { orders: Order[]; onUpdated: () => Promise<void>; onInvoice: (order: Order) => void }) {
  const [confirming, setConfirming] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [costDrafts, setCostDrafts] = useState<Record<number, string>>({});

  async function update(order: Order, payload: object) {
    setBusy(true);
    setError("");
    try {
      await requestJson(`/api/admin/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      await onUpdated();
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Status gagal diperbarui");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function confirmPayment() {
    if (!confirming) return;
    if (await update(confirming, { confirmPayment: true })) setConfirming(null);
  }

  async function saveCost(order: Order) {
    const value = Number(costDrafts[order.id] ?? order.costAmount ?? 0);
    if (!Number.isInteger(value) || value < 0) {
      setError("Modal harus berupa angka nol atau lebih.");
      return;
    }
    if (await update(order, { costAmount: value })) {
      setCostDrafts((current) => { const next = { ...current }; delete next[order.id]; return next; });
    }
  }

  async function deleteOrder() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      await requestJson(`/api/admin/orders/${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      await onUpdated();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Order gagal dihapus");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="mt-6 overflow-hidden rounded-[22px] border border-[#EBCBD2] bg-white">
      <div className="border-b border-[#EBCBD2] p-4 sm:p-5"><h2 className="font-black text-[#2A1620]">Pesanan</h2><p className="text-sm text-[#6B7280]">Konfirmasi pembayaran, buka invoice, atau hapus data pesanan testing.</p>{error && <p className="mt-3 break-words rounded-xl bg-[#fee2e2] p-3 text-sm font-semibold text-[#b91c1c]">{error}</p>}</div>
      {orders.length ? <div className="max-w-full touch-pan-x overflow-x-auto overscroll-x-contain"><Table className="min-w-[1180px]"><TableHeader><TableRow className="bg-[#FDF8F9]"><TableHead className="px-5">Order</TableHead><TableHead>Pembeli</TableHead><TableHead>Produk</TableHead><TableHead>Total</TableHead><TableHead>Modal</TableHead><TableHead>Tanggal</TableHead><TableHead>Pembayaran</TableHead><TableHead className="px-5 text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{orders.map((order) => <TableRow key={order.id}>
        <TableCell className="px-5 font-bold">{order.orderNumber}</TableCell>
        <TableCell><strong>{order.buyerName}</strong><span className="block text-xs text-[#6B7280]">{order.buyerWhatsapp}</span></TableCell>
        <TableCell className="min-w-52"><span className="line-clamp-2 text-sm">{order.items.map((item) => `${item.productNameSnapshot} - ${item.variantNameSnapshot} × ${item.quantity}`).join(", ") || "-"}</span></TableCell>
        <TableCell className="font-bold">{rupiah(order.subtotal)}</TableCell>
        <TableCell><div className="flex min-w-[180px] items-center gap-2"><input type="number" min="0" step="1" inputMode="numeric" aria-label={`Modal order ${order.orderNumber}`} value={costDrafts[order.id] ?? String(order.costAmount ?? 0)} onChange={(event) => setCostDrafts((current) => ({ ...current, [order.id]: event.target.value }))} className="h-9 w-28 rounded-lg border border-[#EBCBD2] bg-white px-3 text-sm outline-none focus:border-[#bd7184] focus:ring-2 focus:ring-[#F2D8DE]" /><Button disabled={busy} size="icon-sm" variant="outline" onClick={() => void saveCost(order)} className="border-[#EBCBD2]" aria-label={`Simpan modal order ${order.orderNumber}`}><Save /></Button></div></TableCell>
        <TableCell className="whitespace-nowrap text-sm">{new Date(order.createdAt).toLocaleString("id-ID")}</TableCell>
        <TableCell><StatusPill value={order.paymentStatus === "paid" ? "lunas" : order.orderStatus} /></TableCell>
        <TableCell className="px-5 text-right"><div className="flex min-w-max justify-end gap-2">
          {order.paymentStatus !== "paid" && <Button disabled={busy} size="sm" onClick={() => { setError(""); setConfirming(order); }} className="bg-[#16A34A]">Konfirmasi Pembayaran</Button>}
          {order.paymentStatus === "paid" && <Button size="sm" variant="outline" onClick={() => onInvoice(order)} className="border-[#EBCBD2]">Invoice</Button>}
          <Button asChild size="icon-sm" variant="outline" className="border-[#EBCBD2]"><a href={`https://wa.me/${order.buyerWhatsapp.replace(/\D/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(`Halo ${order.buyerName}, terkait order ${order.orderNumber}`)}`} target="_blank" rel="noreferrer"><MessageCircle /></a></Button>
          <Button disabled={busy} size="icon-sm" variant="outline" onClick={() => { setError(""); setDeleting(order); }} className="border-red-200 text-red-600" aria-label={`Hapus order ${order.orderNumber}`}><Trash2 /></Button>
        </div></TableCell>
      </TableRow>)}</TableBody></Table></div> : <p className="p-10 text-center text-[#6B7280]">Belum ada pesanan.</p>}
    </div>
    <Dialog open={!!confirming} onOpenChange={(open) => { if (!open && !busy) setConfirming(null); }}><DialogContent className="max-w-md rounded-[24px] border-[#EBCBD2] bg-white"><DialogHeader><DialogTitle className="text-xl font-black text-[#2A1620]">Konfirmasi Pembayaran</DialogTitle><DialogDescription>Pastikan pembayaran sudah benar-benar masuk sebelum mengonfirmasi.</DialogDescription></DialogHeader>{confirming && <div className="mt-3 rounded-2xl bg-[#FDF8F9] p-4 text-sm"><p className="flex justify-between gap-4"><span>Order</span><strong>{confirming.orderNumber}</strong></p><p className="mt-2 flex justify-between gap-4"><span>Total</span><strong>{rupiah(confirming.subtotal)}</strong></p></div>}<div className="mt-4 flex justify-end gap-3"><Button disabled={busy} variant="outline" onClick={() => setConfirming(null)} className="border-[#EBCBD2]">Batal</Button><Button disabled={busy} onClick={() => void confirmPayment()} className="bg-[#16A34A]">{busy ? "Mengonfirmasi..." : "Ya, Konfirmasi Pembayaran"}</Button></div></DialogContent></Dialog>
    <Dialog open={!!deleting} onOpenChange={(open) => { if (!open && !busy) setDeleting(null); }}><DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[24px] border-[#EBCBD2] bg-white"><DialogHeader><DialogTitle className="text-xl font-black text-[#2A1620]">Yakin ingin menghapus?</DialogTitle><DialogDescription>Data pesanan dan item terkait akan dihapus permanen dari daftar Admin.</DialogDescription></DialogHeader>{deleting && <div className="mt-3 rounded-2xl bg-[#FDF8F9] p-4 text-sm"><p className="flex justify-between gap-4"><span>Order</span><strong className="break-all text-right">{deleting.orderNumber}</strong></p><p className="mt-2 flex justify-between gap-4"><span>Pembeli</span><strong className="break-words text-right">{deleting.buyerName}</strong></p></div>}<div className="mt-4 grid gap-3 sm:grid-cols-2"><Button disabled={busy} variant="outline" onClick={() => setDeleting(null)} className="border-[#EBCBD2]">Batal</Button><Button disabled={busy} onClick={() => void deleteOrder()} variant="destructive">{busy ? "Menghapus..." : "Ya, Hapus Pesanan"}</Button></div></DialogContent></Dialog>
  </>;
}

function ProductsPanel({ products, onCreate, onEdit, onUpdated }: { products: Product[]; onCreate: () => void; onEdit: (product: Product) => void; onUpdated: () => Promise<void> }) {
  async function toggle(product: Product) { await requestJson(`/api/admin/products/${product.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...product, isActive: !product.isActive, variants: product.variants.map((variant) => ({ name: variant.variantName, price: variant.price })) }) }); await onUpdated(); }
  async function remove(product: Product) { if (!window.confirm(`Hapus ${product.name}? Produk yang sudah memiliki transaksi akan diarsipkan.`)) return; await requestJson(`/api/admin/products/${product.id}`, { method: "DELETE" }); await onUpdated(); }
  return <section className="min-w-0"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-black text-[#2A1620]">Produk</h2><p className="text-sm text-[#6B7280]">Produk aktif otomatis tampil di halaman pembeli.</p></div><Button onClick={onCreate} className="w-full rounded-xl bg-[#2A1620] sm:w-auto"><Plus /> Tambah Produk</Button></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => <article key={product.id} className="min-w-0 rounded-[20px] border border-[#EBCBD2] bg-white p-5"><div className="flex items-start gap-3">{product.imageUrl ? <img src={product.imageUrl} alt="" className="size-12 shrink-0 rounded-xl object-cover" /> : <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#2A1620] font-black text-white">{product.name[0]}</span>}<div className="min-w-0 flex-1"><div className="flex min-w-0 items-center justify-between gap-2"><strong className="truncate text-[#2A1620]">{product.name}</strong><StatusPill value={product.isActive ? "aktif" : "nonaktif"} /></div><p className="text-sm text-[#6B7280]">{product.category}</p></div></div><div className="mt-5 space-y-2 border-t border-[#f0dce1] pt-4">{product.variants.map((variant) => <div key={`${product.id}-${variant.id}`} className="flex justify-between gap-3 text-sm"><span className="min-w-0 break-words">{variant.variantName}</span><strong className="shrink-0">{rupiah(variant.price)}</strong></div>)}</div><div className="mt-5 grid gap-2 min-[390px]:grid-cols-2"><Button size="sm" variant="outline" onClick={() => onEdit(product)} className="border-[#EBCBD2]"><Pencil /> Edit</Button><Button size="sm" variant="outline" onClick={() => void toggle(product)} className="border-[#EBCBD2]">{product.isActive ? "Nonaktifkan" : "Aktifkan"}</Button><Button size="sm" variant="outline" onClick={() => void remove(product)} className="border-red-200 text-red-600 min-[390px]:col-span-2"><Trash2 /> Hapus</Button></div></article>)}</div>{!products.length && <p className="mt-6 rounded-2xl border border-dashed border-[#EBCBD2] bg-white p-8 text-center text-[#6B7280] sm:p-10">Belum ada produk. Klik “Tambah Produk”.</p>}</section>;
}

function ProductDialog({ open, product, onOpenChange, onSaved }: { open: boolean; product: Product | null; onOpenChange: (open: boolean) => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "Music Apps");
  const [description, setDescription] = useState(product?.description ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [variants, setVariants] = useState<{ name: string; price: string }[]>(() => product?.variants.length ? product.variants.map((variant) => ({ name: variant.variantName, price: String(variant.price) })) : [{ name: "", price: "" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(file: File) { const form = new FormData(); form.append("file", file); const data = await requestJson<{ url: string }>("/api/admin/uploads", { method: "POST", body: form }); setImageUrl(data.url); }
  async function save(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { const payload = { name, category, description, imageUrl, isActive: product?.isActive ?? true, variants: variants.map((variant) => ({ name: variant.name, price: Number(variant.price) })) }; await requestJson(product ? `/api/admin/products/${product.id}` : "/api/admin/products", { method: product ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); await onSaved(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Produk gagal disimpan"); } finally { setBusy(false); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-[24px] border-[#EBCBD2] bg-white"><DialogHeader><DialogTitle className="break-words pr-6 text-2xl font-black text-[#2A1620]">{product ? "Edit Produk" : "Tambah Produk"}</DialogTitle><DialogDescription>Isi detail aplikasi dan satu atau lebih paket.</DialogDescription></DialogHeader><form onSubmit={save} className="mt-3 min-w-0 space-y-5"><label className="block"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Gambar / icon produk</span><div className="grid min-w-0 gap-4 sm:grid-cols-[64px_minmax(0,1fr)] sm:items-center">{imageUrl ? <img src={imageUrl} alt="Preview icon" className="size-16 rounded-2xl object-cover ring-1 ring-[#EBCBD2]" /> : <span className="grid size-16 place-items-center rounded-2xl bg-[#F2D8DE]"><ImagePlus className="text-[#8d5060]" /></span>}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file).catch((reason) => setError(reason.message)); }} className="min-w-0 max-w-full text-sm" /></div></label><div className="grid gap-4 sm:grid-cols-2"><Field label="Nama aplikasi" value={name} setValue={setName} /><label><span className="mb-2 block text-sm font-bold text-[#2A1620]">Kategori</span><NativeSelect value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 min-w-full rounded-xl border-[#EBCBD2]"><NativeSelectOption value="Music Apps">Music Apps</NativeSelectOption><NativeSelectOption value="Editing Apps">Editing Apps</NativeSelectOption><NativeSelectOption value="Streaming Apps">Streaming Apps</NativeSelectOption><NativeSelectOption value="Other Apps">Other Apps</NativeSelectOption></NativeSelect></label></div><label className="block"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Deskripsi singkat</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-24 w-full rounded-xl border border-[#EBCBD2] p-4 outline-none focus:ring-4 focus:ring-[#F2D8DE]" /></label><div><div className="flex flex-col gap-3 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between"><span className="text-sm font-bold text-[#2A1620]">Paket / varian</span><Button type="button" size="sm" variant="outline" onClick={() => setVariants([...variants, { name: "", price: "" }])} className="w-full border-[#EBCBD2] min-[390px]:w-auto"><Plus /> Tambah Paket</Button></div><div className="mt-3 space-y-3">{variants.map((variant, index) => <div key={index} className="grid gap-2 rounded-2xl bg-[#FDF8F9] p-3 sm:grid-cols-[1fr_1fr_auto]"><input required placeholder="Nama paket" value={variant.name} onChange={(event) => setVariants(variants.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} className={inputClass} /><input required min="1" type="number" placeholder="Harga" value={variant.price} onChange={(event) => setVariants(variants.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item))} className={inputClass} /><Button type="button" variant="ghost" disabled={variants.length === 1} onClick={() => setVariants(variants.filter((_, itemIndex) => itemIndex !== index))} className="w-full sm:size-9"><X /> <span className="sm:hidden">Hapus paket</span></Button></div>)}</div></div>{error && <p className="break-words rounded-xl bg-[#fee2e2] p-3 text-sm font-semibold text-[#b91c1c]">{error}</p>}<Button disabled={busy} type="submit" className="h-12 w-full rounded-xl bg-[#2A1620]"><Save /> {busy ? "Menyimpan..." : "Simpan Produk"}</Button></form></DialogContent></Dialog>;
}

function InvoicesPanel({ orders, onInvoice }: { orders: Order[]; onInvoice: (order: Order) => void }) {
  return <section className="min-w-0"><h2 className="text-2xl font-black text-[#2A1620]">Invoice</h2><p className="mt-1 text-sm text-[#6B7280]">Invoice tersedia untuk pesanan yang sudah lunas.</p><div className="mt-6 overflow-hidden rounded-[22px] border border-[#EBCBD2] bg-white">{orders.length ? <div className="max-w-full touch-pan-x overflow-x-auto overscroll-x-contain"><Table className="min-w-[680px]"><TableHeader><TableRow className="bg-[#FDF8F9]"><TableHead className="px-5">Nomor Invoice</TableHead><TableHead>Pembeli</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead className="px-5 text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{orders.map((order) => <TableRow key={order.id}><TableCell className="px-5 font-bold">{order.invoiceNumber}</TableCell><TableCell>{order.buyerName}</TableCell><TableCell className="font-bold">{rupiah(order.total)}</TableCell><TableCell><StatusPill value="lunas" /></TableCell><TableCell className="px-5 text-right"><Button size="sm" variant="outline" onClick={() => onInvoice(order)} className="border-[#EBCBD2]"><FileText /> Lihat Invoice</Button></TableCell></TableRow>)}</TableBody></Table></div> : <p className="p-8 text-center text-[#6B7280] sm:p-10">Belum ada invoice lunas.</p>}</div></section>;
}

function SettingsPanel({ settings, setSettings, onSaved }: { settings: StoreSettings; setSettings: (value: StoreSettings) => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  async function uploadQris(file: File) {
    if (!adminPassword) {
      setError("Masukkan password admin sebelum mengganti gambar QRIS.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", "qris");
      form.append("adminPassword", adminPassword);
      const data = await requestJson<{ url: string }>("/api/admin/uploads", { method: "POST", body: form });
      setSettings({ ...settings, qrisImageUrl: data.url });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload QRIS gagal");
    } finally {
      setUploading(false);
    }
  }
  async function save(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { await requestJson("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...settings, adminPassword }) }); setAdminPassword(""); onSaved(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Gagal menyimpan"); } finally { setBusy(false); } }
  return <section className="w-full min-w-0 max-w-3xl"><h2 className="text-2xl font-black text-[#2A1620]">Pengaturan Toko</h2><p className="mt-1 text-sm text-[#6B7280]">Atur WhatsApp penjual dan QRIS manual yang tampil setelah checkout.</p>
  <form onSubmit={save} className="mt-6 grid min-w-0 gap-5 rounded-[24px] border border-[#EBCBD2] bg-white p-4 sm:grid-cols-2 sm:p-6">
  <div className="min-w-0 sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Gambar QRIS</span><div className="rounded-2xl border border-dashed border-[#d8aeb8] bg-[#FDF8F9] p-4">{settings.qrisImageUrl ? <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,256px)_minmax(160px,1fr)] sm:items-start"><img src={settings.qrisImageUrl} alt="Preview QRIS saat ini" className="mx-auto h-auto w-full max-w-64 rounded-xl bg-white p-2 ring-1 ring-[#EBCBD2] sm:mx-0" /><div className="grid w-full gap-2 sm:max-w-52"><label className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2A1620] px-4 text-sm font-bold text-white"><ImagePlus className="size-4" /> {uploading ? "Mengupload..." : "Ganti Foto QRIS"}<input disabled={uploading} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadQris(file); event.currentTarget.value = ""; }} className="sr-only" /></label><Button type="button" variant="outline" onClick={() => setSettings({ ...settings, qrisImageUrl: null })} className="h-11 w-full border-red-200 text-red-600"><Trash2 /> Hapus QRIS</Button><small className="text-center leading-5 text-[#6B7280] sm:text-left">Masukkan password admin sebelum mengganti foto.</small></div></div> : <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl bg-white px-4 text-center ring-1 ring-[#EBCBD2]"><ImagePlus className="size-8 text-[#8d5060]" /><span className="text-sm font-bold text-[#2A1620]">{uploading ? "Mengupload QRIS..." : "Upload gambar QRIS"}</span><small className="text-[#6B7280]">PNG, JPG, atau WEBP maksimal 2 MB</small><input disabled={uploading} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadQris(file); event.currentTarget.value = ""; }} className="sr-only" /></label>}</div></div>
  <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Nama pemilik QRIS <em className="font-normal not-italic text-[#8b8f99]">Opsional</em></span><input value={settings.qrisAccountName ?? ""} onChange={(event) => setSettings({ ...settings, qrisAccountName: event.target.value })} placeholder="Contoh: Miztel Digital" className={inputClass} /></label>
  <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Instruksi pembayaran</span><textarea value={settings.paymentInstruction ?? ""} onChange={(event) => setSettings({ ...settings, paymentInstruction: event.target.value })} className="min-h-24 w-full rounded-xl border border-[#EBCBD2] bg-white p-4 outline-none focus:border-[#bd7184] focus:ring-4 focus:ring-[#F2D8DE]" /></label>
  <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Nomor WhatsApp Penjual</span><input required value={settings.whatsappNumber ?? ""} onChange={(event) => setSettings({ ...settings, whatsappNumber: event.target.value })} placeholder="Contoh: 6281234567890" className={inputClass} /></label>
  <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Link Channel WhatsApp</span><input type="url" value={settings.whatsappChannelUrl ?? ""} onChange={(event) =>
        setSettings({ ...settings, whatsappChannelUrl: event.target.value, })} placeholder="https://whatsapp.com/channel/..." className={inputClass}/></label>
  <label><span className="mb-2 block text-sm font-bold text-[#2A1620]">Telepon toko</span><input value={settings.storePhone ?? ""} onChange={(event) => setSettings({ ...settings, storePhone: event.target.value })} className={inputClass} /></label><label><span className="mb-2 block text-sm font-bold text-[#2A1620]">Email toko</span><input type="email" value={settings.storeEmail ?? ""} onChange={(event) => setSettings({ ...settings, storeEmail: event.target.value })} className={inputClass} /></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Alamat / identitas toko</span><input value={settings.storeAddress ?? ""} onChange={(event) => setSettings({ ...settings, storeAddress: event.target.value })} className={inputClass} /></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Catatan invoice</span><input value={settings.invoiceNote ?? ""} onChange={(event) => setSettings({ ...settings, invoiceNote: event.target.value })} className={inputClass} /></label><label className="sm:col-span-2"><span className="mb-2 flex items-center gap-2 text-sm font-bold text-[#2A1620]"><LockKeyhole className="size-4" /> Konfirmasi password admin</span><input required type="password" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="Password yang digunakan untuk login" className={inputClass} /><small className="mt-2 block text-[#6B7280]">Wajib diisi untuk mengubah foto QRIS, nomor WhatsApp, atau pengaturan lainnya.</small></label>{error && <p className="break-words rounded-xl bg-[#fee2e2] p-3 text-sm text-[#b91c1c] sm:col-span-2">{error}</p>}<Button disabled={busy || uploading} type="submit" className="h-11 w-full rounded-xl bg-[#2A1620] sm:col-span-2"><Save /> {busy ? "Menyimpan..." : "Simpan Pengaturan"}</Button></form></section>;
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
