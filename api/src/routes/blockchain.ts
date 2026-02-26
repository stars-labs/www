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
  txCount: z.number().int().min(0).optional(),
  minerAddress: z.string().optional(),
  difficulty: z.number().optional(),
  nonce: z.string().optional()
});

// Fork schema removed - not needed for STARS implementation

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

    // Convert Unix timestamps (seconds) to JavaScript timestamps (milliseconds) for frontend compatibility
    const blocksWithTime = result.map(block => ({
      ...block,
      timestamp: block.timestamp * 1000, // Convert to JavaScript timestamp in milliseconds for frontend
      unixTimestamp: block.timestamp, // Keep original Unix timestamp
      jsTimestamp: block.timestamp * 1000, // JavaScript timestamp in milliseconds
      formattedTime: new Date(block.timestamp * 1000).toLocaleString() // Human readable time
    }));

    return c.json({
      blocks: blocksWithTime,
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

    // Add JavaScript timestamp and formatted time  
    const blockWithTime = {
      ...block,
      timestamp: block.timestamp * 1000, // Convert to JavaScript timestamp for frontend compatibility
      unixTimestamp: block.timestamp, // Keep original Unix timestamp
      jsTimestamp: block.timestamp * 1000, // JavaScript timestamp in milliseconds
      formattedTime: new Date(block.timestamp * 1000).toLocaleString() // Human readable time
    };

    return c.json(blockWithTime);
  } catch (error) {
    return c.json({ error: 'Failed to fetch block' }, 500);
  }
});

// Create new block
app.post('/blocks', zValidator('json', createBlockSchema), async (c) => {
  const db = c.get('db');
  const data = c.req.valid('json');

  try {
    // Import MINING_REWARD from schema
    const { MINING_REWARD } = await import('../db/schema');
    
    // Get the latest block height
    const latestBlock = await db
      .select({ height: blocks.height })
      .from(blocks)
      .orderBy(desc(blocks.height))
      .limit(1);
    
    const nextHeight = latestBlock.length > 0 ? latestBlock[0].height + 1 : data.height;
    
    const newBlock: NewBlock = {
      hash: data.hash,
      previousHash: data.previousHash,
      height: nextHeight, // Use the next height
      timestamp: Date.now(),
      difficulty: data.difficulty || 1,
      nonce: data.nonce || '0',
      minerAddress: data.minerAddress || '0x0000000000000000000000000000000000000000',
      reward: MINING_REWARD, // Add the required reward field
      merkleRoot: '', // Add merkleRoot
      gasUsed: '0', // Add gasUsed
      txCount: data.txCount || 0
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

    const latestBlock = await db
      .select({
        maxHeight: sql<number>`max(${blocks.height})`,
        minHeight: sql<number>`min(${blocks.height})`,
        avgDifficulty: sql<number>`avg(${blocks.difficulty})`
      })
      .from(blocks);

    const recentBlocks = await db
      .select()
      .from(blocks)
      .orderBy(desc(blocks.timestamp))
      .limit(5);

    return c.json({
      totalBlocks: totalBlocks[0]?.count || 0,
      latestHeight: latestBlock[0]?.maxHeight || 0,
      averageDifficulty: latestBlock[0]?.avgDifficulty || 0,
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