import { Hono } from 'hono';
import { desc, sql } from 'drizzle-orm';
import { blocks, chainState } from '../db/schema';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

const app = new Hono<{
  Variables: {
    db: DrizzleD1Database;
  };
}>();

// Get latest blocks
app.get('/blocks', async (c) => {
  const db = c.get('db');
  const limit = Number(c.req.query('limit')) || 10;
  const offset = Number(c.req.query('offset')) || 0;

  try {
    const result = await db
      .select()
      .from(blocks)
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
    console.error('Error fetching blocks:', error);
    return c.json({ error: 'Failed to fetch blocks' }, 500);
  }
});

// Get block by hash
app.get('/blocks/:hash', async (c) => {
  const db = c.get('db');
  const hash = c.req.param('hash');

  try {
    const result = await db
      .select()
      .from(blocks)
      .where(sql`${blocks.hash} = ${hash}`)
      .limit(1);

    if (!result.length) {
      return c.json({ error: 'Block not found' }, 404);
    }

    return c.json(result[0]);
  } catch (error) {
    console.error('Error fetching block:', error);
    return c.json({ error: 'Failed to fetch block' }, 500);
  }
});

// Get chain statistics
app.get('/stats', async (c) => {
  const db = c.get('db');

  try {
    const totalBlocks = await db
      .select({ count: sql<number>`count(*)` })
      .from(blocks);

    const maxHeight = await db
      .select({ max: sql<number>`max(${blocks.height})` })
      .from(blocks);

    const recentBlocks = await db
      .select()
      .from(blocks)
      .orderBy(desc(blocks.height))
      .limit(5);

    // Get chain state if available
    let state = null;
    try {
      const stateResult = await db.select().from(chainState).limit(1);
      state = stateResult[0] || null;
    } catch (_) {
      // chain_state table may not exist
    }

    return c.json({
      totalBlocks: totalBlocks[0]?.count || 0,
      latestHeight: maxHeight[0]?.max || 0,
      recentBlocks,
      chainState: state,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

export default app;
