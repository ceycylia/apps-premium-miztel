"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Clock3, Download, Headphones, LayoutGrid, MessageCircle, Minus, Play, Plus, Printer, QrCode, Search, ShieldCheck, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Variant = { id: number; variantName: string; durationLabel: string; price: number };
type Product = { id: number; name: string; category: string; description: string; imageUrl: string | null; variants: Variant[] };
type Settings = { storeName: string; whatsappNumber: string; storePhone?: string; storeEmail?: string; invoiceNote?: string };
type OrderItem = { id?: number; productNameSnapshot: string; variantNameSnapshot: string; priceSnapshot: number; quantity: number; subtotal: number };
type Order = { id: number; orderNumber: string; invoiceNumber: string; invoicePublicId: string; subtotal: number; paymentFee: number; total: number; paymentStatus: string; orderStatus: string; paidAt?: string | null; items?: OrderItem[] };
type CartItem = { variantId: number; productId: number; productName: string; variantName: string; durationLabel: string; price: number; quantity: number; imageUrl: string | null; category: string };
type View = "store" | "cart" | "checkout" | "payment" | "success";

const CART_STORAGE_KEY = "miztel-cart";
const PAYMENT_FEE = 1500;
const categories = ["Semua", "Music Apps", "Editing Apps", "Streaming Apps", "Other Apps"];

const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

function whatsappUrl(number: string, message: string) {
  const digits = number.replace(/\D/g, "").replace(/^0/, "62");
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : "#";
}

function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) as CartItem[] : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function cartVariantLabel(item: Pick<CartItem, "variantName" | "durationLabel">) {
  return [item.variantName, item.durationLabel].filter((value) => value.trim()).join(" · ");
}

function formatItemLine(item: Pick<CartItem, "productName" | "variantName" | "durationLabel"> | Pick<OrderItem, "productNameSnapshot" | "variantNameSnapshot">) {
  if ("productNameSnapshot" in item) {
    return `${item.productNameSnapshot} - ${item.variantNameSnapshot}`;
  }
  return `${item.productName} - ${cartVariantLabel(item)}`;
}

function ProductIcon({ product, size = "normal" }: { product: Pick<Product, "name" | "imageUrl">; size?: "normal" | "small" }) {
  const dimensions = size === "small" ? "size-11 rounded-xl" : "size-14 rounded-[18px]";
  if (product.imageUrl) return <img src={product.imageUrl} alt={`Icon ${product.name}`} className={`${dimensions} object-cover ring-1 ring-[#EBCBD2]`} />;
  return <span className={`grid ${dimensions} place-items-center bg-[#2A1620] text-lg font-black text-white`}>{product.name?.slice(0, 1).toUpperCase() || "?"}</span>;
}

function CartButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={`Keranjang, ${count} item`} className="relative grid size-11 place-items-center rounded-xl border border-[#EBCBD2] bg-white text-[#2A1620] transition hover:bg-[#F8F0F1]">
      <ShoppingCart className="size-5" />
      {count > 0 && <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-[#2A1620] px-1.5 text-[11px] font-black text-white">{count > 99 ? "99+" : count}</span>}
    </button>
  );
}

function StoreHeader({ chatLink, cartCountValue, onCartClick }: { chatLink: string; cartCountValue: number; onCartClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#EBCBD2] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-5 lg:px-8">
        <a href="#top" className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#2A1620] text-lg font-black text-white shadow-[4px_4px_0_#E9B8C2]">M</span>
          <span className="min-w-0">
            <strong className="block truncate text-[17px] leading-5 text-[#2A1620]">Miztel Digital</strong>
            <small className="text-xs font-semibold tracking-[.16em] text-[#9a6672]">DIGITAL GOODS</small>
          </span>
        </a>
        <nav className="hidden items-center gap-7 text-sm font-semibold md:flex">
          <a href="#produk">Produk</a>
          <a href="#cara">Cara pembelian</a>
          <a href="#bantuan">Bantuan</a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <CartButton count={cartCountValue} onClick={onCartClick} />
          <Button asChild variant="outline" className="rounded-xl border-[#EBCBD2] bg-white text-[#2A1620] hover:bg-[#F8F0F1]">
            <a href={chatLink} target="_blank" rel="noreferrer"><MessageCircle /><span className="hidden sm:inline">Chat Penjual</span></a>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default function StorefrontClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings>({ storeName: "Miztel Digital", whatsappNumber: "" });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [selected, setSelected] = useState<Product | null>(null);
  const [variantId, setVariantId] = useState(0);
  const [view, setView] = useState<View>("store");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartReady, setCartReady] = useState(false);
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
    setCart(loadCart());
    setCartReady(true);
  }, []);

  useEffect(() => {
    if (!cartReady) return;
    saveCart(cart);
  }, [cart, cartReady]);

  useEffect(() => {
    Promise.all([fetch("/api/products").then((response) => response.json()), fetch("/api/settings").then((response) => response.json())])
      .then(([catalog, store]) => { setProducts(catalog.products ?? []); setSettings(store.settings ?? settings); })
      .catch(() => setMessage("Katalog sedang tidak tersedia. Silakan hubungi penjual."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()) && (category === "Semua" || product.category === category)), [products, query, category]);
  const chosenVariant = selected?.variants.find((variant) => variant.id === variantId) ?? selected?.variants[0];
  const chatLink = whatsappUrl(settings.whatsappNumber, "Halo Miztel Digital, saya ingin bertanya tentang produk digital.");
  const totalItems = cartCount(cart);
  const subtotal = cartSubtotal(cart);
  const grandTotal = subtotal + (cart.length ? PAYMENT_FEE : 0);

  const openProduct = (product: Product) => { setSelected(product); setVariantId(product.variants[0]?.id ?? 0); };

  function addToCart(product: Product, variant: Variant) {
    setCart((current) => {
      const existing = current.find((item) => item.variantId === variant.id);
      if (existing) {
        return current.map((item) => item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, {
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        variantName: variant.variantName,
        durationLabel: variant.durationLabel,
        price: variant.price,
        quantity: 1,
        imageUrl: product.imageUrl,
        category: product.category,
      }];
    });
    setMessage("");
    setSelected(null);
  }

  function updateCartQuantity(variantId: number, quantity: number) {
    if (quantity < 1 || quantity > 99) return;
    setCart((current) => current.map((item) => item.variantId === variantId ? { ...item, quantity } : item));
  }

  function removeFromCart(variantId: number) {
    setCart((current) => current.filter((item) => item.variantId !== variantId));
  }

  async function createOrder() {
    if (!cart.length) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({ productVariantId: item.variantId, quantity: item.quantity })),
          buyerName,
          buyerWhatsapp,
          buyerEmail,
          needsInvoice,
          invoiceName: invoiceName || buyerName,
          companyName,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Order gagal dibuat");
      setOrder(data.order);

      const midtransItems = [
        ...data.order.items.map((item: OrderItem) => ({
          id: String(item.id),
          name: formatItemLine(item),
          price: item.priceSnapshot,
          quantity: item.quantity,
        })),
        { id: "fee", name: "Biaya pembayaran", price: data.order.paymentFee, quantity: 1 },
      ];

      const paymentResponse = await fetch("/api/midtrans/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: data.order.orderNumber,
          grossAmount: data.order.total,
          items: midtransItems,
          buyerName,
          buyerEmail,
          buyerWhatsapp,
        }),
      });
      const payment = await paymentResponse.json();
      if (paymentResponse.ok) setPaymentUrl(payment.redirect_url ?? "");
      setView("payment");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Order gagal dibuat");
    } finally {
      setSubmitting(false);
    }
  }

  async function checkStatus() {
    if (!order) return;
    setSubmitting(true);
    const response = await fetch("/api/orders/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber: order.orderNumber, whatsapp: buyerWhatsapp }) });
    const data = await response.json();
    setSubmitting(false);
    if (!response.ok) return setMessage(data.error ?? "Status gagal diperiksa");
    setOrder(data.order);
    if (data.order.paymentStatus === "paid") {
      setCart([]);
      setMessage("");
      setView("success");
    } else setMessage("Pembayaran belum terdeteksi");
  }

  async function simulatePayment() {
    if (!order) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/orders/simulate-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber: order.orderNumber, whatsapp: buyerWhatsapp }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Simulasi pembayaran gagal");
      setOrder(data.order);
      setCart([]);
      setView("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Simulasi pembayaran gagal");
    } finally {
      setSubmitting(false);
    }
  }

  const orderItems = order?.items ?? cart.map((item) => ({
    productNameSnapshot: item.productName,
    variantNameSnapshot: cartVariantLabel(item),
    priceSnapshot: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }));

  if (view === "cart") {
    return (
      <CartPage
        cart={cart}
        subtotal={subtotal}
        grandTotal={grandTotal}
        chatLink={chatLink}
        cartCountValue={totalItems}
        onCartClick={() => setView("cart")}
        onBack={() => setView("store")}
        onContinueShopping={() => setView("store")}
        onCheckout={() => { if (cart.length) { setMessage(""); setView("checkout"); } else setMessage("Keranjang masih kosong."); }}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeFromCart}
        message={message}
      />
    );
  }

  if (view === "checkout") {
    return (
      <Checkout
        cart={cart}
        subtotal={subtotal}
        grandTotal={grandTotal}
        values={{ buyerName, buyerWhatsapp, buyerEmail, needsInvoice, invoiceName, companyName }}
        setters={{ setBuyerName, setBuyerWhatsapp, setBuyerEmail, setNeedsInvoice, setInvoiceName, setCompanyName }}
        onBack={() => setView("cart")}
        onSubmit={createOrder}
        message={message}
        submitting={submitting}
      />
    );
  }

  if (view === "payment" && order) {
    return (
      <Payment
        items={orderItems}
        order={order}
        paymentUrl={paymentUrl}
        onBack={() => setView("checkout")}
        onCheck={checkStatus}
        onSimulate={simulatePayment}
        message={message}
        submitting={submitting}
      />
    );
  }

  if (view === "success" && order) {
    return (
      <PaymentSuccess
        items={orderItems}
        order={order}
        settings={settings}
        onBack={() => setView("store")}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F0F1] text-[#22304A]">
      <StoreHeader chatLink={chatLink} cartCountValue={totalItems} onCartClick={() => setView("cart")} />

      <section id="top" className="mx-auto grid max-w-7xl gap-6 px-5 pb-9 pt-9 lg:grid-cols-[1.35fr_.65fr] lg:px-8 lg:pb-12 lg:pt-12">
        <div className="flex flex-col justify-center rounded-[30px] border border-[#EBCBD2] bg-white p-7 shadow-[0_18px_60px_rgba(87,38,57,.07)] sm:p-10">
          <span className="mb-5 w-fit rounded-full bg-[#F2D8DE] px-4 py-2 text-sm font-black text-[#713548]">✓ Trusted 100%</span>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-[-.04em] text-[#2A1620] sm:text-5xl">Lakukan pembayaran melalui web jika perlu Struk/Invoice</h1>
          <p className="mt-4 text-base font-semibold text-[#8e5b69] sm:text-lg">(Manual by WhatsApp jika tidak perlu struk)</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" className="h-12 rounded-xl bg-[#2A1620] px-6 text-white hover:bg-[#4a2838]" asChild><a href="#produk">Lihat Katalog <ArrowRight /></a></Button>
            <Button size="lg" variant="outline" className="h-12 rounded-xl border-[#EBCBD2] bg-white px-6 text-[#2A1620] hover:bg-[#F8F0F1]" asChild><a href="#cara">Cara Pembelian</a></Button>
          </div>
        </div>
        <aside className="rounded-[30px] bg-[#E9B8C2] p-6 text-[#2A1620]">
          <div className="flex items-center justify-between"><span className="rounded-full bg-white/75 px-3 py-1 text-xs font-bold uppercase tracking-widest">Invoice preview</span><BadgeCheck className="size-5" /></div>
          <div className="mx-auto mt-5 max-w-xs rounded-[18px] bg-white p-4 shadow-[7px_7px_0_rgba(42,22,32,.1)]">
            <div className="flex justify-between border-b border-dashed border-[#EBCBD2] pb-3"><div><p className="text-[11px] font-black tracking-wider text-[#a46775]">INVOICE</p><p className="text-sm font-black">INV-20260922-0001</p></div><span className="h-fit rounded-full bg-[#dcfce7] px-2 py-1 text-[10px] font-black text-[#15803d]">LUNAS</span></div>
            <div className="space-y-2 py-4 text-sm"><p className="flex justify-between"><span>Canva - 1 Bulan</span><strong>Rp15.000</strong></p><p className="flex justify-between"><span>Spotify - 1 Bulan</span><strong>Rp28.000</strong></p></div>
            <div className="flex justify-between border-t border-[#f1e2e5] pt-3 text-sm"><span>Total</span><strong>Rp43.500</strong></div>
          </div>
        </aside>
      </section>

      <section id="produk" className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="text-sm font-black uppercase tracking-[.18em] text-[#b05e73]">Katalog</p><h2 className="mt-2 text-3xl font-black text-[#2A1620]">Pilih aplikasi</h2></div>
          <label className="flex h-12 w-full items-center gap-3 rounded-2xl border border-[#EBCBD2] bg-white px-4 md:w-80"><Search className="size-5 text-[#b57b88]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk..." className="w-full bg-transparent text-base outline-none" /></label>
        </div>
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold ${category === item ? "border-[#2A1620] bg-[#2A1620] text-white" : "border-[#EBCBD2] bg-white text-[#6c4653]"}`}>{item}</button>)}</div>
        {message && <p className="mt-5 rounded-xl bg-[#fff3d6] p-4 text-sm font-semibold text-[#8a5c00]">{message}</p>}
        {loading ? <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-[24px] border border-[#EBCBD2] bg-white" />)}</div> : filtered.length ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <article key={product.id} className="rounded-[24px] border border-[#EBCBD2] bg-white p-5 shadow-[0_8px_30px_rgba(87,38,57,.05)]">
                <ProductIcon product={product} />
                <p className="mt-5 text-xs font-black uppercase tracking-[.15em] text-[#b17684]">{product.category}</p>
                <h3 className="mt-1 text-xl font-black text-[#2A1620]">{product.name}</h3>
                <div className="mt-5 flex items-end justify-between border-t border-[#f1e2e5] pt-4">
                  <div><p className="text-xs text-[#8b8f99]">Mulai dari</p><p className="text-lg font-black text-[#2A1620]">{rupiah(Math.min(...product.variants.map((variant) => variant.price)))}</p></div>
                  <Button onClick={() => openProduct(product)} className="rounded-xl bg-[#E9B8C2] text-[#2A1620] hover:bg-[#dda4b1]">Pilih Paket</Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-3xl border border-dashed border-[#d8aeb8] bg-white p-12 text-center">
            <p className="font-bold text-[#2A1620]">Belum ada produk aktif.</p>
            <p className="mt-1 text-sm text-[#6B7280]">Produk yang ditambahkan admin akan otomatis muncul di sini.</p>
          </div>
        )}
      </section>

      <section id="cara" className="border-y border-[#EBCBD2] bg-white py-12">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <h2 className="text-3xl font-black text-[#2A1620]">Cara Pembelian</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-4">
            {[[LayoutGrid, "Pilih paket", "Pilih aplikasi dan paket yang dibutuhkan."], [ShoppingCart, "Keranjang", "Tambahkan beberapa produk sekaligus ke keranjang."], [Play, "Bayar", "Checkout sekali untuk seluruh isi keranjang."], [BadgeCheck, "Unduh invoice", "Setelah lunas, invoice berisi semua item."]].map(([Icon, title, copy], index) => {
              const I = Icon as typeof LayoutGrid;
              return (
                <div key={String(title)} className="rounded-[22px] border border-[#EBCBD2] bg-[#FDF9FA] p-6">
                  <div className="flex justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-[#F2D8DE]"><I className="size-5 text-[#914e60]" /></span><span className="font-black text-[#d39baa]">0{index + 1}</span></div>
                  <h3 className="mt-7 text-lg font-black text-[#2A1620]">{String(title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6B7280]">{String(copy)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer id="bantuan" className="bg-[#2A1620] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-9 md:flex-row md:items-center md:justify-between lg:px-8">
          <div><strong className="text-lg">Miztel Digital</strong><p className="mt-1 text-sm text-[#d8bdc5]">Produk digital dengan bukti pembelian yang jelas.</p></div>
          <Button asChild className="rounded-xl bg-white text-[#2A1620] hover:bg-[#F2D8DE]"><a href={chatLink} target="_blank" rel="noreferrer"><Headphones /> Chat Penjual</a></Button>
        </div>
      </footer>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-xl overflow-hidden rounded-[26px] border-[#EBCBD2] bg-white p-0">
          {selected && chosenVariant && (
            <>
              <div className="bg-[#F2D8DE] p-6 pr-12">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-[#2A1620]">{selected.name}</DialogTitle>
                  <DialogDescription>Pilih paket lalu tambahkan ke keranjang. Kamu bisa lanjut belanja produk lain.</DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-6">
                <RadioGroup value={String(variantId)} onValueChange={(value) => setVariantId(Number(value))}>
                  {selected.variants.map((variant) => (
                    <label key={variant.id} htmlFor={`variant-${variant.id}`} className={`mb-3 flex cursor-pointer items-center gap-4 rounded-2xl border p-4 ${variantId === variant.id ? "border-[#bd7184] bg-[#FDF7F8] ring-2 ring-[#F2D8DE]" : "border-[#EBCBD2]"}`}>
                      <RadioGroupItem id={`variant-${variant.id}`} value={String(variant.id)} />
                      <div className="flex flex-1 items-center justify-between gap-3">
                        <div><strong className="text-[#2A1620]">{variant.variantName}</strong>{variant.durationLabel && <p className="text-sm text-[#6B7280]">{variant.durationLabel}</p>}</div>
                        <strong className="text-[#2A1620]">{rupiah(variant.price)}</strong>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <Button onClick={() => addToCart(selected, chosenVariant)} className="h-12 rounded-xl bg-[#2A1620] text-white hover:bg-[#4a2838]"><ShoppingCart /> Tambah ke Keranjang</Button>
                  <Button variant="outline" onClick={() => setView("cart")} className="h-12 rounded-xl border-[#EBCBD2]">Lihat Keranjang ({totalItems})</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function MiniHeader({ label, onBack, cartCountValue, onCartClick }: { label: string; onBack: () => void; cartCountValue?: number; onCartClick?: () => void }) {
  return (
    <header className="border-b border-[#EBCBD2] bg-white">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-3 px-5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold"><ArrowLeft className="size-4" /> Kembali</button>
        <strong className="truncate text-[#2A1620]">{label}</strong>
        {onCartClick != null && cartCountValue != null ? <CartButton count={cartCountValue} onClick={onCartClick} /> : <span className="w-11" />}
      </div>
    </header>
  );
}

function Field({ label, value, setValue, required = true, type = "text" }: { label: string; value: string; setValue: (value: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#2A1620]">{label}{!required && <em className="ml-2 font-normal not-italic text-[#8b8f99]">Opsional</em>}</span>
      <input required={required} type={type} value={value} onChange={(event) => setValue(event.target.value)} className="h-12 w-full rounded-xl border border-[#EBCBD2] bg-white px-4 outline-none focus:border-[#bd7184] focus:ring-4 focus:ring-[#F2D8DE]" />
    </label>
  );
}

function CartPage({ cart, subtotal, grandTotal, chatLink, cartCountValue, onCartClick, onBack, onContinueShopping, onCheckout, onUpdateQuantity, onRemove, message }: {
  cart: CartItem[];
  subtotal: number;
  grandTotal: number;
  chatLink: string;
  cartCountValue: number;
  onCartClick: () => void;
  onBack: () => void;
  onContinueShopping: () => void;
  onCheckout: () => void;
  onUpdateQuantity: (variantId: number, quantity: number) => void;
  onRemove: (variantId: number) => void;
  message: string;
}) {
  return (
    <main className="min-h-screen bg-[#F8F0F1]">
      <MiniHeader label="Keranjang" onBack={onBack} cartCountValue={cartCountValue} onCartClick={onCartClick} />
      <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        {message && <p className="mb-5 rounded-xl bg-[#fff3d6] p-4 text-sm font-semibold text-[#8a5c00]">{message}</p>}
        {!cart.length ? (
          <div className="rounded-[26px] border border-dashed border-[#d8aeb8] bg-white p-12 text-center">
            <ShoppingCart className="mx-auto size-12 text-[#b57b88]" />
            <h1 className="mt-4 text-2xl font-black text-[#2A1620]">Keranjang masih kosong</h1>
            <p className="mt-2 text-sm text-[#6B7280]">Pilih produk dari katalog dan tambahkan ke keranjang.</p>
            <Button onClick={onContinueShopping} className="mt-6 rounded-xl bg-[#2A1620] text-white">Lanjut Belanja</Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {cart.map((item) => (
                <article key={item.variantId} className="rounded-[24px] border border-[#EBCBD2] bg-white p-5 shadow-[0_8px_30px_rgba(87,38,57,.05)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                    <ProductIcon
                      product={{
                        name: item.productName,
                        imageUrl: item.imageUrl,
                      }}
                      size="small"
                    />
                      <div>
                        <p className="text-xs font-black uppercase tracking-[.12em] text-[#b17684]">{item.category}</p>
                        <h2 className="mt-1 text-lg font-black text-[#2A1620]">{item.productName}</h2>
                        <p className="mt-1 text-sm text-[#6B7280]">{cartVariantLabel(item)}</p>
                        <p className="mt-2 text-sm font-bold text-[#2A1620]">{rupiah(item.price)} / item</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <div className="flex items-center gap-2 rounded-xl border border-[#EBCBD2] bg-[#FDF9FA] p-1">
                        <button type="button" aria-label="Kurangi quantity" onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)} disabled={item.quantity <= 1} className="grid size-9 place-items-center rounded-lg text-[#2A1620] disabled:opacity-40"><Minus className="size-4" /></button>
                        <span className="min-w-8 text-center text-sm font-black">{item.quantity}</span>
                        <button type="button" aria-label="Tambah quantity" onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)} disabled={item.quantity >= 99} className="grid size-9 place-items-center rounded-lg text-[#2A1620] disabled:opacity-40"><Plus className="size-4" /></button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#8b8f99]">Subtotal</p>
                        <p className="text-lg font-black text-[#2A1620]">{rupiah(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end border-t border-[#f1e2e5] pt-4">
                    <button type="button" onClick={() => onRemove(item.variantId)} className="inline-flex items-center gap-2 text-sm font-bold text-[#b05e73] hover:text-[#8d5060]"><Trash2 className="size-4" /> Hapus</button>
                  </div>
                </article>
              ))}
            </div>
            <aside className="h-fit rounded-[24px] border border-[#EBCBD2] bg-white p-6">
              <h2 className="font-black text-[#2A1620]">Ringkasan keranjang</h2>
              <div className="mt-5 space-y-3 border-b border-[#EBCBD2] pb-5 text-sm">
                {cart.map((item) => (
                  <div key={item.variantId} className="flex justify-between gap-3">
                    <span className="text-[#6B7280]">{formatItemLine(item)} × {item.quantity}</span>
                    <strong className="shrink-0 text-[#2A1620]">{rupiah(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-[#6B7280]">Subtotal</span><strong>{rupiah(subtotal)}</strong></div>
                <div className="flex justify-between"><span className="text-[#6B7280]">Biaya pembayaran</span><strong>{rupiah(PAYMENT_FEE)}</strong></div>
                <div className="flex justify-between border-t border-[#EBCBD2] pt-4 text-lg"><strong>Total</strong><strong>{rupiah(grandTotal)}</strong></div>
              </div>
              <Button onClick={onCheckout} className="mt-6 h-12 w-full rounded-xl bg-[#2A1620] text-white">Checkout Semua <ArrowRight /></Button>
              <Button onClick={onContinueShopping} variant="outline" className="mt-3 h-11 w-full rounded-xl border-[#EBCBD2]">Lanjut Belanja</Button>
              <Button asChild variant="ghost" className="mt-2 h-10 w-full rounded-xl text-[#6c4653]"><a href={chatLink} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> Tanya penjual</a></Button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function Checkout({ cart, subtotal, grandTotal, values, setters, onBack, onSubmit, message, submitting }: {
  cart: CartItem[];
  subtotal: number;
  grandTotal: number;
  values: { buyerName: string; buyerWhatsapp: string; buyerEmail: string; needsInvoice: boolean; invoiceName: string; companyName: string };
  setters: { setBuyerName: (v: string) => void; setBuyerWhatsapp: (v: string) => void; setBuyerEmail: (v: string) => void; setNeedsInvoice: (v: boolean) => void; setInvoiceName: (v: string) => void; setCompanyName: (v: string) => void };
  onBack: () => void;
  onSubmit: () => void;
  message: string;
  submitting: boolean;
}) {
  return (
    <main className="min-h-screen bg-[#F8F0F1]">
      <MiniHeader label="Checkout" onBack={onBack} />
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-9 lg:grid-cols-[1fr_360px]">
        <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} className="rounded-[26px] border border-[#EBCBD2] bg-white p-6 sm:p-8">
          <h1 className="text-3xl font-black text-[#2A1620]">Data pembeli</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Checkout sekali untuk {cart.length} produk dalam keranjang.</p>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <Field label="Nama pembeli" value={values.buyerName} setValue={setters.setBuyerName} />
            <Field label="Nomor WhatsApp" value={values.buyerWhatsapp} setValue={setters.setBuyerWhatsapp} />
            <Field label="Email" value={values.buyerEmail} setValue={setters.setBuyerEmail} required={false} type="email" />
          </div>
          <label className="mt-6 flex cursor-pointer gap-3 rounded-2xl border border-[#EBCBD2] bg-[#FDF8F9] p-4">
            <Checkbox checked={values.needsInvoice} onCheckedChange={(value) => setters.setNeedsInvoice(value === true)} className="mt-1" />
            <span><strong className="block text-sm text-[#2A1620]">Butuh invoice untuk reimbursement</strong><small className="text-[#6B7280]">Tambahkan identitas resmi pada invoice.</small></span>
          </label>
          {values.needsInvoice && (
            <div className="mt-5 grid gap-5 rounded-2xl border border-dashed border-[#d8aeb8] p-5 sm:grid-cols-2">
              <Field label="Nama pada invoice" value={values.invoiceName} setValue={setters.setInvoiceName} required={false} />
              <Field label="Instansi / perusahaan" value={values.companyName} setValue={setters.setCompanyName} required={false} />
            </div>
          )}
          {message && <p className="mt-5 rounded-xl bg-[#fee2e2] p-3 text-sm font-semibold text-[#b91c1c]">{message}</p>}
          <Button disabled={submitting} type="submit" className="mt-7 h-12 rounded-xl bg-[#2A1620] px-7 text-white">{submitting ? "Membuat order..." : "Lanjut Pembayaran"} <ArrowRight /></Button>
        </form>
        <aside className="h-fit rounded-[24px] border border-[#EBCBD2] bg-white p-6">
          <h2 className="font-black text-[#2A1620]">Ringkasan pesanan</h2>
          <div className="mt-5 space-y-4 border-b border-[#EBCBD2] pb-5">
            {cart.map((item) => (
              <div key={item.variantId} className="flex gap-3">
                <ProductIcon
                    product={{
                      name: item.productName,
                      imageUrl: item.imageUrl,
                    }}
                    size="small"
                  />
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-[#2A1620]">{item.productName}</strong>
                  <p className="text-sm text-[#6B7280]">{cartVariantLabel(item)}</p>
                  <p className="mt-1 text-sm font-bold">{rupiah(item.price)} × {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><strong>{rupiah(subtotal)}</strong></div>
            <div className="flex justify-between"><span>Biaya pembayaran</span><strong>{rupiah(PAYMENT_FEE)}</strong></div>
            <div className="flex justify-between border-t border-[#EBCBD2] pt-4 text-lg"><strong>Total</strong><strong>{rupiah(grandTotal)}</strong></div>
          </div>
          <div className="mt-5 flex gap-3 rounded-2xl bg-[#F2D8DE] p-4 text-sm leading-5 text-[#714151]"><ShieldCheck className="mt-0.5 size-5 shrink-0" /> Satu invoice berisi semua item setelah pembayaran lunas.</div>
        </aside>
      </div>
    </main>
  );
}

function Payment({ items, order, paymentUrl, onBack, onCheck, onSimulate, message, submitting }: {
  items: OrderItem[];
  order: Order;
  paymentUrl: string;
  onBack: () => void;
  onCheck: () => void;
  onSimulate: () => void;
  message: string;
  submitting: boolean;
}) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  return (
    <main className="min-h-screen bg-[#F8F0F1]">
      <MiniHeader label="Pembayaran" onBack={onBack} />
      <div className="mx-auto max-w-2xl px-5 py-10">
        <div className="rounded-[28px] border border-[#EBCBD2] bg-white p-7 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff3d6] px-4 py-2 text-sm font-black text-[#a66600]"><Clock3 className="size-4" /> Menunggu pembayaran</span>
          <h1 className="mt-5 text-3xl font-black text-[#2A1620]">Selesaikan pembayaran</h1>
          <div className="mx-auto mt-6 grid size-44 place-items-center rounded-[22px] border-2 border-[#2A1620] bg-[#F8F0F1] shadow-[7px_7px_0_#E9B8C2]"><QrCode className="size-28 text-[#2A1620]" /></div>
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-[#FDF8F9] p-5 text-left">
            <p className="flex justify-between text-sm"><span>Order</span><strong>{order.orderNumber}</strong></p>
            <div className="mt-4 space-y-2 border-t border-[#EBCBD2] pt-4 text-sm">
              {items.map((item, index) => (
                <p key={`${item.productNameSnapshot}-${index}`} className="flex justify-between gap-3">
                  <span>{formatItemLine(item)} × {item.quantity}</span>
                  <strong>{rupiah(item.subtotal)}</strong>
                </p>
              ))}
              <p className="flex justify-between border-t border-[#EBCBD2] pt-3 text-base"><span>Total bayar</span><strong>{rupiah(order.total)}</strong></p>
            </div>
          </div>
          {paymentUrl && <Button asChild className="mt-6 h-12 rounded-xl bg-[#2A1620] px-7"><a href={paymentUrl} target="_blank" rel="noreferrer">Buka Pembayaran QRIS <ArrowRight /></a></Button>}
          <div className="mt-4 flex flex-col items-center gap-3">
            <Button disabled={submitting} onClick={onCheck} variant="outline" className="rounded-xl border-[#EBCBD2]">{submitting ? "Memeriksa..." : "Cek Status Pembayaran"}</Button>
            {isDevelopment && <Button disabled={submitting} onClick={onSimulate} className="rounded-xl bg-[#16A34A] text-white hover:bg-[#15803d]">{submitting ? "Memproses..." : "Simulasikan Pembayaran Berhasil"}</Button>}
          </div>
          {!paymentUrl && <p className="mt-4 text-xs text-[#6B7280]">QRIS belum tersedia. Status pembayaran hanya dapat dikonfirmasi oleh Admin.</p>}
          {message && <p className="mt-4 text-sm font-semibold text-[#9a6672]">{message}</p>}
        </div>
      </div>
    </main>
  );
}

function PaymentSuccess({ items, order, settings, onBack }: { items: OrderItem[]; order: Order; settings: Settings; onBack: () => void }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const invoicePath = `/invoice/${order.invoicePublicId}`;
  const invoiceUrl = `${origin}${invoicePath}`;
  const itemLines = items.map((item) => `${formatItemLine(item)} — ${rupiah(item.subtotal)}`).join("\n");
  const chatMessage = [
    "Halo kak, pembayaran saya sudah berhasil.",
    "",
    `Order: ${order.orderNumber}`,
    `Invoice: ${order.invoiceNumber}`,
    "",
    "Item:",
    itemLines,
    "",
    `Total: ${rupiah(order.total)}`,
    "Status: LUNAS",
    "",
    `Invoice:\n${invoiceUrl}`,
    "",
    "Mohon diproses ya kak.",
  ].join("\n");
  const processLink = whatsappUrl(settings.whatsappNumber, chatMessage);

  return (
    <main className="min-h-screen bg-[#F8F0F1]">
      <MiniHeader label="Pembayaran Berhasil" onBack={onBack} />
      <div className="mx-auto max-w-2xl px-5 py-10">
        <div className="rounded-[28px] border border-[#EBCBD2] bg-white p-7 sm:p-9">
          <div className="text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#dcfce7] text-[#16A34A]"><Check className="size-9 stroke-[3]" /></span>
            <h1 className="mt-5 text-3xl font-black text-[#2A1620]">Pembayaran Berhasil</h1>
            <p className="mt-2 text-sm text-[#6B7280]">Pembayaran telah diterima dan invoice sudah tersedia.</p>
          </div>
          <div className="mt-7 space-y-3 rounded-2xl bg-[#FDF8F9] p-5 text-sm">
            <p className="flex justify-between gap-4"><span>Nomor order</span><strong className="text-right">{order.orderNumber}</strong></p>
            <p className="flex justify-between gap-4"><span>Nomor invoice</span><strong className="text-right">{order.invoiceNumber}</strong></p>
            <div className="border-t border-[#EBCBD2] pt-3">
              <p className="mb-2 font-bold text-[#2A1620]">Item dibeli</p>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <p key={`${item.productNameSnapshot}-${index}`} className="flex justify-between gap-4">
                    <span>{formatItemLine(item)} × {item.quantity}</span>
                    <strong className="text-right">{rupiah(item.subtotal)}</strong>
                  </p>
                ))}
              </div>
            </div>
            <p className="flex justify-between gap-4 border-t border-[#EBCBD2] pt-3 text-base"><span>Total pembayaran</span><strong className="text-right">{rupiah(order.total)}</strong></p>
            <p className="flex justify-between gap-4"><span>Status</span><span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-black text-[#15803d]">LUNAS</span></p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Button asChild className="h-14 rounded-xl bg-[#16A34A] text-base font-black text-white hover:bg-[#15803d] sm:col-span-2"><a href={processLink} target="_blank" rel="noreferrer"><MessageCircle /> Kirim Bukti &amp; Proses via WhatsApp</a></Button>
            <Button asChild className="h-12 rounded-xl bg-[#2A1620] text-white"><a href={invoicePath} target="_blank" rel="noreferrer"><BadgeCheck /> Lihat Invoice</a></Button>
            <Button asChild variant="outline" className="h-12 rounded-xl border-[#EBCBD2]"><a href={`${invoicePath}?download=1`} target="_blank" rel="noreferrer"><Download /> Download Invoice PDF</a></Button>
            <Button asChild variant="outline" className="h-11 rounded-xl border-[#EBCBD2] sm:col-span-2"><a href={`${invoicePath}?print=1`} target="_blank" rel="noreferrer"><Printer /> Print Invoice</a></Button>
          </div>
        </div>
      </div>
    </main>
  );
}
