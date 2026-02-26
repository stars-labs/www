import { Hono } from 'hono';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import {
  blocks,
  miningJobs,
  wallets,
  chainState,
  MINING_REWARD,
  type NewBlock
} from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { createCoinbaseTransaction } from '../crypto/transaction';

const app = new Hono<{
  Variables: {
    db: DrizzleD1Database;
  };
}>();

// Test mining submission with detailed error tracking
app.post('/submit-test', async (c) => {
  const db = c.get('db');
  const { jobId, nonce, minerAddress } = await c.req.json();
  
  try {
    console.log('Step 1: Finding job');
    const [job] = await db
      .select()
      .from(miningJobs)
      .where(and(
        eq(miningJobs.jobId, jobId),
        eq(miningJobs.completed, false)
      ))
      .limit(1);
    
    if (!job) {
      return c.json({ error: 'Step 1 failed: Job not found' }, 400);
    }
    
    console.log('Step 2: Parsing template');
    const template = JSON.parse(job.blockTemplate);
    
    console.log('Step 3: Creating coinbase transaction');
    const coinbaseTx = createCoinbaseTransaction(
      minerAddress,
      MINING_REWARD,
      template.height
    );
    
    console.log('Step 4: Creating block');
    const newBlock: NewBlock = {
      height: template.height,
      hash: 'test-hash-' + Date.now(),
      previousHash: template.previousHash,
      merkleRoot: template.merkleRoot,
      timestamp: template.timestamp,
      difficulty: template.difficulty,
      nonce,
      minerAddress: template.minerAddress,
      reward: MINING_REWARD,
      txCount: 1,
      gasUsed: '0'
    };
    
    console.log('Step 5: Inserting block');
    await db.insert(blocks).values(newBlock);
    
    console.log('Step 6: Checking miner wallet');
    const [minerWallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, minerAddress))
      .limit(1);
    
    console.log('Step 7: Updating/creating miner wallet');
    if (minerWallet) {
      const newBalance = BigInt(minerWallet.balance) + BigInt(MINING_REWARD);
      await db
        .update(wallets)
        .set({ balance: newBalance.toString() })
        .where(eq(wallets.address, minerAddress));
    } else {
      await db.insert(wallets).values({
        address: minerAddress,
        balance: MINING_REWARD,
        nonce: 0
      });
    }
    
    console.log('Step 8: Updating chain state');
    await db
      .update(chainState)
      .set({
        latestHeight: template.height,
        latestHash: newBlock.hash,
        updatedAt: new Date()
      })
      .where(eq(chainState.id, 1));
    
    console.log('All steps completed successfully');
    return c.json({
      success: true,
      message: 'Test mining successful',
      block: newBlock
    });
    
  } catch (error) {
    console.error('Error in test mining:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({
      error: 'Test mining failed',
      details: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

export default app;