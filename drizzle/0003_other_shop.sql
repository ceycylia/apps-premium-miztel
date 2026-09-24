CREATE TABLE `other_shop_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`image_url` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);--> statement-breakpoint
CREATE INDEX `idx_other_shop_items_active_created` ON `other_shop_items` (`is_active`,`created_at`);--> statement-breakpoint
PRAGMA optimize;
