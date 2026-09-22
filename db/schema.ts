import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("idx_admins_email").on(table.email)]);

export const adminSessions = sqliteTable("admin_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adminId: integer("admin_id").notNull().references(() => admins.id),
  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("idx_admin_sessions_token_hash").on(table.tokenHash), index("idx_admin_sessions_admin_id").on(table.adminId)]);

export const passwordResetCodes = sqliteTable("password_reset_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adminId: integer("admin_id").notNull().references(() => admins.id),
  codeHash: text("code_hash").notNull(),
  codeSalt: text("code_salt").notNull(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  attempts: integer("attempts").notNull().default(0),
  ...timestamps,
}, (table) => [index("idx_password_reset_admin_expiry").on(table.adminId, table.expiresAt)]);

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
}, (table) => [uniqueIndex("idx_products_slug").on(table.slug), index("idx_products_active_category").on(table.isActive, table.category)]);

export const productVariants = sqliteTable("product_variants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  variantName: text("variant_name").notNull(),
  durationLabel: text("duration_label").notNull(),
  price: integer("price").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
}, (table) => [index("idx_product_variants_product_active").on(table.productId, table.isActive)]);

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  buyerName: text("buyer_name").notNull(),
  buyerWhatsapp: text("buyer_whatsapp").notNull(),
  buyerEmail: text("buyer_email"),
  needsInvoice: integer("needs_invoice", { mode: "boolean" }).notNull().default(false),
  invoiceName: text("invoice_name"),
  companyName: text("company_name"),
  subtotal: integer("subtotal").notNull(),
  paymentFee: integer("payment_fee").notNull().default(0),
  total: integer("total").notNull(),
  paymentMethod: text("payment_method").notNull().default("manual"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  orderStatus: text("order_status").notNull().default("menunggu_pembayaran"),
  paidAt: text("paid_at"),
  ...timestamps,
}, (table) => [uniqueIndex("idx_orders_order_number").on(table.orderNumber), uniqueIndex("idx_orders_invoice_number").on(table.invoiceNumber), index("idx_orders_payment_status_created").on(table.paymentStatus, table.createdAt), index("idx_orders_order_status_created").on(table.orderStatus, table.createdAt)]);

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  productVariantId: integer("product_variant_id").notNull().references(() => productVariants.id),
  productNameSnapshot: text("product_name_snapshot").notNull(),
  variantNameSnapshot: text("variant_name_snapshot").notNull(),
  priceSnapshot: integer("price_snapshot").notNull(),
  quantity: integer("quantity").notNull().default(1),
  subtotal: integer("subtotal").notNull(),
}, (table) => [index("idx_order_items_order_id").on(table.orderId)]);

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  provider: text("provider").notNull().default("manual"),
  transactionId: text("transaction_id"),
  paymentType: text("payment_type"),
  grossAmount: integer("gross_amount").notNull(),
  feeAmount: integer("fee_amount").notNull().default(0),
  paymentStatus: text("payment_status").notNull().default("pending"),
  rawResponse: text("raw_response", { mode: "json" }),
  paidAt: text("paid_at"),
  ...timestamps,
}, (table) => [index("idx_payments_order_id").on(table.orderId), uniqueIndex("idx_payments_provider_transaction").on(table.provider, table.transactionId)]);

export const storeSettings = sqliteTable("store_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  storeName: text("store_name").notNull(),
  storeLogo: text("store_logo"),
  storeAddress: text("store_address"),
  storePhone: text("store_phone"),
  whatsappNumber: text("whatsapp_number").notNull().default(""),
  storeEmail: text("store_email"),
  invoiceNote: text("invoice_note").notNull().default("Dokumen ini merupakan bukti pembelian yang sah"),
  ...timestamps,
});
