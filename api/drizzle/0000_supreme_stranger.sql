CREATE TABLE `blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hash` text NOT NULL,
	`previous_hash` text NOT NULL,
	`height` integer NOT NULL,
	`chain_id` text NOT NULL,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`transaction_count` integer DEFAULT 0 NOT NULL,
	`miner_address` text,
	`difficulty` real,
	`nonce` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chain_forks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fork_id` text NOT NULL,
	`parent_chain_id` text NOT NULL,
	`fork_height` integer NOT NULL,
	`is_main_chain` integer DEFAULT false NOT NULL,
	`total_blocks` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`resolved_at` integer
);
--> statement-breakpoint
CREATE TABLE `interactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`type` text NOT NULL,
	`data` text,
	`position_x` real,
	`position_y` real,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mining_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`speed_multiplier` real DEFAULT 1 NOT NULL,
	`blocks_mined_count` integer DEFAULT 0 NOT NULL,
	`total_clicks` integer DEFAULT 0 NOT NULL,
	`average_mining_time` real,
	`peak_speed_multiplier` real DEFAULT 1 NOT NULL,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nodes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`node_id` text NOT NULL,
	`type` text NOT NULL,
	`address` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_seen` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`consensus_participation` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hash` text NOT NULL,
	`block_hash` text,
	`from_address` text NOT NULL,
	`to_address` text NOT NULL,
	`value` real NOT NULL,
	`fee` real,
	`status` text DEFAULT 'pending' NOT NULL,
	`user_created` integer DEFAULT false,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`block_hash`) REFERENCES `blocks`(`hash`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blocks_hash_unique` ON `blocks` (`hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `chain_forks_fork_id_unique` ON `chain_forks` (`fork_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `nodes_node_id_unique` ON `nodes` (`node_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_hash_unique` ON `transactions` (`hash`);