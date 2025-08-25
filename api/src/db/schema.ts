import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Blockchain blocks table
export const blocks = sqliteTable('blocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  hash: text('hash').notNull().unique(),
  previousHash: text('previous_hash').notNull(),
  height: integer('height').notNull(),
  chainId: text('chain_id').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  transactionCount: integer('transaction_count').notNull().default(0),
  minerAddress: text('miner_address'),
  difficulty: real('difficulty'),
  nonce: integer('nonce'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Transactions table
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  hash: text('hash').notNull().unique(),
  blockHash: text('block_hash').references(() => blocks.hash),
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address').notNull(),
  value: real('value').notNull(),
  fee: real('fee'),
  status: text('status', { enum: ['pending', 'confirmed', 'failed'] }).notNull().default('pending'),
  userCreated: integer('user_created', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// User interactions table (for analytics)
export const interactions = sqliteTable('interactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),
  type: text('type', { enum: ['click', 'transaction', 'mining_boost'] }).notNull(),
  data: text('data'), // JSON string for additional data
  positionX: real('position_x'),
  positionY: real('position_y'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Mining statistics table
export const miningStats = sqliteTable('mining_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),
  speedMultiplier: real('speed_multiplier').notNull().default(1),
  blocksMinedCount: integer('blocks_mined_count').notNull().default(0),
  totalClicks: integer('total_clicks').notNull().default(0),
  averageMiningTime: real('average_mining_time'),
  peakSpeedMultiplier: real('peak_speed_multiplier').notNull().default(1),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Network nodes table
export const nodes = sqliteTable('nodes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nodeId: text('node_id').notNull().unique(),
  type: text('type', { enum: ['validator', 'miner', 'peer', 'smart-contract'] }).notNull(),
  address: text('address').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastSeen: integer('last_seen', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  consensusParticipation: integer('consensus_participation').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Chain forks table
export const chainForks = sqliteTable('chain_forks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  forkId: text('fork_id').notNull().unique(),
  parentChainId: text('parent_chain_id').notNull(),
  forkHeight: integer('fork_height').notNull(),
  isMainChain: integer('is_main_chain', { mode: 'boolean' }).notNull().default(false),
  totalBlocks: integer('total_blocks').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' })
});

// Types for TypeScript
export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Interaction = typeof interactions.$inferSelect;
export type NewInteraction = typeof interactions.$inferInsert;
export type MiningStats = typeof miningStats.$inferSelect;
export type NewMiningStats = typeof miningStats.$inferInsert;
export type Node = typeof nodes.$inferSelect;
export type NewNode = typeof nodes.$inferInsert;
export type ChainFork = typeof chainForks.$inferSelect;
export type NewChainFork = typeof chainForks.$inferInsert;