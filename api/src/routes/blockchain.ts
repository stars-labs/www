import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { desc, sql } from "drizzle-orm";
import { blocks } from "../db/schema";
import type { DrizzleD1Database } from "drizzle-orm/d1";

const app = new Hono<{
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    db: DrizzleD1Database;
  };
}>();

function clampInt(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = Math.trunc(Number(raw));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

// Get latest blocks. totalBlocks is bundled in so list consumers
// (Explorer) don't need a separate /stats request per refresh.
app.get("/blocks", async (c) => {
  const db = c.get("db");
  const limit = clampInt(c.req.query("limit"), 10, 1, 100);
  const offset = clampInt(c.req.query("offset"), 0, 0, 1_000_000);

  try {
    const [result, totals] = await Promise.all([
      db
        .select()
        .from(blocks)
        .orderBy(desc(blocks.height))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(blocks),
    ]);

    return c.json({
      blocks: result,
      count: result.length,
      totalBlocks: totals[0]?.count ?? 0,
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
        // Visitor blocks must carry the session-derived address format.
        // This keeps the bot's namespace un-spoofable and makes visitor
        // rows identifiable (and purgeable) by prefix.
        minerAddress: z.string().regex(/^0xstu[a-z0-9]{1,20}$/),
        transactionCount: z.number().int().min(0).max(10000).optional(),
        difficulty: z.number().int().min(0).optional(),
        nonce: z.number().int().min(0).optional(),
      }),
    )
    .min(1)
    .max(20),
});

const VISITOR_BLOCK_REWARD = "1000000000000000000"; // matches bot reward (1 token in wei)

// Append-at-tip insert: height and previous_hash are resolved inside the
// statement, and OR IGNORE skips duplicate hashes (blocks.hash is UNIQUE in
// production; visitor hashes are only 32 bits so collisions will happen).
const APPEND_BLOCK_SQL = `
  INSERT OR IGNORE INTO blocks (height, hash, previous_hash, timestamp, difficulty, nonce, miner_address, reward, tx_count, created_at)
  SELECT
    m.h + 1,
    ?1,
    COALESCE((SELECT bb.hash FROM blocks bb WHERE bb.height = m.h), '0x00000000'),
    ?2,
    ?3,
    ?4,
    ?5,
    ?6,
    ?7,
    ?2
  FROM (SELECT COALESCE(MAX(height), 0) AS h FROM blocks) m
`;

app.post("/blocks", zValidator("json", submitBlocksSchema), async (c) => {
  const { blocks: incoming } = c.req.valid("json");

  try {
    const now = Date.now();
    // One D1 batch = one round-trip and one implicit transaction; statements
    // run sequentially inside it, so each INSERT...SELECT sees the previous
    // insert's MAX(height) and the whole batch is all-or-nothing.
    const stmt = c.env.DB.prepare(APPEND_BLOCK_SQL);
    const results = await c.env.DB.batch(
      incoming.map((b) =>
        stmt.bind(
          b.hash,
          now,
          b.difficulty ?? 1,
          String(b.nonce ?? 0),
          b.minerAddress,
          VISITOR_BLOCK_REWARD,
          b.transactionCount ?? 0,
        ),
      ),
    );

    const inserted = results.reduce((n, r) => n + (r.meta?.changes ?? 0), 0);
    return c.json({ inserted, skipped: incoming.length - inserted }, 201);
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

// Get chain statistics. (chain_state is intentionally not queried: the
// table is stale in production — not even the bot maintains it — and no
// frontend consumer reads it.)
app.get("/stats", async (c) => {
  const db = c.get("db");

  try {
    const [totals, recentBlocks] = await Promise.all([
      db
        .select({
          count: sql<number>`count(*)`,
          maxHeight: sql<number>`coalesce(max(${blocks.height}), 0)`,
        })
        .from(blocks),
      db.select().from(blocks).orderBy(desc(blocks.height)).limit(5),
    ]);

    return c.json({
      totalBlocks: totals[0]?.count ?? 0,
      latestHeight: totals[0]?.maxHeight ?? 0,
      recentBlocks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

export default app;
