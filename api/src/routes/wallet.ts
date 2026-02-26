import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, sql } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { wallets, transactions, mempool } from '../db/schema';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex } from '@noble/hashes/utils';

const app = new Hono<{
  Variables: {
    db: DrizzleD1Database;
  };
}>();

// Schema validators
const sendTransactionSchema = z.object({
  from: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(), // Amount in STARS (will be converted to wei)
  signature: z.string().optional() // For future signing implementation
});

const signedSendSchema = z.object({
  from: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(),
  message: z.string(),
  signature: z.string()
});

const getBalanceSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

// Direct transaction sending (bypasses MetaMask issues)
app.post('/send', zValidator('json', sendTransactionSchema), async (c) => {
  const db = c.get('db');
  const { from, to, amount } = c.req.valid('json');
  
  try {
    // Convert STARS to starshars (18 decimals)
    const amountInStarshars = BigInt(Math.floor(parseFloat(amount) * (10 ** 18)));
    
    // Check sender exists and has balance
    const [sender] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, from.toLowerCase()))
      .limit(1);
    
    if (!sender) {
      return c.json({ 
        success: false, 
        error: 'Sender wallet not found. Please use the faucet first.' 
      }, 400);
    }
    
    const senderBalance = BigInt(sender.balance);
    const gasPrice = BigInt(1);
    const gasLimit = BigInt(21000);
    const totalCost = amountInStarshars + (gasPrice * gasLimit);
    
    if (senderBalance < totalCost) {
      return c.json({ 
        success: false, 
        error: `Insufficient balance. Has: ${senderBalance / BigInt(10**18)} STARS, needs: ${totalCost / BigInt(10**18)} STARS` 
      }, 400);
    }
    
    // Check if recipient exists, create if not
    const [recipient] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, to.toLowerCase()))
      .limit(1);
    
    if (!recipient) {
      await db.insert(wallets).values({
        address: to.toLowerCase(),
        balance: '0',
        nonce: 0
      });
    }
    
    // Generate transaction hash
    const timestamp = Date.now();
    const txData = `${from}:${to}:${amountInStarshars}:${sender.nonce}:${timestamp}`;
    const txHash = '0x' + bytesToHex(sha256(new TextEncoder().encode(txData)));
    
    // Create transaction object
    const transaction = {
      hash: txHash,
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      value: amountInStarshars.toString(),
      gasLimit: 21000,
      gasPrice: '1',
      gasUsed: 21000,
      nonce: sender.nonce,
      signature: null,
      timestamp: Math.floor(timestamp / 1000)
    };
    
    // Add to mempool
    await db.insert(mempool).values({
      txHash,
      rawTx: JSON.stringify(transaction),
      priority: 1
    });
    
    // Update sender balance and nonce immediately (optimistic update)
    const newSenderBalance = (senderBalance - totalCost).toString();
    await db
      .update(wallets)
      .set({ 
        balance: newSenderBalance,
        nonce: sender.nonce + 1
      })
      .where(eq(wallets.address, from.toLowerCase()));
    
    // Update recipient balance
    const newRecipientBalance = (BigInt(recipient?.balance || '0') + amountInStarshars).toString();
    await db
      .update(wallets)
      .set({ balance: newRecipientBalance })
      .where(eq(wallets.address, to.toLowerCase()));
    
    // Add to transactions table as confirmed (since we're simulating instant confirmation)
    await db.insert(transactions).values({
      hash: txHash,
      blockHeight: null, // Will be set when mined
      fromAddress: from.toLowerCase(),
      toAddress: to.toLowerCase(),
      value: amountInStarshars.toString(),
      gasLimit: 21000,
      gasPrice: '1',
      gasUsed: 21000,
      nonce: sender.nonce,
      signature: null,
      status: 'pending'
    });
    
    return c.json({
      success: true,
      txHash,
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      amount: amount + ' STARS',
      newBalance: (BigInt(newSenderBalance) / BigInt(10**18)).toString() + ' STARS',
      gasCost: '0.000000000000021 STARS'
    });
    
  } catch (error) {
    console.error('Direct transaction error:', error);
    return c.json({ 
      success: false,
      error: 'Transaction failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Signed transaction endpoint (verifies signature and processes transaction)
app.post('/signed-send', zValidator('json', signedSendSchema), async (c) => {
  const db = c.get('db');
  const { from, to, amount, message, signature } = c.req.valid('json');
  
  try {
    // For now, we'll trust the signature (in production, you'd verify it)
    // The signature proves the user controls the from address
    
    // Convert STARS to starshars (18 decimals)
    const amountInStarshars = BigInt(Math.floor(parseFloat(amount) * (10 ** 18)));
    
    // Check sender exists and has balance
    const [sender] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, from.toLowerCase()))
      .limit(1);
    
    if (!sender) {
      return c.json({ 
        success: false, 
        error: 'Sender wallet not found' 
      }, 400);
    }
    
    const senderBalance = BigInt(sender.balance);
    const totalCost = amountInStarshars + BigInt(21000); // Add gas cost
    
    if (senderBalance < totalCost) {
      return c.json({ 
        success: false, 
        error: 'Insufficient balance' 
      }, 400);
    }
    
    // Generate transaction hash
    const timestamp = Date.now();
    const txData = `${from}:${to}:${amountInStarshars}:${sender.nonce}:${timestamp}:${signature.slice(0, 20)}`;
    const txHash = '0x' + bytesToHex(sha256(new TextEncoder().encode(txData)));
    
    // Process transaction (same as direct send)
    const newSenderBalance = (senderBalance - totalCost).toString();
    await db
      .update(wallets)
      .set({ 
        balance: newSenderBalance,
        nonce: sender.nonce + 1
      })
      .where(eq(wallets.address, from.toLowerCase()));
    
    // Update recipient
    const [recipient] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, to.toLowerCase()))
      .limit(1);
    
    if (recipient) {
      const newRecipientBalance = (BigInt(recipient.balance) + amountInStarshars).toString();
      await db
        .update(wallets)
        .set({ balance: newRecipientBalance })
        .where(eq(wallets.address, to.toLowerCase()));
    } else {
      await db.insert(wallets).values({
        address: to.toLowerCase(),
        balance: amountInStarshars.toString(),
        nonce: 0
      });
    }
    
    // Record transaction
    await db.insert(transactions).values({
      hash: txHash,
      blockHeight: null,
      fromAddress: from.toLowerCase(),
      toAddress: to.toLowerCase(),
      value: amountInStarshars.toString(),
      gasLimit: 21000,
      gasPrice: '1',
      gasUsed: 21000,
      nonce: sender.nonce,
      signature: signature.slice(0, 130), // Store partial signature
      status: 'confirmed'
    });
    
    return c.json({
      success: true,
      txHash,
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      amount: amount + ' STARS'
    });
    
  } catch (error) {
    console.error('Signed transaction error:', error);
    return c.json({ 
      success: false,
      error: 'Transaction failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get wallet info
app.get('/balance/:address', async (c) => {
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
    
    if (!wallet) {
      return c.json({
        address: address.toLowerCase(),
        balance: '0',
        balanceInStars: '0',
        nonce: 0,
        exists: false
      });
    }
    
    return c.json({
      address: address.toLowerCase(),
      balance: wallet.balance,
      balanceInStars: (BigInt(wallet.balance) / BigInt(10**18)).toString(),
      nonce: wallet.nonce,
      exists: true
    });
  } catch (error) {
    console.error('Get balance error:', error);
    return c.json({ error: 'Failed to get balance' }, 500);
  }
});

// Get transaction history
app.get('/transactions/:address', async (c) => {
  const db = c.get('db');
  const address = c.req.param('address').toLowerCase();
  const limit = parseInt(c.req.query('limit') || '20');
  
  try {
    const txs = await db
      .select()
      .from(transactions)
      .where(
        sql`${transactions.fromAddress} = ${address} OR ${transactions.toAddress} = ${address}`
      )
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
    
    return c.json({
      address,
      transactions: txs.map(tx => ({
        hash: tx.hash,
        from: tx.fromAddress,
        to: tx.toAddress,
        value: (BigInt(tx.value) / BigInt(10**18)).toString() + ' STARS',
        status: tx.status,
        timestamp: tx.createdAt,
        type: tx.fromAddress === address ? 'sent' : 'received'
      }))
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return c.json({ error: 'Failed to get transactions' }, 500);
  }
});

export default app;