import { Hono } from 'hono';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { eq, desc, sql, and, gte } from 'drizzle-orm';
import {
  wallets,
  transactions,
  mempool,
  blocks,
  chainState,
  STARS_TO_STARSHARS,
  type NewTransaction,
  type NewMempoolEntry,
  type NewWallet
} from '../db/schema';
import { hashTransaction } from '../crypto/transaction';

const app = new Hono<{
  Variables: {
    db: DrizzleD1Database;
  };
}>();

// Bot wallet address (hardcoded for simplicity)
const BOT_ADDRESS = '0x1000000000000000000000000000000000000001';

// Generate random address (without crypto dependencies)
function generateRandomAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * 16)];
  }
  return address;
}

// Create bot transaction
app.post('/send-random', async (c) => {
  const db = c.get('db');
  
  try {
    // Get bot wallet
    const [botWallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, BOT_ADDRESS))
      .limit(1);
    
    if (!botWallet) {
      // Initialize bot wallet with some balance
      await db.insert(wallets).values({
        address: BOT_ADDRESS,
        balance: (1000n * STARS_TO_STARSHARS).toString(),
        nonce: 0
      });
      
      return c.json({ 
        message: 'Bot wallet initialized',
        address: BOT_ADDRESS 
      });
    }
    
    // Check bot balance
    const botBalance = BigInt(botWallet.balance);
    if (botBalance < STARS_TO_STARSHARS / 100n) { // Min 0.01 STARS
      return c.json({ 
        error: 'Bot balance too low',
        balance: botWallet.balance 
      }, 400);
    }
    
    // Generate random recipient
    const recipientAddress = generateRandomAddress();
    
    // Send exactly 1 starshar (minimal amount)
    const randomAmount = 1n;
    
    // Create transaction
    const tx = {
      from: BOT_ADDRESS,
      to: recipientAddress,
      value: randomAmount.toString(),
      nonce: botWallet.nonce,
      gasLimit: 21000,
      gasPrice: '1',
      timestamp: Date.now()
    };
    
    // Simple hash (without crypto dependencies)
    const txData = `${tx.from}:${tx.to}:${tx.value}:${tx.nonce}:${tx.timestamp}`;
    // Create a simple hash that's always 64 hex characters
    let hashNum = 0;
    for (let i = 0; i < txData.length; i++) {
      hashNum = ((hashNum << 5) - hashNum) + txData.charCodeAt(i);
      hashNum = hashNum & 0xFFFFFFFF; // Keep it 32-bit
    }
    // Convert to hex and pad to 64 characters
    const txHash = '0x' + Math.abs(hashNum).toString(16).padStart(8, '0') + 
                   Date.now().toString(16).padStart(12, '0') +
                   Math.random().toString(16).substring(2, 18).padStart(16, '0') +
                   ''.padStart(28, '0');
    
    // Add to mempool
    await db.insert(mempool).values({
      txHash,
      rawTx: JSON.stringify(tx),
      priority: 1
    });
    
    // Update bot nonce
    await db
      .update(wallets)
      .set({ nonce: botWallet.nonce + 1 })
      .where(eq(wallets.address, BOT_ADDRESS));
    
    // Create or update recipient wallet
    const [recipientWallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, recipientAddress))
      .limit(1);
    
    if (!recipientWallet) {
      await db.insert(wallets).values({
        address: recipientAddress,
        balance: '0',
        nonce: 0
      });
    }
    
    return c.json({
      success: true,
      transaction: {
        hash: txHash,
        from: BOT_ADDRESS,
        to: recipientAddress,
        value: randomAmount.toString(),
        timestamp: tx.timestamp
      }
    });
    
  } catch (error) {
    console.error('Bot transaction error:', error);
    return c.json({ 
      error: 'Failed to create bot transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Auto-trigger bot transactions (called by cron or external service)
app.post('/auto-send', async (c) => {
  const db = c.get('db');
  
  try {
    // Send 1-3 random transactions
    const numTx = 1 + Math.floor(Math.random() * 3);
    const results = [];
    
    for (let i = 0; i < numTx; i++) {
      // Call send-random endpoint logic
      const response = await fetch(c.req.url.replace('/auto-send', '/send-random'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      results.push(result);
      
      // Small delay between transactions
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return c.json({
      success: true,
      transactions: results.filter(r => r.success).length,
      results
    });
    
  } catch (error) {
    console.error('Auto-send error:', error);
    return c.json({ 
      error: 'Failed to auto-send transactions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get bot status
app.get('/status', async (c) => {
  const db = c.get('db');
  
  try {
    // Get bot wallet
    const [botWallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, BOT_ADDRESS))
      .limit(1);
    
    if (!botWallet) {
      return c.json({
        initialized: false,
        message: 'Bot not initialized'
      });
    }
    
    // Count bot transactions
    const [txCount] = await db
      .select({ count: sql`COUNT(*)` })
      .from(transactions)
      .where(eq(transactions.fromAddress, BOT_ADDRESS));
    
    // Get mempool transactions from bot
    const [mempoolCount] = await db
      .select({ count: sql`COUNT(*)` })
      .from(mempool);
    
    return c.json({
      initialized: true,
      address: BOT_ADDRESS,
      balance: botWallet.balance,
      nonce: botWallet.nonce,
      totalTransactions: Number(txCount.count),
      pendingTransactions: Number(mempoolCount.count)
    });
    
  } catch (error) {
    console.error('Bot status error:', error);
    return c.json({ 
      error: 'Failed to get bot status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;