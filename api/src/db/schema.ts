import { sqliteTable, text, integer, real, index, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Wallets table - stores account balances
export const wallets = sqliteTable('wallets', {
  address: text('address').primaryKey(), // Ethereum-style address (0x...)
  balance: text('balance').notNull().default('0'), // Balance in starshars (string for precision)
  nonce: integer('nonce').notNull().default(0), // Transaction count for replay protection
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  balanceIdx: index('idx_wallet_balance').on(table.balance),
}));

// Blocks table - the blockchain
export const blocks = sqliteTable('blocks', {
  height: integer('height').primaryKey(), // Block number
  hash: text('hash').notNull().unique(), // Block hash
  previousHash: text('previous_hash').notNull(), // Previous block hash
  merkleRoot: text('merkle_root'), // Merkle root of transactions
  timestamp: integer('timestamp').notNull(), // Unix timestamp
  difficulty: integer('difficulty').notNull(), // Mining difficulty
  nonce: text('nonce').notNull(), // Mining nonce (large number as string)
  minerAddress: text('miner_address').notNull(), // Miner's wallet address
  reward: text('reward').notNull(), // Block reward in starshars
  txCount: integer('tx_count').notNull().default(0), // Number of transactions
  gasUsed: text('gas_used').default('0'), // Total gas used in block
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  hashIdx: index('idx_block_hash').on(table.hash),
  heightIdx: index('idx_block_height').on(table.height),
}));

// Transactions table - all transactions
export const transactions = sqliteTable('transactions', {
  hash: text('hash').primaryKey(), // Transaction hash
  blockHeight: integer('block_height').references(() => blocks.height), // Block containing this tx
  fromAddress: text('from_address').notNull(), // Sender address
  toAddress: text('to_address').notNull(), // Recipient address
  value: text('value').notNull(), // Amount in starshars
  gasLimit: integer('gas_limit').notNull().default(21000), // Gas limit
  gasPrice: text('gas_price').notNull().default('1'), // Gas price in starshars
  gasUsed: integer('gas_used').default(21000), // Actual gas used
  nonce: integer('nonce').notNull(), // Sender's nonce
  signature: text('signature'), // Transaction signature
  status: text('status', { enum: ['pending', 'confirmed', 'failed'] }).notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  fromIdx: index('idx_tx_from').on(table.fromAddress),
  toIdx: index('idx_tx_to').on(table.toAddress),
  blockIdx: index('idx_tx_block').on(table.blockHeight),
  statusIdx: index('idx_tx_status').on(table.status),
}));

// Mempool - pending transactions
export const mempool = sqliteTable('mempool', {
  txHash: text('tx_hash').primaryKey(), // Transaction hash
  rawTx: text('raw_tx').notNull(), // Raw transaction JSON
  priority: integer('priority').notNull(), // Priority based on gas price
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  priorityIdx: index('idx_mempool_priority').on(table.priority),
}));

// Mining jobs - active mining challenges
export const miningJobs = sqliteTable('mining_jobs', {
  jobId: text('job_id').primaryKey(), // Unique job ID
  blockTemplate: text('block_template').notNull(), // JSON block template
  target: text('target').notNull(), // Difficulty target (hex)
  minerAddress: text('miner_address'), // Address requesting the job
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(), // Job expiration
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false)
}, (table) => ({
  expiresIdx: index('idx_job_expires').on(table.expiresAt),
  minerIdx: index('idx_job_miner').on(table.minerAddress),
}));

// Bot configuration - stores bot wallet (only one row)
export const botConfig = sqliteTable('bot_config', {
  id: integer('id').primaryKey().default(1), // Always 1
  mnemonic: text('mnemonic').notNull(), // Encrypted mnemonic phrase
  address: text('address').notNull(), // Bot's wallet address
  privateKey: text('private_key').notNull(), // Encrypted private key
  lastTxAt: integer('last_tx_at', { mode: 'timestamp' }), // Last transaction time
  txCount: integer('tx_count').notNull().default(0), // Total transactions sent
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Chain state - global blockchain state
export const chainState = sqliteTable('chain_state', {
  id: integer('id').primaryKey().default(1), // Always 1
  latestHeight: integer('latest_height').notNull().default(0),
  latestHash: text('latest_hash').notNull(),
  totalSupply: text('total_supply').notNull().default('0'), // Total STARS in circulation
  currentDifficulty: integer('current_difficulty').notNull().default(4), // Current mining difficulty
  nextDifficultyAdjust: integer('next_difficulty_adjust').notNull().default(10), // Block height for next adjustment
  averageBlockTime: integer('average_block_time').default(5000), // Average time in ms
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Types for TypeScript
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type MempoolEntry = typeof mempool.$inferSelect;
export type NewMempoolEntry = typeof mempool.$inferInsert;
export type MiningJob = typeof miningJobs.$inferSelect;
export type NewMiningJob = typeof miningJobs.$inferInsert;
export type BotConfig = typeof botConfig.$inferSelect;
export type ChainState = typeof chainState.$inferSelect;

// Helper constants
export const STARS_DECIMALS = 10; // 1 STARS = 10^10 starshars
export const STARS_TO_STARSHARS = BigInt(10 ** STARS_DECIMALS);
export const MINING_REWARD = (1n * STARS_TO_STARSHARS).toString(); // 1 STARS
export const MIN_TX_FEE = '1'; // 1 starshars
export const GENESIS_SUPPLY = (1000000n * STARS_TO_STARSHARS).toString(); // 1M STARS for bot