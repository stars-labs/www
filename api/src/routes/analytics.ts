import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, sql, and, gte } from 'drizzle-orm';
import { interactions, miningStats, type NewInteraction, type NewMiningStats } from '../db/schema';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

const app = new Hono<{
  Variables: {
    db: DrizzleD1Database;
  };
}>();

// Schema validators
const recordInteractionSchema = z.object({
  sessionId: z.string().min(1),
  type: z.enum(['click', 'transaction', 'mining_boost']),
  data: z.string().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional()
});

const updateMiningStatsSchema = z.object({
  sessionId: z.string().min(1),
  speedMultiplier: z.number().min(1),
  blocksMinedCount: z.number().int().min(0).optional(),
  totalClicks: z.number().int().min(0).optional(),
  averageMiningTime: z.number().optional(),
  peakSpeedMultiplier: z.number().min(1).optional()
});

// Record user interaction
app.post('/interactions', zValidator('json', recordInteractionSchema), async (c) => {
  const db = c.get('db');
  const data = c.req.valid('json');

  try {
    const newInteraction: NewInteraction = {
      ...data,
      timestamp: new Date()
    };

    const [created] = await db
      .insert(interactions)
      .values(newInteraction)
      .returning();

    return c.json(created, 201);
  } catch (error) {
    console.error('Error recording interaction:', error);
    return c.json({ error: 'Failed to record interaction' }, 500);
  }
});

// Get interactions for session
app.get('/interactions/:sessionId', async (c) => {
  const db = c.get('db');
  const sessionId = c.req.param('sessionId');
  const limit = Number(c.req.query('limit')) || 100;

  try {
    const sessionInteractions = await db
      .select()
      .from(interactions)
      .where(eq(interactions.sessionId, sessionId))
      .orderBy(desc(interactions.timestamp))
      .limit(limit);

    return c.json({
      sessionId,
      interactions: sessionInteractions,
      count: sessionInteractions.length
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch interactions' }, 500);
  }
});

// Update mining statistics
app.post('/mining-stats', zValidator('json', updateMiningStatsSchema), async (c) => {
  const db = c.get('db');
  const data = c.req.valid('json');

  try {
    // Check if session stats exist
    const [existing] = await db
      .select()
      .from(miningStats)
      .where(eq(miningStats.sessionId, data.sessionId))
      .limit(1);

    if (existing) {
      // Update existing stats
      const updates: any = {
        speedMultiplier: data.speedMultiplier,
        timestamp: new Date()
      };

      if (data.blocksMinedCount !== undefined) {
        updates.blocksMinedCount = data.blocksMinedCount;
      }
      if (data.totalClicks !== undefined) {
        updates.totalClicks = data.totalClicks;
      }
      if (data.averageMiningTime !== undefined) {
        updates.averageMiningTime = data.averageMiningTime;
      }
      if (data.peakSpeedMultiplier !== undefined && data.peakSpeedMultiplier > existing.peakSpeedMultiplier) {
        updates.peakSpeedMultiplier = data.peakSpeedMultiplier;
      }

      const [updated] = await db
        .update(miningStats)
        .set(updates)
        .where(eq(miningStats.sessionId, data.sessionId))
        .returning();

      return c.json(updated);
    } else {
      // Create new stats
      const newStats: NewMiningStats = {
        ...data,
        peakSpeedMultiplier: data.peakSpeedMultiplier || data.speedMultiplier
      };

      const [created] = await db
        .insert(miningStats)
        .values(newStats)
        .returning();

      return c.json(created, 201);
    }
  } catch (error) {
    console.error('Error updating mining stats:', error);
    return c.json({ error: 'Failed to update mining stats' }, 500);
  }
});

// Get mining statistics
app.get('/mining-stats/:sessionId', async (c) => {
  const db = c.get('db');
  const sessionId = c.req.param('sessionId');

  try {
    const [stats] = await db
      .select()
      .from(miningStats)
      .where(eq(miningStats.sessionId, sessionId))
      .limit(1);

    if (!stats) {
      return c.json({ error: 'Stats not found' }, 404);
    }

    return c.json(stats);
  } catch (error) {
    return c.json({ error: 'Failed to fetch mining stats' }, 500);
  }
});

// Get global analytics
app.get('/global', async (c) => {
  const db = c.get('db');
  const hoursAgo = Number(c.req.query('hoursAgo')) || 24;

  try {
    const timeThreshold = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    // Interaction stats
    const interactionStats = await db
      .select({
        totalInteractions: sql<number>`count(*)`,
        uniqueSessions: sql<number>`count(distinct session_id)`,
        clickCount: sql<number>`sum(case when type = 'click' then 1 else 0 end)`,
        transactionCount: sql<number>`sum(case when type = 'transaction' then 1 else 0 end)`,
        miningBoostCount: sql<number>`sum(case when type = 'mining_boost' then 1 else 0 end)`
      })
      .from(interactions)
      .where(gte(interactions.timestamp, timeThreshold));

    // Mining performance stats
    const miningPerformance = await db
      .select({
        avgSpeedMultiplier: sql<number>`avg(speed_multiplier)`,
        maxSpeedMultiplier: sql<number>`max(peak_speed_multiplier)`,
        totalBlocksMined: sql<number>`sum(blocks_mined_count)`,
        totalClicks: sql<number>`sum(total_clicks)`,
        avgMiningTime: sql<number>`avg(average_mining_time)`,
        activeSessions: sql<number>`count(*)`
      })
      .from(miningStats)
      .where(gte(miningStats.timestamp, timeThreshold));

    // Recent activity
    const recentActivity = await db
      .select({
        hour: sql<string>`strftime('%Y-%m-%d %H:00', timestamp)`,
        interactions: sql<number>`count(*)`
      })
      .from(interactions)
      .where(gte(interactions.timestamp, timeThreshold))
      .groupBy(sql`strftime('%Y-%m-%d %H:00', timestamp)`)
      .orderBy(desc(sql`strftime('%Y-%m-%d %H:00', timestamp)`));

    return c.json({
      timeRange: {
        hours: hoursAgo,
        from: timeThreshold.toISOString(),
        to: new Date().toISOString()
      },
      interactions: interactionStats[0] || {},
      mining: miningPerformance[0] || {},
      activityByHour: recentActivity
    });
  } catch (error) {
    console.error('Error fetching global analytics:', error);
    return c.json({ error: 'Failed to fetch global analytics' }, 500);
  }
});

// Get heatmap data for clicks
app.get('/heatmap', async (c) => {
  const db = c.get('db');
  const hoursAgo = Number(c.req.query('hoursAgo')) || 1;

  try {
    const timeThreshold = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    const heatmapData = await db
      .select({
        x: interactions.positionX,
        y: interactions.positionY,
        count: sql<number>`count(*)`
      })
      .from(interactions)
      .where(
        and(
          eq(interactions.type, 'click'),
          gte(interactions.timestamp, timeThreshold)
        )
      )
      .groupBy(interactions.positionX, interactions.positionY);

    return c.json({
      heatmap: heatmapData,
      timeRange: {
        hours: hoursAgo,
        from: timeThreshold.toISOString(),
        to: new Date().toISOString()
      }
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch heatmap data' }, 500);
  }
});

export default app;