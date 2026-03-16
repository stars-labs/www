import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Blockchain blocks table — matches actual D1 schema
export const blocks = sqliteTable('blocks', {
  height: integer('height').primaryKey(),
  hash: text('hash').notNull(),
  previousHash: text('previous_hash').notNull(),
  merkleRoot: text('merkle_root'),
  timestamp: integer('timestamp').notNull(),
  difficulty: integer('difficulty').notNull(),
  nonce: text('nonce').notNull(),
  minerAddress: text('miner_address').notNull(),
  reward: text('reward').notNull(),
  txCount: integer('tx_count').notNull().default(0),
  gasUsed: text('gas_used'),
  createdAt: integer('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Transactions table — matches actual D1 schema
export const transactions = sqliteTable('transactions', {
  hash: text('hash').primaryKey(),
  blockHeight: integer('block_height'),
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address').notNull(),
  value: text('value').notNull(),
  gasLimit: integer('gas_limit').notNull().default(21000),
  gasPrice: text('gas_price').notNull().default('1'),
  gasUsed: integer('gas_used').default(21000),
  nonce: integer('nonce').notNull(),
  signature: text('signature'),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Wallets table
export const wallets = sqliteTable('wallets', {
  address: text('address').primaryKey(),
  balance: text('balance').notNull(),
  nonce: integer('nonce').notNull(),
  createdAt: integer('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Mempool table
export const mempool = sqliteTable('mempool', {
  txHash: text('tx_hash').primaryKey(),
  rawTx: text('raw_tx').notNull(),
  priority: integer('priority'),
  createdAt: integer('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Mining jobs table
export const miningJobs = sqliteTable('mining_jobs', {
  jobId: text('job_id').primaryKey(),
  blockTemplate: text('block_template').notNull(),
  target: text('target').notNull(),
  minerAddress: text('miner_address'),
  startedAt: integer('started_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
  completed: integer('completed').notNull()
});

// Bot config table
export const botConfig = sqliteTable('bot_config', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  mnemonic: text('mnemonic'),
  address: text('address'),
  privateKey: text('private_key'),
  lastTxAt: integer('last_tx_at'),
  txCount: integer('tx_count'),
  createdAt: integer('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Chain state table
export const chainState = sqliteTable('chain_state', {
  id: integer('id').primaryKey(),
  latestHeight: integer('latest_height'),
  latestHash: text('latest_hash'),
  totalSupply: text('total_supply'),
  currentDifficulty: integer('current_difficulty'),
  nextDifficultyAdjust: integer('next_difficulty_adjust'),
  averageBlockTime: integer('average_block_time'),
  updatedAt: integer('updated_at')
});

// Types for TypeScript
export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Wallet = typeof wallets.$inferSelect;
export type ChainState = typeof chainState.$inferSelect;
