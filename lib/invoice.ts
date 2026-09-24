export function createInvoicePublicId() {
  return crypto.randomUUID().replaceAll("-", "");
}
