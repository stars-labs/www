import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, and, sql } from 'drizzle-orm';
import { blocks, type NewBlock } from '../db/schema';
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

// Fork schema removed - not needed for STARS implementation

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
    // Commented out - chainForks table removed for STARS implementation
    // if (data.chainId) {
    //   await db
    //     .update(chainForks)
    //     .set({ 
    //       totalBlocks: sql`${chainForks.totalBlocks} + 1` 
    //     })
    //     .where(eq(chainForks.forkId, data.chainId));
    // }

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

// Get chain forks - commented out for STARS implementation
// app.get('/forks', async (c) => {
//   return c.json([]);
// });

// Create chain fork - commented out for STARS implementation
// app.post('/forks', zValidator('json', createForkSchema), async (c) => {
//   return c.json({ error: 'Chain forks not supported in STARS' }, 501);
// });

// Resolve chain fork - commented out for STARS implementation
// app.put('/forks/:forkId/resolve', async (c) => {
//   return c.json({ error: 'Chain forks not supported in STARS' }, 501);
// });

export default app;