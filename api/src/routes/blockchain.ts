import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { desc, sql } from "drizzle-orm";
import { blocks, chainState } from "../db/schema";
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

// Submit visitor-mined blocks to the shared chain. The server appends each
// block at the current tip (next height, previousHash = tip hash) atomically,
// so visitor blocks interleave safely with the mining bot's blocks.
// Batched uploads keep request volume within the Cloudflare free tier.
const submitBlocksSchema = z.object({
  blocks: z
    .array(
      z.object({
        hash: z.string().min(1).max(80),
        minerAddress: z.string().min(1).max(80),
        transactionCount: z.number().int().min(0).max(10000).optional(),
        difficulty: z.number().int().min(0).optional(),
        nonce: z.number().int().min(0).optional(),
      }),
    )
    .min(1)
    .max(20),
});

const VISITOR_BLOCK_REWARD = "1000000000000000000"; // matches bot reward (1 token in wei)

app.post("/blocks", zValidator("json", submitBlocksSchema), async (c) => {
  const db = c.get("db");
  const { blocks: incoming } = c.req.valid("json");

  try {
    const now = Date.now();
    let inserted = 0;

    for (const b of incoming) {
      // Atomic append-at-tip: height and previous_hash are resolved inside
      // the INSERT so concurrent miners (visitors or the bot) never collide.
      await db.run(sql`
        INSERT INTO blocks (height, hash, previous_hash, timestamp, difficulty, nonce, miner_address, reward, tx_count, created_at)
        SELECT
          m.h + 1,
          ${b.hash},
          COALESCE((SELECT bb.hash FROM blocks bb WHERE bb.height = m.h), '0x00000000'),
          ${now},
          ${b.difficulty ?? 1},
          ${String(b.nonce ?? 0)},
          ${b.minerAddress},
          ${VISITOR_BLOCK_REWARD},
          ${b.transactionCount ?? 0},
          ${now}
        FROM (SELECT COALESCE(MAX(height), 0) AS h FROM blocks) m
      `);
      inserted++;
    }

    return c.json({ inserted }, 201);
  } catch (error) {
    console.error("Error submitting blocks:", error);
    return c.json({ error: "Failed to submit blocks" }, 500);
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
