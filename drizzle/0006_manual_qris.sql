ALTER TABLE `orders` ADD `public_order_token` text;
--> statement-breakpoint
UPDATE `orders` SET `public_order_token` = lower(hex(randomblob(16))) WHERE `public_order_token` IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_orders_public_order_token` ON `orders` (`public_order_token`);
--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_confirmation_method` text;
--> statement-breakpoint
ALTER TABLE `orders` ADD `confirmed_by_admin` integer;
--> statement-breakpoint
ALTER TABLE `store_settings` ADD `qris_image_url` text;
--> statement-breakpoint
ALTER TABLE `store_settings` ADD `qris_account_name` text;
--> statement-breakpoint
ALTER TABLE `store_settings` ADD `payment_instruction` text DEFAULT 'Scan QRIS di atas dan lakukan pembayaran sesuai total pesanan.' NOT NULL;
