CREATE TABLE `login_attempts` (
	`id` varchar(64) NOT NULL,
	`attempts` int NOT NULL,
	`reset_at` varchar(32) NOT NULL,
	CONSTRAINT `login_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` varchar(64) NOT NULL,
	`content_type` varchar(32) NOT NULL,
	`body` mediumblob NOT NULL,
	CONSTRAINT `media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` varchar(36) NOT NULL,
	`body` longtext NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'draft',
	`version` int NOT NULL DEFAULT 1,
	`updated_at` varchar(32) NOT NULL,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_sessions` (
	`token_hash` varchar(64) NOT NULL,
	`email` varchar(254) NOT NULL,
	`credential_version` varchar(64) NOT NULL,
	`expires_at` varchar(32) NOT NULL,
	CONSTRAINT `admin_sessions_token_hash` PRIMARY KEY(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `site_content` (
	`id` int NOT NULL,
	`body` longtext NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`updated_at` varchar(32) NOT NULL,
	CONSTRAINT `site_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_players_status` ON `players` (`status`);