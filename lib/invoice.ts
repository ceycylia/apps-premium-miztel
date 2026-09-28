export function createInvoicePublicId() {
  return crypto.randomUUID().replaceAll("-", "");
}

export function createOrderPublicToken() {
  return crypto.randomUUID().replaceAll("-", "");
}
