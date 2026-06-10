-- Schema exported from the production D1 database (starslab-db) so that
-- fresh local environments match production exactly. Production has this
-- migration recorded as applied, so rewriting its content never replays
-- there; IF NOT EXISTS guards keep it idempotent everywhere else.
CREATE TABLE IF NOT EXISTS blocks (
  height INTEGER PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
  previous_hash TEXT NOT NULL,
  merkle_root TEXT,
  timestamp INTEGER NOT NULL,
  difficulty INTEGER NOT NULL,
  nonce TEXT NOT NULL,
  miner_address TEXT NOT NULL,
  reward TEXT NOT NULL,
  tx_count INTEGER NOT NULL DEFAULT 0,
  gas_used TEXT DEFAULT '0',
  created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS transactions (
  hash TEXT PRIMARY KEY,
  block_height INTEGER REFERENCES blocks(height),
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  value TEXT NOT NULL,
  gas_limit INTEGER NOT NULL DEFAULT 21000,
  gas_price TEXT NOT NULL DEFAULT '1',
  gas_used INTEGER DEFAULT 21000,
  nonce INTEGER NOT NULL,
  signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS wallets (
  address TEXT PRIMARY KEY,
  balance TEXT NOT NULL DEFAULT '0',
  nonce INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS mempool (
  tx_hash TEXT PRIMARY KEY,
  raw_tx TEXT NOT NULL,
  priority INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS mining_jobs (
  job_id TEXT PRIMARY KEY,
  block_template TEXT NOT NULL,
  target TEXT NOT NULL,
  miner_address TEXT,
  started_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS bot_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  mnemonic TEXT NOT NULL,
  address TEXT NOT NULL,
  private_key TEXT NOT NULL,
  last_tx_at INTEGER,
  tx_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS chain_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  latest_height INTEGER NOT NULL DEFAULT 0,
  latest_hash TEXT NOT NULL,
  total_supply TEXT NOT NULL DEFAULT '0',
  current_difficulty INTEGER NOT NULL DEFAULT 4,
  next_difficulty_adjust INTEGER NOT NULL DEFAULT 10,
  average_block_time INTEGER DEFAULT 5000,
  updated_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_block_hash ON blocks(hash);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_block_height ON blocks(height);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_job_expires ON mining_jobs(expires_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_job_miner ON mining_jobs(miner_address);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_mempool_priority ON mempool(priority);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tx_block ON transactions(block_height);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tx_from ON transactions(from_address);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tx_to ON transactions(to_address);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_wallet_balance ON wallets(balance);
