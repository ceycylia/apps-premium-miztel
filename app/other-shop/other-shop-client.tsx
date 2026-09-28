"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- Native home links work reliably in the current vinext runtime. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImageIcon, MessageCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseJson } from "@/lib/client-json";

type OtherShopItem = { id: number; title: string; imageUrl: string };
type Settings = { storeName?: string; whatsappNumber?: string; whatsappChannelUrl?: string };

function whatsappUrl(number: string, title: string) {
  const digits = number.replace(/\D/g, "").replace(/^0/, "62");
  const message = `Halo kak, saya ingin memesan produk dari Other Shop ini: ${title}`;
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : "#";
}

export default function OtherShopClient() {
  const [items, setItems] = useState<OtherShopItem[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [preview, setPreview] = useState<OtherShopItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/other-shop").then((response) => parseJson<{ items: OtherShopItem[] }>(response)),
      fetch("/api/settings").then((response) => parseJson<{ settings: Settings }>(response)),
    ]).then(([catalog, store]) => {
      if (catalog.error) throw new Error(catalog.error);
      setItems(catalog.items ?? []);
      setSettings(store.settings ?? {});
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "Katalog sedang tidak tersedia"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F8F0F1] text-[#22304A]">
      <header className="border-b border-[#EBCBD2] bg-white">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-8">
          <Button asChild variant="ghost" className="-ml-3 shrink-0 rounded-xl text-[#2A1620]"><a href="/"><ArrowLeft /> <span className="hidden min-[360px]:inline">Kembali</span></a></Button>
          <Link href="/" className="min-w-0 text-center"><strong className="block truncate text-[#2A1620]">Miztel Digital</strong><span className="text-xs font-bold tracking-[.14em] text-[#a66a78]">OTHER SHOP</span></Link>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F2D8DE]"><ShoppingBag className="size-5 text-[#8d5060]" /></span>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12 lg:px-8">
        <div className="rounded-[26px] border border-[#EBCBD2] bg-white p-5 shadow-[0_18px_60px_rgba(87,38,57,.06)] sm:p-8">
          <span className="inline-flex rounded-full bg-[#F2D8DE] px-4 py-2 text-xs font-black uppercase tracking-[.16em] text-[#8d5060]">Katalog Visual</span>
          <h1 className="mt-5 break-words text-3xl font-black tracking-[-.035em] text-[#2A1620] sm:text-4xl">Other Shop</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B7280] sm:text-base">Lihat poster makanan, minuman, tiket, dan promo lainnya. Semua pemesanan dilakukan langsung melalui WhatsApp.</p>
        </div>

        {error && <p className="mt-6 rounded-xl bg-[#fee2e2] p-4 text-sm font-semibold text-[#b91c1c]">{error}</p>}
        {loading ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="aspect-[4/5] animate-pulse rounded-[24px] border border-[#EBCBD2] bg-white" />)}</div>
        ) : items.length ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="min-w-0 overflow-hidden rounded-[24px] border border-[#EBCBD2] bg-white shadow-[0_8px_30px_rgba(87,38,57,.05)]">
                <button type="button" onClick={() => setPreview(item)} className="block w-full overflow-hidden bg-[#F2D8DE] text-left" aria-label={`Perbesar poster ${item.title}`}>
                  <img src={item.imageUrl} alt={item.title} className="aspect-[4/5] w-full object-cover transition duration-300 hover:scale-[1.02]" />
                </button>
                <div className="p-5">
                  <h2 className="break-words text-lg font-black text-[#2A1620]">{item.title}</h2>
                  <Button asChild className="mt-4 h-auto min-h-11 w-full whitespace-normal rounded-xl bg-[#16A34A] px-4 py-3 text-white hover:bg-[#15803d]"><a href={whatsappUrl(settings.whatsappNumber ?? "", item.title)} target="_blank" rel="noreferrer"><MessageCircle /> Pesan via WhatsApp</a></Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-[24px] border border-dashed border-[#d8aeb8] bg-white p-8 text-center sm:p-12"><ImageIcon className="mx-auto size-10 text-[#b57b88]" /><p className="mt-4 font-bold text-[#2A1620]">Belum ada promo aktif.</p><p className="mt-1 text-sm text-[#6B7280]">Poster yang diaktifkan admin akan muncul di sini.</p></div>
        )}
      </section>

      <footer className="bg-[#2A1620] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-5 md:flex-row md:items-center md:justify-between lg:px-8">
          <div><strong>Miztel Digital</strong><p className="mt-1 text-sm text-[#d8bdc5]">Gabung ke Channel WhatsApp untuk promo &amp; update terbaru.</p></div>
          <Button asChild className="w-full rounded-xl bg-white text-[#2A1620] hover:bg-[#F2D8DE] sm:w-auto"><a href={settings.whatsappChannelUrl || "#"} target="_blank" rel="noreferrer"><MessageCircle /> Gabung Channel WhatsApp</a></Button>
        </div>
      </footer>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-h-[92vh] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-[22px] border-[#EBCBD2] bg-white p-4 sm:max-w-4xl sm:p-6">
          {preview && <><DialogHeader><DialogTitle className="break-words pr-8 text-xl font-black text-[#2A1620]">{preview.title}</DialogTitle><DialogDescription>Preview poster Other Shop</DialogDescription></DialogHeader><img src={preview.imageUrl} alt={preview.title} className="mx-auto mt-2 max-h-[68vh] w-auto rounded-2xl object-contain" /><Button asChild className="mt-2 h-auto min-h-12 w-full whitespace-normal rounded-xl bg-[#16A34A] px-4 py-3 text-white hover:bg-[#15803d]"><a href={whatsappUrl(settings.whatsappNumber ?? "", preview.title)} target="_blank" rel="noreferrer"><MessageCircle /> Pesan via WhatsApp</a></Button></>}
        </DialogContent>
      </Dialog>
    </main>
  );
}
