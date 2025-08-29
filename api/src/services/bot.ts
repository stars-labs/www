import { eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { 
  generateWallet, 
  recoverWallet, 
  encryptData, 
  decryptData,
  generateRandomAddress 
} from '../crypto/wallet';
import { 
  signTransaction, 
  createCoinbaseTransaction,
  type RawTransaction 
} from '../crypto/transaction';
import { hashBlock, calculateMerkleRoot } from '../crypto/mining';
import {
  botConfig,
  wallets,
  blocks,
  transactions,
  mempool,
  chainState,
  GENESIS_SUPPLY,
  STARS_TO_STARSHARS,
  type BotConfig,
  type NewBlock,
  type NewWallet,
  type NewTransaction,
  type NewMempoolEntry
} from '../db/schema';

export class BlockchainBot {
  private db: DrizzleD1Database;
  private config?: BotConfig;
  private encryptionSecret: string;
  
  constructor(db: DrizzleD1Database, encryptionSecret: string) {
    this.db = db;
    this.encryptionSecret = encryptionSecret || 'default-dev-secret';
  }
  
  // Initialize bot and genesis block
  async initialize(): Promise<void> {
    // Check if bot already exists
    const [existingBot] = await this.db.select().from(botConfig).limit(1);
    
    if (existingBot) {
      this.config = existingBot;
      console.log('Bot already initialized:', existingBot.address);
      return;
    }
    
    console.log('Initializing bot and genesis block...');
    
    // Generate new wallet for bot
    const wallet = generateWallet();
    console.log('Generated bot wallet:', wallet.address);
    
    // Encrypt sensitive data
    const encryptedMnemonic = encryptData(wallet.mnemonic, this.encryptionSecret);
    const encryptedPrivateKey = encryptData(wallet.privateKey, this.encryptionSecret);
    
    // Save bot config
    const [newBot] = await this.db.insert(botConfig).values({
      id: 1,
      mnemonic: encryptedMnemonic,
      address: wallet.address,
      privateKey: encryptedPrivateKey,
      txCount: 0
    }).returning();
    
    this.config = newBot;
    
    // Create bot wallet with genesis supply
    await this.db.insert(wallets).values({
      address: wallet.address,
      balance: GENESIS_SUPPLY,
      nonce: 0
    });
    
    // Create genesis block
    await this.createGenesisBlock(wallet.address);
    
    console.log('Bot initialized with address:', wallet.address);
    console.log('Genesis supply:', GENESIS_SUPPLY, 'starshars');
  }
  
  // Create the genesis block
  private async createGenesisBlock(botAddress: string): Promise<void> {
    // Create coinbase transaction for genesis
    const coinbaseTx = createCoinbaseTransaction(botAddress, GENESIS_SUPPLY, 0);
    
    // Save genesis transaction
    await this.db.insert(transactions).values({
      hash: coinbaseTx.hash,
      blockHeight: 0,
      fromAddress: coinbaseTx.from,
      toAddress: coinbaseTx.to,
      value: coinbaseTx.value,
      gasLimit: 0,
      gasPrice: '0',
      gasUsed: 0,
      nonce: 0,
      signature: null,
      status: 'confirmed'
    });
    
    // Create genesis block
    const genesisBlock = {
      height: 0,
      previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      merkleRoot: calculateMerkleRoot([coinbaseTx.hash]),
      timestamp: Math.floor(Date.now() / 1000),
      difficulty: 4,
      nonce: '0',
      minerAddress: botAddress,
      reward: GENESIS_SUPPLY,
      txCount: 1,
      gasUsed: '0'
    };
    
    // Calculate genesis block hash
    const header = [
      genesisBlock.height,
      genesisBlock.previousHash,
      genesisBlock.merkleRoot,
      genesisBlock.timestamp,
      genesisBlock.difficulty,
      genesisBlock.minerAddress
    ].join(':');
    
    const hash = hashBlock(header, genesisBlock.nonce);
    
    // Save genesis block
    await this.db.insert(blocks).values({
      ...genesisBlock,
      hash
    });
    
    // Initialize chain state
    await this.db.insert(chainState).values({
      id: 1,
      latestHeight: 0,
      latestHash: hash,
      totalSupply: GENESIS_SUPPLY,
      currentDifficulty: 4,
      nextDifficultyAdjust: 10,
      averageBlockTime: 5000
    });
    
    console.log('Genesis block created:', hash);
  }
  
  // Send a random transaction
  async sendRandomTransaction(): Promise<string | null> {
    if (!this.config) {
      console.error('Bot not initialized');
      return null;
    }
    
    try {
      // Decrypt private key
      const privateKey = decryptData(this.config.privateKey, this.encryptionSecret);
      
      // Get bot's current balance and nonce
      const [botWallet] = await this.db
        .select()
        .from(wallets)
        .where(eq(wallets.address, this.config.address))
        .limit(1);
      
      if (!botWallet) {
        console.error('Bot wallet not found');
        return null;
      }
      
      const balance = BigInt(botWallet.balance);
      
      // Generate random recipient
      const recipient = generateRandomAddress();
      
      // Random amount between 0.1 and 10 STARS
      const minAmount = STARS_TO_STARSHARS / 10n; // 0.1 STARS
      const maxAmount = STARS_TO_STARSHARS * 10n; // 10 STARS
      const randomAmount = minAmount + BigInt(Math.floor(Math.random() * Number(maxAmount - minAmount)));
      
      // Check if bot has enough balance (including gas)
      const gasLimit = 21000;
      const gasPrice = '100'; // 100 starshars
      const totalCost = randomAmount + BigInt(gasLimit) * BigInt(gasPrice);
      
      if (balance < totalCost) {
        console.log('Bot balance too low for transaction');
        return null;
      }
      
      // Create transaction
      const rawTx: RawTransaction = {
        from: this.config.address,
        to: recipient,
        value: randomAmount.toString(),
        nonce: botWallet.nonce,
        gasLimit,
        gasPrice,
        timestamp: Date.now()
      };
      
      // Sign transaction
      const signedTx = signTransaction(rawTx, privateKey);
      
      // Add to mempool
      await this.db.insert(mempool).values({
        txHash: signedTx.hash,
        rawTx: JSON.stringify(signedTx),
        priority: parseInt(gasPrice)
      });
      
      // Update bot nonce
      await this.db
        .update(wallets)
        .set({ nonce: botWallet.nonce + 1 })
        .where(eq(wallets.address, this.config.address));
      
      // Update bot stats
      await this.db
        .update(botConfig)
        .set({ 
          txCount: this.config.txCount + 1,
          lastTxAt: new Date()
        })
        .where(eq(botConfig.id, 1));
      
      console.log(`Bot sent ${Number(randomAmount) / Number(STARS_TO_STARSHARS)} STARS to ${recipient}`);
      return signedTx.hash;
      
    } catch (error) {
      console.error('Error sending bot transaction:', error);
      return null;
    }
  }
  
  // Start bot transaction loop
  async startTransactionLoop(): Promise<void> {
    // Send a transaction every 1-3 seconds
    const sendTransaction = async () => {
      await this.sendRandomTransaction();
      
      // Random delay between 1-3 seconds
      const delay = 1000 + Math.random() * 2000;
      setTimeout(sendTransaction, delay);
    };
    
    // Start the loop
    sendTransaction();
  }
  
  // Get bot stats
  async getStats(): Promise<BotConfig | null> {
    if (!this.config) return null;
    
    const [stats] = await this.db
      .select()
      .from(botConfig)
      .where(eq(botConfig.id, 1))
      .limit(1);
    
    return stats || null;
  }
}