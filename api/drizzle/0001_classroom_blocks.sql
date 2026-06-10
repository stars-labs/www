-- Classroom blocks: student-mined blocks from the homepage visualization.
-- Separate from `blocks` (the bot-maintained chain) by design.
CREATE TABLE IF NOT EXISTS classroom_blocks (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hash` text NOT NULL,
	`previous_hash` text NOT NULL,
	`height` integer NOT NULL,
	`chain_id` text DEFAULT 'classroom' NOT NULL,
	`tx_count` integer DEFAULT 0 NOT NULL,
	`miner_address` text,
	`session_id` text,
	`difficulty` integer,
	`nonce` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_classroom_blocks_id ON classroom_blocks(id);
