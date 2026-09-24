"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type OtherShopItem = { id: number; title: string; imageUrl: string; isActive: boolean };
const inputClass = "h-11 w-full rounded-xl border border-[#EBCBD2] bg-white px-4 outline-none focus:border-[#bd7184] focus:ring-4 focus:ring-[#F2D8DE]";

async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Permintaan gagal");
  return data;
}

function Status({ active }: { active: boolean }) {
  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${active ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#F2D8DE] text-[#8d5060]"}`}>{active ? "aktif" : "nonaktif"}</span>;
}

export function OtherShopPanel({ items, onCreate, onEdit, onUpdated }: { items: OtherShopItem[]; onCreate: () => void; onEdit: (item: OtherShopItem) => void; onUpdated: () => Promise<void> }) {
  async function toggle(item: OtherShopItem) {
    await requestJson(`/api/admin/other-shop/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, isActive: !item.isActive }) });
    await onUpdated();
  }
  async function remove(item: OtherShopItem) {
    if (!window.confirm(`Hapus item Other Shop “${item.title}”?`)) return;
    await requestJson(`/api/admin/other-shop/${item.id}`, { method: "DELETE" });
    await onUpdated();
  }
  return <section className="min-w-0"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-black text-[#2A1620]">Other Shop</h2><p className="mt-1 text-sm text-[#6B7280]">Kelola poster promo yang dipesan langsung melalui WhatsApp.</p></div><Button onClick={onCreate} className="w-full rounded-xl bg-[#2A1620] sm:w-auto"><Plus /> Tambah Item</Button></div><div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="min-w-0 overflow-hidden rounded-[22px] border border-[#EBCBD2] bg-white"><img src={item.imageUrl} alt={item.title} className="aspect-[4/5] w-full bg-[#F2D8DE] object-cover" /><div className="p-5"><div className="flex min-w-0 items-start justify-between gap-3"><strong className="min-w-0 break-words text-[#2A1620]">{item.title}</strong><Status active={item.isActive} /></div><div className="mt-5 grid gap-2 min-[390px]:grid-cols-2"><Button size="sm" variant="outline" onClick={() => onEdit(item)} className="border-[#EBCBD2]"><Pencil /> Edit</Button><Button size="sm" variant="outline" onClick={() => void toggle(item)} className="border-[#EBCBD2]">{item.isActive ? "Nonaktifkan" : "Aktifkan"}</Button><Button size="sm" variant="outline" onClick={() => void remove(item)} className="border-red-200 text-red-600 min-[390px]:col-span-2"><Trash2 /> Hapus</Button></div></div></article>)}</div>{!items.length && <p className="mt-6 rounded-2xl border border-dashed border-[#EBCBD2] bg-white p-8 text-center text-sm text-[#6B7280] sm:p-10">Belum ada item Other Shop. Klik “Tambah Item”.</p>}</section>;
}

export function OtherShopDialog({ open, item, onOpenChange, onSaved }: { open: boolean; item: OtherShopItem | null; onOpenChange: (open: boolean) => void; onSaved: () => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (!open) return; setTitle(item?.title ?? ""); setImageUrl(item?.imageUrl ?? ""); setIsActive(item?.isActive ?? true); setError(""); }, [open, item]);
  async function upload(file: File) { const form = new FormData(); form.append("file", file); const data = await requestJson("/api/admin/uploads", { method: "POST", body: form }); setImageUrl(data.url); }
  async function save(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { await requestJson(item ? `/api/admin/other-shop/${item.id}` : "/api/admin/other-shop", { method: item ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, imageUrl, isActive }) }); await onSaved(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Item gagal disimpan"); } finally { setBusy(false); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-[22px] border-[#EBCBD2] bg-white"><DialogHeader><DialogTitle className="break-words pr-6 text-2xl font-black text-[#2A1620]">{item ? "Edit Other Shop" : "Tambah Other Shop"}</DialogTitle><DialogDescription>Judul internal dan poster yang akan tampil di katalog.</DialogDescription></DialogHeader><form onSubmit={save} className="mt-3 min-w-0 space-y-5"><label className="block"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Foto / poster</span><div className="grid min-w-0 gap-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">{imageUrl ? <img src={imageUrl} alt="Preview poster" className="aspect-[4/5] w-full max-w-[120px] rounded-2xl object-cover ring-1 ring-[#EBCBD2]" /> : <span className="grid aspect-[4/5] w-[120px] place-items-center rounded-2xl bg-[#F2D8DE]"><ImagePlus className="text-[#8d5060]" /></span>}<input required={!imageUrl} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file).catch((reason) => setError(reason.message)); }} className="min-w-0 max-w-full text-sm" /></div></label><label className="block"><span className="mb-2 block text-sm font-bold text-[#2A1620]">Judul / nama internal</span><input required value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} /></label><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#EBCBD2] bg-[#FDF8F9] p-4"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="size-4 accent-[#2A1620]" /><span className="text-sm font-bold text-[#2A1620]">Aktif dan tampil di Other Shop</span></label>{error && <p className="break-words rounded-xl bg-[#fee2e2] p-3 text-sm font-semibold text-[#b91c1c]">{error}</p>}<Button disabled={busy || !imageUrl} type="submit" className="h-auto min-h-12 w-full whitespace-normal rounded-xl bg-[#2A1620] py-3"><Save /> {busy ? "Menyimpan..." : "Simpan Item"}</Button></form></DialogContent></Dialog>;
}
