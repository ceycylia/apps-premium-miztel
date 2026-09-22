import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Miztel Digital — Produk Digital & Invoice Resmi", description: "Bayar produk digital melalui web saat membutuhkan struk atau invoice resmi.", icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><body>{children}</body></html>; }
