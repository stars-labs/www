import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { wallets } from '../db/schema';

const app = new Hono<{
  Variables: {
    db: DrizzleD1Database;
  };
}>();

// Schema validator
const faucetSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string().optional() // Amount in wei (18 decimals)
});

// Testnet faucet - gives free STARS for testing
app.post('/', zValidator('json', faucetSchema), async (c) => {
  const db = c.get('db');
  const { address, amount } = c.req.valid('json');
  
  try {
    // Default to 100 STARS if no amount specified
    const faucetAmount = amount || '100000000000000000000'; // 100 * 10^18
    
    // Check if wallet exists
    const [existingWallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, address.toLowerCase()))
      .limit(1);
    
    if (existingWallet) {
      // Add to existing balance
      const newBalance = (BigInt(existingWallet.balance) + BigInt(faucetAmount)).toString();
      
      await db
        .update(wallets)
        .set({ balance: newBalance })
        .where(eq(wallets.address, address.toLowerCase()));
      
      return c.json({
        success: true,
        address: address.toLowerCase(),
        previousBalance: existingWallet.balance,
        newBalance,
        added: faucetAmount
      });
    } else {
      // Create new wallet with balance
      await db.insert(wallets).values({
        address: address.toLowerCase(),
        balance: faucetAmount,
        nonce: 0
      });
      
      return c.json({
        success: true,
        address: address.toLowerCase(),
        previousBalance: '0',
        newBalance: faucetAmount,
        added: faucetAmount
      });
    }
  } catch (error) {
    console.error('Faucet error:', error);
    return c.json({ 
      error: 'Failed to dispense test STARS',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get faucet status for an address
app.get('/:address', async (c) => {
  const db = c.get('db');
  const address = c.req.param('address');
  
  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return c.json({ error: 'Invalid address format' }, 400);
  }
  
  try {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, address.toLowerCase()))
      .limit(1);
    
    return c.json({
      address: address.toLowerCase(),
      balance: wallet?.balance || '0',
      hasReceivedFunds: !!wallet
    });
  } catch (error) {
    console.error('Faucet status error:', error);
    return c.json({ error: 'Failed to get faucet status' }, 500);
  }
});

export default app;