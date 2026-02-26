import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import { transactions, blocks, type NewTransaction } from '../db/schema';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

const app = new Hono<{
  Variables: {
    db: DrizzleD1Database;
  };
}>();

// Schema validators
const createTransactionSchema = z.object({
  hash: z.string().min(1),
  blockHeight: z.number().int().optional(),
  fromAddress: z.string().min(1),
  toAddress: z.string().min(1),
  value: z.number().positive(),
  gasPrice: z.string().optional(),
  gasLimit: z.number().optional(),
  nonce: z.number().int().min(0).optional(),
  status: z.enum(['pending', 'confirmed', 'failed']).optional()
});

const updateTransactionSchema = z.object({
  blockHeight: z.number().int().optional(),
  status: z.enum(['pending', 'confirmed', 'failed']).optional()
});

// Get transactions
app.get('/', async (c) => {
  const db = c.get('db');
  const limit = Number(c.req.query('limit')) || 20;
  const offset = Number(c.req.query('offset')) || 0;
  const status = c.req.query('status');

  try {
    // Simple query first, then enhance with timestamps
    let query = db.select().from(transactions);
    
    if (status) {
      query = query.where(eq(transactions.status, status as any)) as any;
    }

    const result = await query
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    // Simple approach: Add timestamps based on block data
    const enhancedTransactions = result.map(tx => {
      // Default values
      let timestamp = null;
      let jsTimestamp = null;
      let formattedTime = null;

      // If createdAt is available, use it
      if (tx.createdAt) {
        jsTimestamp = new Date(tx.createdAt).getTime();
        timestamp = jsTimestamp;
        formattedTime = new Date(tx.createdAt).toLocaleString();
      }
      // For now, we'll fetch block timestamps in a separate step
      // This will be handled by the block timestamp enhancement below

      return {
        ...tx,
        timestamp,
        jsTimestamp,
        formattedTime
      };
    });

    // Enhance with block timestamps in a second pass
    for (let i = 0; i < enhancedTransactions.length; i++) {
      const tx = enhancedTransactions[i];
      
      // Skip if already has timestamp from createdAt
      if (tx.timestamp) continue;
      
      // Fetch block timestamp if needed
      if (tx.blockHeight) {
        try {
          const [block] = await db
            .select({ timestamp: blocks.timestamp })
            .from(blocks)
            .where(eq(blocks.height, tx.blockHeight))
            .limit(1);
          
          if (block && block.timestamp) {
            enhancedTransactions[i].timestamp = block.timestamp * 1000;
            enhancedTransactions[i].jsTimestamp = block.timestamp * 1000;
            enhancedTransactions[i].formattedTime = new Date(block.timestamp * 1000).toLocaleString();
          }
        } catch (error) {
          // Silently continue if block query fails
        }
      }
    }

    return c.json({
      transactions: enhancedTransactions,
      count: result.length,
      limit,
      offset
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch transactions' }, 500);
  }
});

// Get transaction by hash
app.get('/:hash', async (c) => {
  const db = c.get('db');
  const hash = c.req.param('hash');

  try {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.hash, hash))
      .limit(1);

    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    // Use the exact same logic as the list endpoint that's working
    let timestamp = null;
    let jsTimestamp = null;
    let formattedTime = null;

    // If createdAt is available, use it
    if (transaction.createdAt) {
      jsTimestamp = new Date(transaction.createdAt).getTime();
      timestamp = jsTimestamp;
      formattedTime = new Date(transaction.createdAt).toLocaleString();
    }

    // Fetch block timestamp if needed (same logic as working list endpoint)
    if (!timestamp && transaction.blockHeight) {
      try {
        const [block] = await db
          .select({ timestamp: blocks.timestamp })
          .from(blocks)
          .where(eq(blocks.height, transaction.blockHeight))
          .limit(1);
        
        if (block && block.timestamp) {
          timestamp = block.timestamp * 1000;
          jsTimestamp = block.timestamp * 1000;
          formattedTime = new Date(block.timestamp * 1000).toLocaleString();
        }
      } catch (error) {
        // Silently continue if block query fails
      }
    }

    const enhancedTransaction = {
      ...transaction,
      timestamp,
      jsTimestamp,
      formattedTime
    };

    return c.json(enhancedTransaction);
  } catch (error) {
    return c.json({ error: 'Failed to fetch transaction' }, 500);
  }
});

// Create transaction
app.post('/', zValidator('json', createTransactionSchema), async (c) => {
  const db = c.get('db');
  const data = c.req.valid('json');

  try {
    // Get or generate nonce for the sender
    let nonce = data.nonce;
    if (nonce === undefined) {
      // Get the latest nonce for this address
      const latestTx = await db
        .select({ nonce: transactions.nonce })
        .from(transactions)
        .where(eq(transactions.fromAddress, data.fromAddress))
        .orderBy(desc(transactions.nonce))
        .limit(1);
      
      nonce = latestTx.length > 0 ? latestTx[0].nonce + 1 : 0;
    }
    
    const newTransaction: NewTransaction = {
      hash: data.hash,
      blockHeight: data.blockHeight || null,
      fromAddress: data.fromAddress,
      toAddress: data.toAddress,
      value: data.value.toString(), // Convert to string for database
      gasPrice: data.gasPrice || '1',
      gasLimit: data.gasLimit || 21000,
      gasUsed: 21000,
      nonce,
      signature: null,
      status: data.status || 'pending'
    };

    const [created] = await db
      .insert(transactions)
      .values(newTransaction)
      .returning();

    return c.json(created, 201);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return c.json({ error: 'Failed to create transaction' }, 500);
  }
});

// Update transaction status
app.patch('/:hash', zValidator('json', updateTransactionSchema), async (c) => {
  const db = c.get('db');
  const hash = c.req.param('hash');
  const data = c.req.valid('json');

  try {
    const [updated] = await db
      .update(transactions)
      .set(data)
      .where(eq(transactions.hash, hash))
      .returning();

    if (!updated) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    return c.json(updated);
  } catch (error) {
    return c.json({ error: 'Failed to update transaction' }, 500);
  }
});

// Get transaction statistics
app.get('/stats/summary', async (c) => {
  const db = c.get('db');

  try {
    // Get basic counts with more SQLite-compatible syntax
    const [totalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions);

    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.status, 'pending'));

    const [confirmedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.status, 'confirmed'));

    const [failedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.status, 'failed'));

    // Get total value with proper casting
    const [valueResult] = await db
      .select({ 
        totalValue: sql<string>`coalesce(sum(cast(value as real)), 0)`
      })
      .from(transactions);

    // Get total gas used
    const [gasResult] = await db
      .select({ 
        totalGasUsed: sql<number>`coalesce(sum(gas_used), 0)`
      })
      .from(transactions);

    const recentTransactions = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    return c.json({
      totalTransactions: totalCount.count || 0,
      pendingCount: pendingCount.count || 0,
      confirmedCount: confirmedCount.count || 0,
      failedCount: failedCount.count || 0,
      totalValue: parseFloat(valueResult.totalValue || '0'),
      totalGasUsed: gasResult.totalGasUsed || 0,
      recentTransactions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Transaction stats error:', error);
    // Return safe fallback data
    return c.json({
      totalTransactions: 0,
      pendingCount: 0,
      confirmedCount: 0,
      failedCount: 0,
      totalValue: 0,
      totalGasUsed: 0,
      recentTransactions: [],
      timestamp: new Date().toISOString(),
      error: 'Partial data - some stats unavailable'
    });
  }
});

// Get mempool (pending transactions)
app.get('/mempool/pending', async (c) => {
  const db = c.get('db');

  try {
    const pendingTxs = await db
      .select()
      .from(transactions)
      .where(eq(transactions.status, 'pending'))
      .orderBy(desc(transactions.createdAt))
      .limit(50);

    return c.json({
      mempool: pendingTxs,
      count: pendingTxs.length
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch mempool' }, 500);
  }
});

export default app;