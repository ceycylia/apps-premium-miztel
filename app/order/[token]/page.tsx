import OrderStatusClient from "./order-status-client";

export default async function OrderStatusPage({ params }: { params: Promise<{ token: string }> }) {
  return <OrderStatusClient token={(await params).token} />;
}
