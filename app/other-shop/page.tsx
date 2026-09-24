import type { Metadata } from "next";
import OtherShopClient from "./other-shop-client";

export const metadata: Metadata = {
  title: "Other Shop — Miztel Digital",
  description: "Katalog promo Other Shop Miztel Digital. Pemesanan langsung melalui WhatsApp.",
};

export default function OtherShopPage() {
  return <OtherShopClient />;
}
