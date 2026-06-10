import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { desc, sql } from "drizzle-orm";
import {
  blocks,
  chainState,
  classroomBlocks,
  type NewClassroomBlock,
} from "../db/schema";
import type { DrizzleD1Database } from "drizzle-orm/d1";

const app = new Hono<{
  Variables: {
    db: DrizzleD1Database;
  };
}>();

// Get latest blocks
app.get("/blocks", async (c) => {
  const db = c.get("db");
  const limit = Number(c.req.query("limit")) || 10;
  const offset = Number(c.req.query("offset")) || 0;

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
      offset,
    });
  } catch (error) {
    console.error("Error fetching blocks:", error);
    return c.json({ error: "Failed to fetch blocks" }, 500);
  }
});

// Classroom chain: blocks mined by visitors on the homepage viz.
// Batched uploads (one request carries many blocks) to stay within
// Cloudflare free tier limits.
const classroomSyncSchema = z.object({
  sessionId: z.string().min(1).max(64),
  blocks: z
    .array(
      z.object({
        hash: z.string().min(1).max(80),
        previousHash: z.string().min(1).max(80),
        height: z.number().int().min(0),
        chainId: z.string().max(32).optional(),
        transactionCount: z.number().int().min(0).max(10000).optional(),
        minerAddress: z.string().max(80).optional(),
        difficulty: z.number().int().min(0).optional(),
        nonce: z.number().int().min(0).optional(),
      }),
    )
    .min(1)
    .max(50),
});

app.post(
  "/classroom/blocks",
  zValidator("json", classroomSyncSchema),
  async (c) => {
    const db = c.get("db");
    const { sessionId, blocks: incoming } = c.req.valid("json");

    try {
      const now = Date.now();
      const rows: NewClassroomBlock[] = incoming.map((b) => ({
        hash: b.hash,
        previousHash: b.previousHash,
        height: b.height,
        chainId: b.chainId || "classroom",
        txCount: b.transactionCount ?? 0,
        minerAddress: b.minerAddress,
        sessionId,
        difficulty: b.difficulty,
        nonce: b.nonce,
        createdAt: now,
      }));

      await db.insert(classroomBlocks).values(rows);

      return c.json({ inserted: rows.length }, 201);
    } catch (error) {
      console.error("Error syncing classroom blocks:", error);
      return c.json({ error: "Failed to sync classroom blocks" }, 500);
    }
  },
);

// List classroom blocks; stats are bundled in to keep request count low
app.get("/classroom/blocks", async (c) => {
  const db = c.get("db");
  const limit = Math.min(Number(c.req.query("limit")) || 20, 100);
  const offset = Number(c.req.query("offset")) || 0;

  try {
    const result = await db
      .select()
      .from(classroomBlocks)
      .orderBy(desc(classroomBlocks.id))
      .limit(limit)
      .offset(offset);

    const totals = await db
      .select({
        count: sql<number>`count(*)`,
        maxHeight: sql<number>`coalesce(max(${classroomBlocks.height}), 0)`,
        miners: sql<number>`count(distinct ${classroomBlocks.sessionId})`,
      })
      .from(classroomBlocks);

    return c.json({
      blocks: result,
      totalBlocks: totals[0]?.count ?? 0,
      latestHeight: totals[0]?.maxHeight ?? 0,
      uniqueMiners: totals[0]?.miners ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching classroom blocks:", error);
    return c.json({ error: "Failed to fetch classroom blocks" }, 500);
  }
});

// Get block by hash
app.get("/blocks/:hash", async (c) => {
  const db = c.get("db");
  const hash = c.req.param("hash");

  try {
    const result = await db
      .select()
      .from(blocks)
      .where(sql`${blocks.hash} = ${hash}`)
      .limit(1);

    if (!result.length) {
      return c.json({ error: "Block not found" }, 404);
    }

    return c.json(result[0]);
  } catch (error) {
    console.error("Error fetching block:", error);
    return c.json({ error: "Failed to fetch block" }, 500);
  }
});

// Get chain statistics
app.get("/stats", async (c) => {
  const db = c.get("db");

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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

export default app;
