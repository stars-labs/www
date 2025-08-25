import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, and, sql } from 'drizzle-orm';
import { blocks, chainForks, type NewBlock, type NewChainFork } from '../db/schema';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

const app = new Hono<{
  Variables: {
    db: DrizzleD1Database;
  };
}>();

// Schema validators
const createBlockSchema = z.object({
  hash: z.string().min(1),
  previousHash: z.string().min(1),
  height: z.number().int().min(0),
  chainId: z.string().min(1),
  transactionCount: z.number().int().min(0).optional(),
  minerAddress: z.string().optional(),
  difficulty: z.number().optional(),
  nonce: z.number().int().optional()
});

const createForkSchema = z.object({
  forkId: z.string().min(1),
  parentChainId: z.string().min(1),
  forkHeight: z.number().int().min(0),
  isMainChain: z.boolean().optional()
});

// Get latest blocks
app.get('/blocks', async (c) => {
  const db = c.get('db');
  const limit = Number(c.req.query('limit')) || 10;
  const offset = Number(c.req.query('offset')) || 0;
  const chainId = c.req.query('chainId');

  try {
    const query = chainId 
      ? db.select().from(blocks).where(eq(blocks.chainId, chainId))
      : db.select().from(blocks);
    
    const result = await query
      .orderBy(desc(blocks.height))
      .limit(limit)
      .offset(offset);

    return c.json({
      blocks: result,
      count: result.length,
      limit,
      offset
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch blocks' }, 500);
  }
});

// Get block by hash
app.get('/blocks/:hash', async (c) => {
  const db = c.get('db');
  const hash = c.req.param('hash');

  try {
    const [block] = await db
      .select()
      .from(blocks)
      .where(eq(blocks.hash, hash))
      .limit(1);

    if (!block) {
      return c.json({ error: 'Block not found' }, 404);
    }

    return c.json(block);
  } catch (error) {
    return c.json({ error: 'Failed to fetch block' }, 500);
  }
});

// Create new block
app.post('/blocks', zValidator('json', createBlockSchema), async (c) => {
  const db = c.get('db');
  const data = c.req.valid('json');

  try {
    const newBlock: NewBlock = {
      ...data,
      timestamp: new Date()
    };

    const [created] = await db
      .insert(blocks)
      .values(newBlock)
      .returning();

    // Update chain fork stats if exists
    if (data.chainId) {
      await db
        .update(chainForks)
        .set({ 
          totalBlocks: sql`${chainForks.totalBlocks} + 1` 
        })
        .where(eq(chainForks.forkId, data.chainId));
    }

    return c.json(created, 201);
  } catch (error) {
    console.error('Error creating block:', error);
    return c.json({ error: 'Failed to create block' }, 500);
  }
});

// Get chain statistics
app.get('/stats', async (c) => {
  const db = c.get('db');

  try {
    const totalBlocks = await db
      .select({ count: sql<number>`count(*)` })
      .from(blocks);

    const chains = await db
      .select({
        chainId: blocks.chainId,
        blockCount: sql<number>`count(*)`,
        maxHeight: sql<number>`max(${blocks.height})`
      })
      .from(blocks)
      .groupBy(blocks.chainId);

    const recentBlocks = await db
      .select()
      .from(blocks)
      .orderBy(desc(blocks.timestamp))
      .limit(5);

    return c.json({
      totalBlocks: totalBlocks[0]?.count || 0,
      chains,
      recentBlocks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Get chain forks
app.get('/forks', async (c) => {
  const db = c.get('db');

  try {
    const forks = await db
      .select()
      .from(chainForks)
      .orderBy(desc(chainForks.createdAt));

    return c.json(forks);
  } catch (error) {
    return c.json({ error: 'Failed to fetch forks' }, 500);
  }
});

// Create chain fork
app.post('/forks', zValidator('json', createForkSchema), async (c) => {
  const db = c.get('db');
  const data = c.req.valid('json');

  try {
    const newFork: NewChainFork = {
      ...data,
      totalBlocks: 0
    };

    const [created] = await db
      .insert(chainForks)
      .values(newFork)
      .returning();

    return c.json(created, 201);
  } catch (error) {
    console.error('Error creating fork:', error);
    return c.json({ error: 'Failed to create fork' }, 500);
  }
});

// Resolve chain fork (mark main chain)
app.put('/forks/:forkId/resolve', async (c) => {
  const db = c.get('db');
  const forkId = c.req.param('forkId');

  try {
    // Set all forks to not main
    await db
      .update(chainForks)
      .set({ isMainChain: false });

    // Set specified fork as main
    const [resolved] = await db
      .update(chainForks)
      .set({ 
        isMainChain: true,
        resolvedAt: new Date()
      })
      .where(eq(chainForks.forkId, forkId))
      .returning();

    if (!resolved) {
      return c.json({ error: 'Fork not found' }, 404);
    }

    return c.json(resolved);
  } catch (error) {
    return c.json({ error: 'Failed to resolve fork' }, 500);
  }
});

export default app;