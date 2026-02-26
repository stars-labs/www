import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, and, sql, lt, gte } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import {
  blocks,
  transactions,
  mempool,
  miningJobs,
  wallets,
  chainState,
  MINING_REWARD,
  type NewBlock,
  type NewTransaction,
  type NewMiningJob,
  type MiningJob
} from '../db/schema';
import {
  calculateTarget,
  verifyPoW,
  calculateMerkleRoot,
  generateJobId,
  createBlockHeader,
  hashBlock,
  adjustDifficulty
} from '../crypto/mining';
import { createCoinbaseTransaction, hashTransaction } from '../crypto/transaction';

const app = new Hono<{
  Variables: {
    db: DrizzleD1Database;
  };
}>();

// Schema validators
const getMiningJobSchema = z.object({
  minerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

const submitSolutionSchema = z.object({
  jobId: z.string(),
  nonce: z.string(),
  minerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

// Get mining job
app.post('/job', zValidator('json', getMiningJobSchema), async (c) => {
  const db = c.get('db');
  const { minerAddress } = c.req.valid('json');
  
  try {
    // Clean up expired jobs
    const now = new Date();
    await db
      .delete(miningJobs)
      .where(lt(miningJobs.expiresAt, now));
    
    // Get chain state
    const [state] = await db
      .select()
      .from(chainState)
      .where(eq(chainState.id, 1))
      .limit(1);
    
    if (!state) {
      return c.json({ error: 'Chain not initialized' }, 500);
    }
    
    // Get pending transactions from mempool (max 100)
    const pendingTxs = await db
      .select()
      .from(mempool)
      .orderBy(desc(mempool.priority))
      .limit(100);
    
    // Parse transactions from mempool and ensure they have hashes
    const txList = pendingTxs.map(entry => {
      const tx = JSON.parse(entry.rawTx);
      return {
        ...tx,
        hash: entry.txHash
      };
    });
    
    // Create coinbase transaction
    const coinbaseTx = createCoinbaseTransaction(
      minerAddress,
      MINING_REWARD,
      state.latestHeight + 1
    );
    
    // All transaction hashes (coinbase + regular)
    // Filter out any undefined or invalid hashes
    const txHashes = [
      coinbaseTx.hash,
      ...txList.map(tx => tx.hash).filter(hash => hash && hash.startsWith('0x'))
    ];
    
    // Create block template
    const blockTemplate = {
      height: state.latestHeight + 1,
      previousHash: state.latestHash,
      merkleRoot: calculateMerkleRoot(txHashes),
      timestamp: Math.floor(Date.now() / 1000),
      difficulty: state.currentDifficulty,
      minerAddress,
      transactions: [coinbaseTx, ...txList]
    };
    
    // Generate job ID and calculate target
    const jobId = generateJobId();
    const target = calculateTarget(state.currentDifficulty);
    
    // Store mining job (expires based on difficulty)
    // Higher difficulty needs significantly more time to find solutions
    let jobTimeout = 60000; // Default 1 minute
    if (state.currentDifficulty >= 5) {
      jobTimeout = 600000; // 10 minutes for difficulty 5+
    } else if (state.currentDifficulty >= 4) {
      jobTimeout = 300000; // 5 minutes for difficulty 4
    }
    const expiresAt = new Date(Date.now() + jobTimeout);
    
    await db.insert(miningJobs).values({
      jobId,
      blockTemplate: JSON.stringify(blockTemplate),
      target,
      minerAddress,
      expiresAt,
      completed: false
    });
    
    // Return job to miner
    return c.json({
      jobId,
      blockTemplate: {
        height: blockTemplate.height,
        previousHash: blockTemplate.previousHash,
        merkleRoot: blockTemplate.merkleRoot,
        timestamp: blockTemplate.timestamp,
        difficulty: blockTemplate.difficulty,
        minerAddress: blockTemplate.minerAddress,
        txCount: blockTemplate.transactions.length
      },
      target,
      expiresAt: expiresAt.toISOString()
    });
    
  } catch (error) {
    console.error('Error creating mining job:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ 
      error: 'Failed to create mining job',
      details: errorMessage 
    }, 500);
  }
});

// Submit mining solution
app.post('/submit', zValidator('json', submitSolutionSchema), async (c) => {
  const db = c.get('db');
  const { jobId, nonce, minerAddress } = c.req.valid('json');
  
  try {
    // Get the job
    const [job] = await db
      .select()
      .from(miningJobs)
      .where(and(
        eq(miningJobs.jobId, jobId),
        eq(miningJobs.completed, false)
      ))
      .limit(1);
    
    if (!job) {
      return c.json({ 
        accepted: false, 
        reason: 'Job not found or already completed' 
      }, 400);
    }
    
    // Check if job expired
    if (new Date() > job.expiresAt) {
      return c.json({ 
        accepted: false, 
        reason: 'Job expired' 
      }, 400);
    }
    
    // Parse block template
    const template = JSON.parse(job.blockTemplate);
    
    // Create block header for verification
    const blockHeader = createBlockHeader({
      height: template.height,
      previousHash: template.previousHash,
      merkleRoot: template.merkleRoot,
      timestamp: template.timestamp,
      difficulty: template.difficulty,
      minerAddress: template.minerAddress
    });
    
    // Verify PoW
    const { valid, hash } = verifyPoW(blockHeader, nonce, job.target);
    
    if (!valid) {
      return c.json({ 
        accepted: false, 
        reason: 'Invalid proof of work' 
      }, 400);
    }
    
    // Start transaction to add block
    try {
      // First check if this job ID has already been submitted
      const [existingJob] = await db
        .select({ completed: miningJobs.completed })
        .from(miningJobs)
        .where(eq(miningJobs.jobId, jobId))
        .limit(1);

      if (existingJob?.completed) {
        return c.json({
          accepted: false,
          reason: 'Job already completed'
        }, 400);
      }

      // Mark job as completed before processing
      await db
        .update(miningJobs)
        .set({ completed: true })
        .where(eq(miningJobs.jobId, jobId));
      
      // Calculate total gas used safely
      let totalGasUsed = 0n;
      try {
        for (const tx of template.transactions.slice(1)) { // Skip coinbase
          const gasUsed = BigInt(tx.gasUsed || 21000);
          totalGasUsed += gasUsed;
        }
      } catch (gasError) {
        console.warn('Error calculating gas used, using default:', gasError);
        totalGasUsed = BigInt(template.transactions.length * 21000);
      }
      
      // Create new block with validated data
      const newBlock: NewBlock = {
        height: template.height,
        hash,
        previousHash: template.previousHash,
        merkleRoot: template.merkleRoot,
        timestamp: template.timestamp,
        difficulty: template.difficulty,
        nonce: String(nonce), // Ensure nonce is string
        minerAddress: template.minerAddress,
        reward: MINING_REWARD,
        txCount: template.transactions.length,
        gasUsed: totalGasUsed.toString()
      };
      
      console.log(`Attempting to insert block at height ${template.height} with hash ${hash}`);
      
      // Insert block with proper error handling
      let blockInserted = false;
      try {
        await db.insert(blocks).values(newBlock);
        blockInserted = true;
        console.log(`Successfully inserted block at height ${template.height}`);
      } catch (blockInsertError: any) {
        console.error('Block insert error:', blockInsertError);
        
        // Handle specific SQLite constraint errors
        if (blockInsertError.message?.includes('UNIQUE constraint failed: blocks.height') ||
            blockInsertError.message?.includes('constraint failed')) {
          return c.json({
            accepted: false,
            reason: 'Block height already mined by another miner'
          }, 409);
        }
        
        // Handle other constraint errors
        if (blockInsertError.message?.includes('constraint') ||
            blockInsertError.message?.includes('FOREIGN KEY')) {
          return c.json({
            accepted: false,
            reason: 'Database constraint violation',
            details: blockInsertError.message
          }, 400);
        }
        
        throw blockInsertError; // Re-throw other errors
      }
      
      // Process transactions with error handling
      for (const tx of template.transactions) {
        try {
          // Skip coinbase (already has special handling)
          if (tx.from === '0x0000000000000000000000000000000000000000') {
            // Check if transaction already exists
            const [existingTx] = await db
              .select({ hash: transactions.hash })
              .from(transactions)
              .where(eq(transactions.hash, tx.hash))
              .limit(1);

            if (!existingTx) {
              await db.insert(transactions).values({
                hash: tx.hash,
                blockHeight: template.height,
                fromAddress: tx.from,
                toAddress: tx.to,
                value: tx.value,
                gasLimit: 0,
                gasPrice: '0',
                gasUsed: 0,
                nonce: tx.nonce,
                signature: tx.signature || null,
                status: 'confirmed'
              });
            }
          } else {
            // Regular transaction - check for duplicates first
            const [existingRegularTx] = await db
              .select({ hash: transactions.hash })
              .from(transactions)
              .where(eq(transactions.hash, tx.hash))
              .limit(1);

            if (!existingRegularTx) {
              await db.insert(transactions).values({
                hash: tx.hash,
                blockHeight: template.height,
                fromAddress: tx.from,
                toAddress: tx.to,
                value: tx.value,
                gasLimit: tx.gasLimit,
                gasPrice: tx.gasPrice,
                gasUsed: tx.gasUsed || 21000,
                nonce: tx.nonce,
                signature: tx.signature,
                status: 'confirmed'
              });

              // Only update balances for new transactions
              // Update sender balance and nonce
              const [senderWallet] = await db
                .select()
                .from(wallets)
                .where(eq(wallets.address, tx.from))
                .limit(1);
              
              if (senderWallet) {
                const cost = BigInt(tx.value) + BigInt(tx.gasUsed || 21000) * BigInt(tx.gasPrice);
                const newBalance = BigInt(senderWallet.balance) - cost;
                
                await db
                  .update(wallets)
                  .set({ 
                    balance: newBalance.toString(),
                    nonce: senderWallet.nonce + 1
                  })
                  .where(eq(wallets.address, tx.from));
              }
              
              // Update recipient balance
              const [recipientWallet] = await db
                .select()
                .from(wallets)
                .where(eq(wallets.address, tx.to))
                .limit(1);
              
              if (recipientWallet) {
                const newBalance = BigInt(recipientWallet.balance) + BigInt(tx.value);
                await db
                  .update(wallets)
                  .set({ balance: newBalance.toString() })
                  .where(eq(wallets.address, tx.to));
              } else {
                // Create new wallet for recipient
                await db.insert(wallets).values({
                  address: tx.to,
                  balance: tx.value,
                  nonce: 0
                });
              }
            }
        }
        
        // Remove from mempool
        await db
          .delete(mempool)
          .where(eq(mempool.txHash, tx.hash));

        } catch (txError: any) {
          console.error(`Transaction ${tx.hash} processing failed:`, txError);
          // Handle constraint violations gracefully
          if (txError.message?.includes('UNIQUE constraint failed') ||
              txError.message?.includes('constraint')) {
            console.log(`Transaction ${tx.hash} already exists, skipping...`);
          } else {
            // Log other errors but continue processing
            console.error(`Unexpected error processing tx ${tx.hash}:`, txError);
          }
        }
      }
      
      // Credit miner with reward
      const [minerWallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.address, minerAddress))
        .limit(1);
      
      if (minerWallet) {
        const newBalance = BigInt(minerWallet.balance) + BigInt(MINING_REWARD);
        await db
          .update(wallets)
          .set({ balance: newBalance.toString() })
          .where(eq(wallets.address, minerAddress));
      } else {
        // Create wallet for miner
        await db.insert(wallets).values({
          address: minerAddress,
          balance: MINING_REWARD,
          nonce: 0
        });
      }
      
      // Update chain state
      const [currentState] = await db
        .select()
        .from(chainState)
        .where(eq(chainState.id, 1))
        .limit(1);
      
      // Check if difficulty adjustment is needed
      let newDifficulty = currentState?.currentDifficulty || 4;
      let nextAdjust = currentState?.nextDifficultyAdjust || 10;
      
      if (template.height >= nextAdjust) {
        // Calculate average block time for last 10 blocks
        const recentBlocks = await db
          .select()
          .from(blocks)
          .where(gte(blocks.height, template.height - 10))
          .orderBy(blocks.height);
        
        if (recentBlocks.length >= 10) {
          const timeSpan = recentBlocks[recentBlocks.length - 1].timestamp - recentBlocks[0].timestamp;
          const avgBlockTime = timeSpan * 1000 / (recentBlocks.length - 1); // Convert to ms
          
          // Adjust difficulty (target is 5 seconds)
          newDifficulty = adjustDifficulty(
            currentState?.currentDifficulty || 4,
            avgBlockTime,
            5000
          );
          
          nextAdjust = template.height + 10;
        }
      }
      
      // Update total supply and chain state
      const newSupply = BigInt(currentState?.totalSupply || '0') + BigInt(MINING_REWARD);
      
      console.log(`Updating chainState: height ${template.height}, hash ${hash}`);
      try {
        await db
          .update(chainState)
          .set({
            latestHeight: template.height,
            latestHash: hash,
            totalSupply: newSupply.toString(),
            currentDifficulty: newDifficulty,
            nextDifficultyAdjust: nextAdjust,
            updatedAt: new Date()
          })
          .where(eq(chainState.id, 1));
        console.log(`ChainState updated successfully to height ${template.height}`);
      } catch (chainUpdateError) {
        console.error('Error updating chainState:', chainUpdateError);
        throw chainUpdateError;
      }
      
      return c.json({
        accepted: true,
        block: {
          height: template.height,
          hash,
          reward: MINING_REWARD,
          difficulty: template.difficulty,
          txCount: template.transactions.length
        }
      });
      
    } catch (error) {
      console.error('Error processing block:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ 
        accepted: false, 
        reason: 'Failed to process block',
        details: errorMessage
      }, 500);
    }
    
  } catch (error) {
    console.error('Error submitting solution:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ 
      error: 'Failed to submit solution',
      details: errorMessage 
    }, 500);
  }
});

// Get mining statistics
app.get('/stats', async (c) => {
  const db = c.get('db');
  
  try {
    const [state] = await db
      .select()
      .from(chainState)
      .where(eq(chainState.id, 1))
      .limit(1);
    
    const [latestBlock] = await db
      .select()
      .from(blocks)
      .orderBy(desc(blocks.height))
      .limit(1);
    
    const activeJobs = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(miningJobs)
      .where(and(
        eq(miningJobs.completed, false),
        gte(miningJobs.expiresAt, new Date())
      ));
    
    return c.json({
      currentHeight: state?.latestHeight || 0,
      currentDifficulty: state?.currentDifficulty || 4,
      totalSupply: state?.totalSupply || '0',
      lastBlockTime: latestBlock?.timestamp || 0,
      activeMiners: activeJobs[0]?.count || 0,
      nextDifficultyAdjust: state?.nextDifficultyAdjust || 10,
      targetBlockTime: 5000, // 5 seconds in ms
      miningReward: MINING_REWARD
    });
    
  } catch (error) {
    console.error('Error fetching mining stats:', error);
    return c.json({ error: 'Failed to fetch mining stats' }, 500);
  }
});

export default app;