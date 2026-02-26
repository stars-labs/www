import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import {
  blocks,
  wallets,
  chainState,
  MINING_REWARD,
  GENESIS_SUPPLY,
  type NewBlock,
  type ChainState
} from '../db/schema';
import { hashBlock } from '../crypto/mining';

const app = new Hono<{
  Variables: {
    db: DrizzleD1Database;
  };
}>();

// Initialize blockchain with genesis block
app.post('/genesis', async (c) => {
  const db = c.get('db');
  
  try {
    // Check if already initialized
    const [existingState] = await db
      .select()
      .from(chainState)
      .where(eq(chainState.id, 1))
      .limit(1);
    
    if (existingState) {
      return c.json({ 
        message: 'Blockchain already initialized',
        height: existingState.latestHeight,
        hash: existingState.latestHash
      });
    }
    
    // Create genesis block
    const genesisBlock: NewBlock = {
      height: 0,
      hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
      timestamp: Math.floor(Date.now() / 1000),
      difficulty: 4,
      nonce: '0',
      minerAddress: '0x0000000000000000000000000000000000000000',
      reward: '0',
      txCount: 0,
      gasUsed: '0'
    };
    
    // Insert genesis block
    await db.insert(blocks).values(genesisBlock);
    
    // Initialize chain state
    await db.insert(chainState).values({
      id: 1,
      latestHeight: 0,
      latestHash: genesisBlock.hash,
      totalSupply: '0',
      currentDifficulty: 4,
      nextDifficultyAdjust: 10,
      averageBlockTime: 5000,
      updatedAt: new Date()
    });
    
    // Create a bot wallet with initial supply (optional)
    const botAddress = '0x1000000000000000000000000000000000000001';
    
    // Check if bot wallet already exists
    const [existingBot] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, botAddress))
      .limit(1);
    
    if (!existingBot) {
      await db.insert(wallets).values({
        address: botAddress,
        balance: GENESIS_SUPPLY,
        nonce: 0
      });
    }
    
    return c.json({
      success: true,
      message: 'Blockchain initialized successfully',
      genesis: {
        height: 0,
        hash: genesisBlock.hash,
        timestamp: genesisBlock.timestamp,
        difficulty: 4
      },
      botWallet: {
        address: botAddress,
        balance: GENESIS_SUPPLY
      }
    });
    
  } catch (error) {
    console.error('Error initializing blockchain:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ 
      error: 'Failed to initialize blockchain',
      details: errorMessage 
    }, 500);
  }
});

// Get initialization status
app.get('/status', async (c) => {
  const db = c.get('db');
  
  try {
    const [state] = await db
      .select()
      .from(chainState)
      .where(eq(chainState.id, 1))
      .limit(1);
    
    if (!state) {
      return c.json({
        initialized: false,
        message: 'Blockchain not initialized. Call POST /api/init/genesis to initialize.'
      });
    }
    
    const [latestBlock] = await db
      .select()
      .from(blocks)
      .where(eq(blocks.height, state.latestHeight))
      .limit(1);
    
    return c.json({
      initialized: true,
      currentHeight: state.latestHeight,
      latestHash: state.latestHash,
      totalSupply: state.totalSupply,
      difficulty: state.currentDifficulty,
      latestBlock: latestBlock || null
    });
    
  } catch (error) {
    console.error('Error checking initialization status:', error);
    return c.json({ error: 'Failed to check status' }, 500);
  }
});

// Fix chainState to match latest block
app.post('/fix-chain-state', async (c) => {
  const db = c.get('db');
  
  try {
    // Get the latest block
    const [latestBlock] = await db
      .select()
      .from(blocks)
      .orderBy(desc(blocks.height))
      .limit(1);
    
    if (!latestBlock) {
      return c.json({ error: 'No blocks found' }, 404);
    }
    
    // Update chainState to match
    await db
      .update(chainState)
      .set({
        latestHeight: latestBlock.height,
        latestHash: latestBlock.hash,
        updatedAt: new Date()
      })
      .where(eq(chainState.id, 1));
    
    return c.json({
      success: true,
      message: 'ChainState fixed',
      latestBlock: {
        height: latestBlock.height,
        hash: latestBlock.hash
      }
    });
    
  } catch (error) {
    console.error('Error fixing chainState:', error);
    return c.json({ error: 'Failed to fix chainState' }, 500);
  }
});

export default app;