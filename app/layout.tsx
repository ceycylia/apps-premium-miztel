import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Rosebyte Digital — Produk Digital & Invoice Resmi", description: "Beli langganan digital, bayar via QRIS, dan unduh invoice resmi untuk reimbursement.", icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><body>{children}</body></html>; }
