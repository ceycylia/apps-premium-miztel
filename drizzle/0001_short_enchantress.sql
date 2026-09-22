CREATE TABLE `admin_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`admin_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_admin_sessions_token_hash` ON `admin_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_admin_sessions_admin_id` ON `admin_sessions` (`admin_id`);--> statement-breakpoint
CREATE TABLE `password_reset_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`admin_id` integer NOT NULL,
	`code_hash` text NOT NULL,
	`code_salt` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_password_reset_admin_expiry` ON `password_reset_codes` (`admin_id`,`expires_at`);--> statement-breakpoint
ALTER TABLE `store_settings` ADD `whatsapp_number` text DEFAULT '' NOT NULL;--> statement-breakpoint
PRAGMA optimize;
