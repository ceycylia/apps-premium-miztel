import PublicInvoiceClient from "./public-invoice-client";

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  return <PublicInvoiceClient token={(await params).token} />;
}
