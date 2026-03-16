import { Hono } from 'hono';
import { eq, desc, sql } from 'drizzle-orm';
import { transactions, mempool } from '../db/schema';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

const app = new Hono<{
  Variables: {
    db: DrizzleD1Database;
  };
}>();

// Get transaction statistics - MUST be before /:hash to avoid route conflict
app.get('/stats/summary', async (c) => {
  const db = c.get('db');

  try {
    const stats = await db
      .select({
        totalTransactions: sql<number>`count(*)`,
        pendingCount: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
        confirmedCount: sql<number>`sum(case when status = 'confirmed' then 1 else 0 end)`,
        failedCount: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`,
        totalValue: sql<number>`sum(cast(value as real))`
      })
      .from(transactions);

    const recentTransactions = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    const raw = stats[0] || {};
    return c.json({
      totalTransactions: raw.totalTransactions ?? 0,
      pendingCount: raw.pendingCount ?? 0,
      confirmedCount: raw.confirmedCount ?? 0,
      failedCount: raw.failedCount ?? 0,
      totalValue: raw.totalValue ?? 0,
      recentTransactions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    return c.json({ error: 'Failed to fetch transaction stats' }, 500);
  }
});

// Get mempool (pending transactions) - MUST be before /:hash to avoid route conflict
app.get('/mempool/pending', async (c) => {
  const db = c.get('db');

  try {
    // Try mempool table first, fall back to pending transactions
    let pendingTxs: any[] = [];
    try {
      pendingTxs = await db
        .select()
        .from(mempool)
        .orderBy(desc(mempool.createdAt))
        .limit(50);
    } catch (_) {
      // mempool table might be empty or different
    }

    if (!pendingTxs.length) {
      pendingTxs = await db
        .select()
        .from(transactions)
        .where(eq(transactions.status, 'pending'))
        .orderBy(desc(transactions.createdAt))
        .limit(50);
    }

    return c.json({
      mempool: pendingTxs,
      count: pendingTxs.length
    });
  } catch (error) {
    console.error('Error fetching mempool:', error);
    return c.json({ error: 'Failed to fetch mempool' }, 500);
  }
});

// Get transactions
app.get('/', async (c) => {
  const db = c.get('db');
  const limit = Number(c.req.query('limit')) || 20;
  const offset = Number(c.req.query('offset')) || 0;
  const status = c.req.query('status');

  try {
    let query = status
      ? db.select().from(transactions).where(eq(transactions.status, status))
      : db.select().from(transactions);

    const result = await (query as any)
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      transactions: result,
      count: result.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return c.json({ error: 'Failed to fetch transactions' }, 500);
  }
});

// Get transaction by hash
app.get('/:hash', async (c) => {
  const db = c.get('db');
  const hash = c.req.param('hash');

  try {
    const result = await db
      .select()
      .from(transactions)
      .where(eq(transactions.hash, hash))
      .limit(1);

    if (!result.length) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    return c.json(result[0]);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return c.json({ error: 'Failed to fetch transaction' }, 500);
  }
});

export default app;
