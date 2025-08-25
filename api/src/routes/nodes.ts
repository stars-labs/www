import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, sql } from 'drizzle-orm';
import { nodes, type NewNode } from '../db/schema';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

const app = new Hono<{
  Variables: {
    db: DrizzleD1Database;
  };
}>();

// Schema validators
const createNodeSchema = z.object({
  nodeId: z.string().min(1),
  type: z.enum(['validator', 'miner', 'peer', 'smart-contract']),
  address: z.string().min(1),
  isActive: z.boolean().optional()
});

const updateNodeSchema = z.object({
  isActive: z.boolean().optional(),
  consensusParticipation: z.number().int().optional()
});

// Get all nodes
app.get('/', async (c) => {
  const db = c.get('db');
  const type = c.req.query('type');
  const isActive = c.req.query('active') === 'true';

  try {
    let query = db.select().from(nodes);
    
    if (type) {
      query = query.where(eq(nodes.type, type as any)) as any;
    }
    if (isActive !== undefined) {
      query = query.where(eq(nodes.isActive, isActive)) as any;
    }

    const result = await query.orderBy(desc(nodes.lastSeen));

    return c.json({
      nodes: result,
      count: result.length
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch nodes' }, 500);
  }
});

// Get node by ID
app.get('/:nodeId', async (c) => {
  const db = c.get('db');
  const nodeId = c.req.param('nodeId');

  try {
    const [node] = await db
      .select()
      .from(nodes)
      .where(eq(nodes.nodeId, nodeId))
      .limit(1);

    if (!node) {
      return c.json({ error: 'Node not found' }, 404);
    }

    return c.json(node);
  } catch (error) {
    return c.json({ error: 'Failed to fetch node' }, 500);
  }
});

// Register new node
app.post('/', zValidator('json', createNodeSchema), async (c) => {
  const db = c.get('db');
  const data = c.req.valid('json');

  try {
    const newNode: NewNode = {
      ...data,
      isActive: data.isActive ?? true,
      consensusParticipation: 0
    };

    const [created] = await db
      .insert(nodes)
      .values(newNode)
      .returning();

    return c.json(created, 201);
  } catch (error) {
    console.error('Error creating node:', error);
    return c.json({ error: 'Failed to create node' }, 500);
  }
});

// Update node status
app.patch('/:nodeId', zValidator('json', updateNodeSchema), async (c) => {
  const db = c.get('db');
  const nodeId = c.req.param('nodeId');
  const data = c.req.valid('json');

  try {
    const updates: any = {
      ...data,
      lastSeen: new Date()
    };

    const [updated] = await db
      .update(nodes)
      .set(updates)
      .where(eq(nodes.nodeId, nodeId))
      .returning();

    if (!updated) {
      return c.json({ error: 'Node not found' }, 404);
    }

    return c.json(updated);
  } catch (error) {
    return c.json({ error: 'Failed to update node' }, 500);
  }
});

// Heartbeat endpoint to update last seen
app.post('/:nodeId/heartbeat', async (c) => {
  const db = c.get('db');
  const nodeId = c.req.param('nodeId');

  try {
    const [updated] = await db
      .update(nodes)
      .set({ 
        lastSeen: new Date(),
        isActive: true
      })
      .where(eq(nodes.nodeId, nodeId))
      .returning();

    if (!updated) {
      return c.json({ error: 'Node not found' }, 404);
    }

    return c.json({ 
      success: true,
      nodeId,
      lastSeen: updated.lastSeen
    });
  } catch (error) {
    return c.json({ error: 'Failed to update heartbeat' }, 500);
  }
});

// Get network statistics
app.get('/stats/network', async (c) => {
  const db = c.get('db');

  try {
    const stats = await db
      .select({
        totalNodes: sql<number>`count(*)`,
        activeNodes: sql<number>`sum(case when is_active = true then 1 else 0 end)`,
        validators: sql<number>`sum(case when type = 'validator' then 1 else 0 end)`,
        miners: sql<number>`sum(case when type = 'miner' then 1 else 0 end)`,
        peers: sql<number>`sum(case when type = 'peer' then 1 else 0 end)`,
        smartContracts: sql<number>`sum(case when type = 'smart-contract' then 1 else 0 end)`,
        totalConsensusParticipation: sql<number>`sum(consensus_participation)`
      })
      .from(nodes);

    const topValidators = await db
      .select()
      .from(nodes)
      .where(eq(nodes.type, 'validator'))
      .orderBy(desc(nodes.consensusParticipation))
      .limit(5);

    return c.json({
      network: stats[0] || {},
      topValidators,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch network stats' }, 500);
  }
});

// Deactivate inactive nodes (maintenance endpoint)
app.post('/maintenance/deactivate-inactive', async (c) => {
  const db = c.get('db');
  const hoursInactive = Number(c.req.query('hours')) || 24;

  try {
    const threshold = new Date(Date.now() - hoursInactive * 60 * 60 * 1000);

    const result = await db
      .update(nodes)
      .set({ isActive: false })
      .where(
        sql`${nodes.lastSeen} < ${threshold} AND ${nodes.isActive} = true`
      )
      .returning();

    return c.json({
      deactivated: result.length,
      nodes: result
    });
  } catch (error) {
    return c.json({ error: 'Failed to deactivate nodes' }, 500);
  }
});

export default app;