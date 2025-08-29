-- Drop all old tables
DROP TABLE IF EXISTS chain_forks;
DROP TABLE IF EXISTS nodes;
DROP TABLE IF EXISTS mining_stats;
DROP TABLE IF EXISTS interactions;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS blocks;

-- Create new tables for STARS cryptocurrency

-- Wallets table
CREATE TABLE wallets (
  address TEXT PRIMARY KEY,
  balance TEXT NOT NULL DEFAULT '0',
  nonce INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_wallet_balance ON wallets(balance);

-- Blocks table
CREATE TABLE blocks (
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
CREATE INDEX idx_block_hash ON blocks(hash);
CREATE INDEX idx_block_height ON blocks(height);

-- Transactions table
CREATE TABLE transactions (
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
CREATE INDEX idx_tx_from ON transactions(from_address);
CREATE INDEX idx_tx_to ON transactions(to_address);
CREATE INDEX idx_tx_block ON transactions(block_height);
CREATE INDEX idx_tx_status ON transactions(status);

-- Mempool table
CREATE TABLE mempool (
  tx_hash TEXT PRIMARY KEY,
  raw_tx TEXT NOT NULL,
  priority INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_mempool_priority ON mempool(priority);

-- Mining jobs table
CREATE TABLE mining_jobs (
  job_id TEXT PRIMARY KEY,
  block_template TEXT NOT NULL,
  target TEXT NOT NULL,
  miner_address TEXT,
  started_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_job_expires ON mining_jobs(expires_at);
CREATE INDEX idx_job_miner ON mining_jobs(miner_address);

-- Bot configuration table
CREATE TABLE bot_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  mnemonic TEXT NOT NULL,
  address TEXT NOT NULL,
  private_key TEXT NOT NULL,
  last_tx_at INTEGER,
  tx_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Chain state table
CREATE TABLE chain_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  latest_height INTEGER NOT NULL DEFAULT 0,
  latest_hash TEXT NOT NULL,
  total_supply TEXT NOT NULL DEFAULT '0',
  current_difficulty INTEGER NOT NULL DEFAULT 4,
  next_difficulty_adjust INTEGER NOT NULL DEFAULT 10,
  average_block_time INTEGER DEFAULT 5000,
  updated_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
);