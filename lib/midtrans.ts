import { env } from "cloudflare:workers";

export type MidtransNotification = {
  order_id: string;
  transaction_id?: string;
  transaction_status: string;
  payment_type?: string;
  fraud_status?: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  settlement_time?: string;
};

function serverKey() {
  if (!env.MIDTRANS_SERVER_KEY) throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi");
  return env.MIDTRANS_SERVER_KEY;
}

export async function createSnapTransaction(payload: {
  orderId: string;
  grossAmount: number;
  itemName: string;
  customer: { firstName: string; email?: string; phone: string };
}) {
  const production = env.MIDTRANS_IS_PRODUCTION === "true";
  const endpoint = production ? "https://app.midtrans.com/snap/v1/transactions" : "https://app.sandbox.midtrans.com/snap/v1/transactions";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${btoa(`${serverKey()}:`)}` },
    body: JSON.stringify({
      transaction_details: { order_id: payload.orderId, gross_amount: payload.grossAmount },
      enabled_payments: ["qris"],
      item_details: [{ id: payload.orderId, price: payload.grossAmount, quantity: 1, name: payload.itemName.slice(0, 50) }],
      customer_details: { first_name: payload.customer.firstName, email: payload.customer.email, phone: payload.customer.phone },
    }),
  });
  if (!response.ok) throw new Error(`Midtrans menolak transaksi (${response.status})`);
  return response.json() as Promise<{ token: string; redirect_url: string }>;
}

export async function verifyMidtransSignature(notification: MidtransNotification) {
  const source = `${notification.order_id}${notification.status_code}${notification.gross_amount}${serverKey()}`;
  const digest = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(source));
  const expected = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return expected === notification.signature_key.toLowerCase();
}

export function isSuccessfulPayment(notification: MidtransNotification) {
  return notification.transaction_status === "settlement" || (notification.transaction_status === "capture" && notification.fraud_status === "accept");
}
