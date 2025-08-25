import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, and, sql } from 'drizzle-orm';
import { transactions, type NewTransaction } from '../db/schema';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

const app = new Hono<{
  Variables: {
    db: DrizzleD1Database;
  };
}>();

// Schema validators
const createTransactionSchema = z.object({
  hash: z.string().min(1),
  blockHash: z.string().optional(),
  fromAddress: z.string().min(1),
  toAddress: z.string().min(1),
  value: z.number().positive(),
  fee: z.number().optional(),
  status: z.enum(['pending', 'confirmed', 'failed']).optional(),
  userCreated: z.boolean().optional()
});

const updateTransactionSchema = z.object({
  blockHash: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'failed']).optional()
});

// Get transactions
app.get('/', async (c) => {
  const db = c.get('db');
  const limit = Number(c.req.query('limit')) || 20;
  const offset = Number(c.req.query('offset')) || 0;
  const status = c.req.query('status');
  const userCreated = c.req.query('userCreated') === 'true';

  try {
    let query = db.select().from(transactions);
    
    const conditions = [];
    if (status) {
      conditions.push(eq(transactions.status, status as any));
    }
    if (userCreated !== undefined) {
      conditions.push(eq(transactions.userCreated, userCreated));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query
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

    return c.json(transaction);
  } catch (error) {
    return c.json({ error: 'Failed to fetch transaction' }, 500);
  }
});

// Create transaction
app.post('/', zValidator('json', createTransactionSchema), async (c) => {
  const db = c.get('db');
  const data = c.req.valid('json');

  try {
    const newTransaction: NewTransaction = {
      ...data,
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
    const stats = await db
      .select({
        totalTransactions: sql<number>`count(*)`,
        pendingCount: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
        confirmedCount: sql<number>`sum(case when status = 'confirmed' then 1 else 0 end)`,
        failedCount: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`,
        userCreatedCount: sql<number>`sum(case when user_created = true then 1 else 0 end)`,
        totalValue: sql<number>`sum(value)`,
        totalFees: sql<number>`sum(fee)`
      })
      .from(transactions);

    const recentTransactions = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    return c.json({
      ...stats[0],
      recentTransactions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch transaction stats' }, 500);
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