ALTER TABLE `orders` ADD `invoice_public_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_orders_invoice_public_id` ON `orders` (`invoice_public_id`);--> statement-breakpoint
PRAGMA optimize;
