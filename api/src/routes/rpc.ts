import { Hono } from 'hono';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { hashBlock } from '../crypto/mining';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex } from '@noble/hashes/utils';
import { ethers } from 'ethers';

const rpc = new Hono<{
  Variables: {
    db: DrizzleD1Database<typeof schema>;
  };
}>();

// Ethereum JSON-RPC 2.0 handler
rpc.post('/', async (c) => {
  const db = c.get('db');
  const body = await c.req.json();
  
  // Handle batch requests
  if (Array.isArray(body)) {
    const responses = await Promise.all(
      body.map(req => handleRpcRequest(db, req))
    );
    return c.json(responses);
  }
  
  // Handle single request
  const response = await handleRpcRequest(db, body);
  return c.json(response);
});

async function handleRpcRequest(
  db: DrizzleD1Database<typeof schema>,
  request: any
): Promise<any> {
  const { jsonrpc, method, params, id } = request;
  
  if (jsonrpc !== '2.0') {
    return createError(id, -32600, 'Invalid Request');
  }
  
  try {
    const result = await handleMethod(db, method, params || []);
    return {
      jsonrpc: '2.0',
      result,
      id
    };
  } catch (error: any) {
    console.error(`RPC error for method ${method}:`, error);
    
    // Handle specific error cases
    if (error.message?.includes('Insufficient')) {
      return createError(id, -32000, error.message);
    }
    
    return createError(id, error.code || -32603, error.message || 'Internal error');
  }
}

async function handleMethod(
  db: DrizzleD1Database<typeof schema>,
  method: string,
  params: any[]
): Promise<any> {
  console.log(`RPC method called: ${method}`, params);
  switch (method) {
    // Network methods
    case 'net_version':
      return '7827'; // STARS network ID (spells STAR on phone keypad)
      
    case 'net_listening':
      return true;
      
    case 'net_peerCount':
      return '0x1'; // Always show 1 peer (the server)
      
    // Web3 methods
    case 'web3_clientVersion':
      return 'StarsLab/1.0.0';
      
    case 'web3_sha3':
      const data = params[0].replace('0x', '');
      const dataBytes = new Uint8Array(data.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []);
      const hashBytes = sha256(dataBytes);
      return '0x' + bytesToHex(hashBytes);
      
    // Eth methods
    case 'eth_chainId':
      return '0x1e93'; // 7827 in hex
      
    case 'eth_blockNumber':
      const [latestBlock] = await db
        .select({ height: schema.blocks.height })
        .from(schema.blocks)
        .orderBy(desc(schema.blocks.height))
        .limit(1);
      return '0x' + (latestBlock?.height || 0).toString(16);
      
    case 'eth_getBalance':
      const address = params[0].toLowerCase();
      const blockParam = params[1] || 'latest';
      
      const [wallet] = await db
        .select({ balance: schema.wallets.balance })
        .from(schema.wallets)
        .where(eq(schema.wallets.address, address));
      
      if (!wallet) {
        return '0x0';
      }
      
      // Balance is already in 18 decimals (MetaMask compatible)
      return '0x' + BigInt(wallet.balance).toString(16);
      
    case 'eth_getTransactionCount':
      const addr = params[0].toLowerCase();
      const blockTag = params[1] || 'latest';
      
      // Get wallet nonce from wallets table
      const [walletForNonce] = await db
        .select({ nonce: schema.wallets.nonce })
        .from(schema.wallets)
        .where(eq(schema.wallets.address, addr));
      
      // Use wallet nonce if available, otherwise count transactions
      if (walletForNonce) {
        return '0x' + (walletForNonce.nonce || 0).toString(16);
      }
      
      const txCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.transactions)
        .where(eq(schema.transactions.fromAddress, addr));
      
      return '0x' + (txCount[0]?.count || 0).toString(16);
      
    case 'eth_getBlockByNumber':
      const blockNumber = parseInt(params[0], 16);
      const fullTx = params[1] || false;
      
      const [block] = await db
        .select()
        .from(schema.blocks)
        .where(eq(schema.blocks.height, blockNumber));
      
      if (!block) {
        return null;
      }
      
      return formatBlock(block, fullTx);
      
    case 'eth_getBlockByHash':
      const blockHash = params[0];
      const full = params[1] || false;
      
      const [blockByHash] = await db
        .select()
        .from(schema.blocks)
        .where(eq(schema.blocks.hash, blockHash));
      
      if (!blockByHash) {
        return null;
      }
      
      return formatBlock(blockByHash, full);
      
    case 'eth_getTransactionByHash':
      const txHash = params[0];
      
      const [tx] = await db
        .select()
        .from(schema.transactions)
        .where(eq(schema.transactions.hash, txHash));
      
      if (!tx) {
        return null;
      }
      
      return formatTransaction(tx);
      
    case 'eth_getTransactionReceipt':
      const receiptHash = params[0];
      
      // First check if transaction exists in mempool (pending)
      const [mempoolTx] = await db
        .select()
        .from(schema.mempool)
        .where(eq(schema.mempool.txHash, receiptHash));
      
      if (mempoolTx) {
        // Transaction is still pending
        console.log(`Transaction ${receiptHash} is still in mempool`);
        return null; // Return null for pending transactions per JSON-RPC spec
      }
      
      const [transaction] = await db
        .select({
          tx: schema.transactions,
          block: schema.blocks
        })
        .from(schema.transactions)
        .leftJoin(schema.blocks, eq(schema.transactions.blockHeight, schema.blocks.height))
        .where(eq(schema.transactions.hash, receiptHash));
      
      if (!transaction?.tx) {
        console.log(`Transaction ${receiptHash} not found`);
        return null;
      }
      
      return formatReceipt(transaction.tx, transaction.block);
      
    case 'eth_gasPrice':
      return '0x1'; // 1 starshars
      
    case 'eth_estimateGas':
      return '0x5208'; // Standard transfer gas (21000)
      
    case 'eth_sendRawTransaction':
      const rawTx = params[0];
      
      console.log('eth_sendRawTransaction received:', rawTx);
      
      try {
        // Parse the raw transaction using proper ethers.js parsing
        const txData = parseRawTransaction(rawTx);
        
        // Use the transaction hash from ethers.js parsing (EVM-compatible)
        const txHashRaw = txData.hash;
        
        // Extract validated transaction details
        const fromAddr = txData.from;
        const toAddr = txData.to;
        const rawTxValue = txData.value;
        const gasLimit = parseInt(txData.gas);
        const gasPrice = txData.gasPrice;
        const txNonce = txData.nonce;
        
        console.log(`Processing raw transaction:`, {
          hash: txHashRaw,
          from: fromAddr,
          to: toAddr,
          value: rawTxValue,
          gasLimit,
          gasPrice,
          nonce: txNonce
        });
        
        // Get or create sender wallet
        let [senderWallet] = await db
          .select()
          .from(schema.wallets)
          .where(eq(schema.wallets.address, fromAddr));
        
        if (!senderWallet) {
          console.log(`Creating wallet for ${fromAddr}`);
          await db.insert(schema.wallets).values({
            address: fromAddr,
            balance: '0',
            nonce: 0
          });
          
          [senderWallet] = await db
            .select()
            .from(schema.wallets)
            .where(eq(schema.wallets.address, fromAddr));
        }
        
        // Validate nonce (MetaMask should send correct nonce)
        if (txNonce !== senderWallet.nonce) {
          console.warn(`Nonce mismatch: expected ${senderWallet.nonce}, got ${txNonce}`);
          // For now, accept the transaction but log the warning
        }
        
        // Check balance (value + gas cost)
        const senderBal = BigInt(senderWallet?.balance || '0');
        const gasCost = BigInt(gasLimit) * BigInt(gasPrice);
        const requiredBal = BigInt(rawTxValue) + gasCost;
        
        console.log(`Balance check: has ${senderBal}, needs ${requiredBal} (${rawTxValue} + ${gasCost} gas)`);
        
        if (senderBal < requiredBal) {
          console.error(`Insufficient balance: has ${senderBal}, needs ${requiredBal}`);
          throw new Error(`Insufficient balance. Has: ${senderBal}, needs: ${requiredBal}`);
        }
        
        // Update sender balance and nonce
        const newSenderBal = (senderBal - requiredBal).toString();
        await db
          .update(schema.wallets)
          .set({ 
            balance: newSenderBal,
            nonce: senderWallet.nonce + 1 
          })
          .where(eq(schema.wallets.address, fromAddr));
        
        // Update or create recipient wallet
        const [recipientWallet] = await db
          .select()
          .from(schema.wallets)
          .where(eq(schema.wallets.address, toAddr));
        
        if (recipientWallet) {
          const newRecipientBal = (BigInt(recipientWallet.balance) + BigInt(rawTxValue)).toString();
          await db
            .update(schema.wallets)
            .set({ balance: newRecipientBal })
            .where(eq(schema.wallets.address, toAddr));
        } else {
          await db.insert(schema.wallets).values({
            address: toAddr,
            balance: rawTxValue,
            nonce: 0
          });
        }
        
        // Get current block height
        const [rawTxBlock] = await db
          .select({ height: schema.blocks.height })
          .from(schema.blocks)
          .orderBy(desc(schema.blocks.height))
          .limit(1);
        
        const rawTxBlockHeight = (rawTxBlock?.height || 0) + 1;
        
        // Add transaction to database as pending (no block height yet)
        // In a real blockchain, this would be mined into a block later
        await db.insert(schema.transactions).values({
          hash: txHashRaw,
          blockHeight: null, // No block yet - transaction is pending
          fromAddress: fromAddr,
          toAddress: toAddr,
          value: rawTxValue,
          gasLimit: gasLimit,
          gasPrice: gasPrice,
          gasUsed: gasLimit, // For simplicity, assume all gas is used
          nonce: txNonce,
          signature: rawTx, // Store the full raw transaction
          status: 'pending' // Start as pending, will be confirmed when mined
        }).catch(err => {
          if (!err.message?.includes('UNIQUE')) {
            console.error('Failed to add transaction:', err);
            throw err;
          }
        });
        
        console.log(`Raw transaction ${txHashRaw} added to mempool as pending`);
        
        return txHashRaw;
        
      } catch (error: any) {
        console.error('Error processing raw transaction:', error);
        console.error('Raw transaction that failed:', rawTx);
        throw error;
      }
      
    case 'eth_sendTransaction':
      const txParams = params[0];
      
      console.log('eth_sendTransaction received:', txParams);
      
      // Validate required fields
      if (!txParams.from || !txParams.to) {
        console.error('Missing required fields:', { from: !!txParams.from, to: !!txParams.to });
        throw new Error('Missing required transaction fields');
      }
      
      // Default value to 0 if not provided
      if (!txParams.value) {
        txParams.value = '0x0';
      }
      
      // Create transaction
      const value = BigInt(txParams.value).toString();
      const from = txParams.from.toLowerCase();
      const to = txParams.to.toLowerCase();
      
      console.log(`Processing transaction: from=${from}, to=${to}, value=${value}`);
      
      // Check if sender wallet exists, if not create it
      let [sender] = await db
        .select()
        .from(schema.wallets)
        .where(eq(schema.wallets.address, from));
      
      // If wallet doesn't exist, create it with 0 balance
      if (!sender) {
        console.log(`Creating new wallet for ${from}`);
        await db.insert(schema.wallets).values({
          address: from,
          balance: '0',
          nonce: 0
        });
        
        // Re-fetch the wallet
        [sender] = await db
          .select()
          .from(schema.wallets)
          .where(eq(schema.wallets.address, from));
      }
      
      // Check balance
      const senderBalance = BigInt(sender?.balance || '0');
      
      // Parse gas parameters from MetaMask (they come as hex)
      let gasPrice = txParams.gasPrice ? BigInt(txParams.gasPrice) : BigInt('1');
      const gasLimit = txParams.gas ? BigInt(txParams.gas) : BigInt('21000');
      
      // MetaMask often sends gas prices intended for Ethereum mainnet (in Gwei)
      // For STARS blockchain, we use much lower gas prices (1 starshar = minimum)
      // If gas price is extremely high, cap it to reasonable values
      const maxGasPrice = BigInt('1000000000000000000'); // 1 STARS max gas price
      if (gasPrice > maxGasPrice) {
        console.warn(`Gas price too high: ${gasPrice}, capping to ${maxGasPrice}`);
        gasPrice = BigInt('1'); // Use minimum gas price
      }
      const txValue = BigInt(value);
      const gasCost = gasPrice * gasLimit;
      const requiredBalance = txValue + gasCost;
      
      console.log(`Transaction debug info:`);
      console.log(`  - Sender address: ${from}`);
      console.log(`  - Transaction value (wei): ${txValue}`);
      console.log(`  - Gas price (raw): ${txParams.gasPrice} -> ${gasPrice} wei`);
      console.log(`  - Gas limit (raw): ${txParams.gas} -> ${gasLimit}`);
      console.log(`  - Gas cost: ${gasCost} wei`);
      console.log(`  - Wallet balance: ${senderBalance} wei`);
      console.log(`  - Required balance: ${requiredBalance} wei`);
      
      if (senderBalance < requiredBalance) {
        console.error(`Insufficient balance: has ${senderBalance}, needs ${requiredBalance}`);
        throw new Error(`Insufficient balance. Has: ${senderBalance}, needs: ${requiredBalance}`);
      }
      
      // Generate transaction hash
      const newTxHash = generateTxId();
      const timestamp = Math.floor(Date.now() / 1000);
      
      console.log(`Adding transaction to mempool: ${newTxHash}`);
      
      // Create proper transaction object
      const newTransaction = {
        hash: newTxHash,
        from,
        to,
        value: value.toString(),
        gasLimit: parseInt(txParams.gas || '0x5208', 16),
        gasPrice: gasPrice.toString(),
        gasUsed: 21000,
        nonce: sender.nonce,
        signature: null,
        timestamp
      };
      
      // Add to mempool
      await db.insert(schema.mempool).values({
        txHash: newTxHash,
        rawTx: JSON.stringify(newTransaction),
        priority: 1
      });
      
      // Update sender balance and nonce immediately (optimistic update)
      const newSenderBalance = (senderBalance - requiredBalance).toString();
      await db
        .update(schema.wallets)
        .set({ 
          balance: newSenderBalance,
          nonce: sender.nonce + 1 
        })
        .where(eq(schema.wallets.address, from));
      
      // Update recipient balance if they exist
      const [recipient] = await db
        .select()
        .from(schema.wallets)
        .where(eq(schema.wallets.address, to));
      
      if (recipient) {
        const newRecipientBalance = (BigInt(recipient.balance) + BigInt(value)).toString();
        await db
          .update(schema.wallets)
          .set({ balance: newRecipientBalance })
          .where(eq(schema.wallets.address, to));
      } else {
        // Create recipient wallet with the transferred amount
        await db.insert(schema.wallets).values({
          address: to,
          balance: value.toString(),
          nonce: 0
        });
      }
      
      // Get latest block height for immediate confirmation
      const [sendTxBlock] = await db
        .select({ height: schema.blocks.height })
        .from(schema.blocks)
        .orderBy(desc(schema.blocks.height))
        .limit(1);
      
      const sendTxBlockHeight = (sendTxBlock?.height || 0) + 1;
      
      // Add to transactions table as confirmed immediately (simulate instant confirmation)
      await db.insert(schema.transactions).values({
        hash: newTxHash,
        blockHeight: sendTxBlockHeight,
        fromAddress: from,
        toAddress: to,
        value: value.toString(),
        gasLimit: parseInt(txParams.gas || '0x5208', 16),
        gasPrice: gasPrice.toString(),
        gasUsed: 21000,
        nonce: sender.nonce,
        signature: null,
        status: 'confirmed'
      }).catch(err => {
        // Ignore duplicate key errors
        if (!err.message?.includes('UNIQUE')) {
          console.error('Failed to add to transactions:', err);
        }
      });
      
      // Remove from mempool if it exists
      await db
        .delete(schema.mempool)
        .where(eq(schema.mempool.txHash, newTxHash))
        .catch(() => {}); // Ignore errors
      
      console.log(`Transaction ${newTxHash} confirmed immediately at block ${sendTxBlockHeight}`);
      
      return newTxHash;
      
    case 'eth_call':
      // For read-only calls, we can simulate basic balance checks
      const callParams = params[0];
      
      if (callParams.data && callParams.data.startsWith('0x70a08231')) {
        // balanceOf(address) call
        const addrParam = '0x' + callParams.data.slice(34);
        const [bal] = await db
          .select({ balance: schema.wallets.balance })
          .from(schema.wallets)
          .where(eq(schema.wallets.address, addrParam.toLowerCase()));
        
        const balance = bal?.balance || '0';
        return '0x' + BigInt(balance).toString(16).padStart(64, '0');
      }
      
      return '0x0';
      
    case 'eth_getCode':
      // No smart contracts - all addresses are EOAs (Externally Owned Accounts)
      // Return empty bytecode for all addresses
      const codeAddress = params[0]?.toLowerCase();
      const codeBlock = params[1] || 'latest';
      
      // Always return empty bytecode for EOAs
      // This tells MetaMask the address is not a contract
      return '0x';
      
    case 'eth_accounts':
      // Return empty array (users should connect their wallet)
      return [];
      
    case 'eth_coinbase':
      // Return a default coinbase address
      return '0x0000000000000000000000000000000000000000';
      
    case 'eth_mining':
      return true; // Always mining
      
    case 'eth_hashrate':
      // Approximate hashrate
      return '0x1000000'; // ~16 MH/s
      
    case 'eth_syncing':
      return false; // Always synced
      
    case 'eth_protocolVersion':
      return '0x1';
      
    case 'eth_getStorageAt':
      // Return empty storage for all addresses
      return '0x0000000000000000000000000000000000000000000000000000000000000000';
      
    case 'eth_getTransactionByBlockNumberAndIndex':
      // Return null for now (no transactions in blocks yet)
      return null;
      
    case 'eth_getTransactionByBlockHashAndIndex':
      // Return null for now
      return null;
      
    case 'eth_getBlockTransactionCountByNumber':
      // Return 0 transactions for now
      return '0x0';
      
    case 'eth_getBlockTransactionCountByHash':
      // Return 0 transactions for now
      return '0x0';
      
    case 'eth_sign':
      // Not supported for security reasons
      throw new Error('eth_sign is deprecated and not supported');
      
    case 'eth_signTypedData':
    case 'eth_signTypedData_v3':
    case 'eth_signTypedData_v4':
      // These would need proper implementation
      throw new Error('Typed data signing not yet supported');
      
    case 'personal_sign':
      // This should be handled by MetaMask directly
      throw new Error('personal_sign should be handled by wallet');
      
    case 'eth_requestAccounts':
      // This should be handled by MetaMask
      return [];
      
    case 'eth_getLogs':
      // Return empty logs for now
      return [];
      
    case 'eth_newFilter':
    case 'eth_newBlockFilter':
    case 'eth_newPendingTransactionFilter':
      // Return a dummy filter ID
      return '0x1';
      
    case 'eth_uninstallFilter':
      // Always return true
      return true;
      
    case 'eth_getFilterChanges':
    case 'eth_getFilterLogs':
      // Return empty array
      return [];
      
    case 'wallet_switchEthereumChain':
    case 'wallet_addEthereumChain':
      // These should be handled by MetaMask
      throw new Error('Wallet methods should be handled by MetaMask');
      
    default:
      console.warn(`Unsupported RPC method: ${method}`);
      throw new Error(`Method ${method} not supported`);
  }
}

function formatBlock(block: any, includeTx: boolean): any {
  return {
    number: '0x' + block.height.toString(16),
    hash: block.hash,
    parentHash: block.previousHash,
    nonce: '0x' + block.nonce,
    sha3Uncles: '0x0000000000000000000000000000000000000000000000000000000000000000',
    logsBloom: '0x' + '00'.repeat(256),
    transactionsRoot: block.merkleRoot,
    stateRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
    receiptsRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
    miner: block.minerAddress,
    difficulty: '0x' + block.difficulty.toString(16),
    totalDifficulty: '0x' + block.difficulty.toString(16),
    extraData: '0x',
    size: '0x' + (JSON.stringify(block).length).toString(16),
    gasLimit: '0x6691b7',
    gasUsed: '0x5208',
    timestamp: '0x' + Math.floor(block.timestamp / 1000).toString(16),
    transactions: includeTx ? [] : [], // TODO: include full transactions if requested
    uncles: []
  };
}

function formatTransaction(tx: any): any {
  let v = '0x1b', r = '0x' + '0'.repeat(64), s = '0x' + '0'.repeat(64);
  
  // If we have the raw transaction signature, parse it to get v, r, s
  if (tx.signature && tx.signature.startsWith('0x')) {
    try {
      const ethTx = ethers.Transaction.from(tx.signature);
      if (ethTx.signature) {
        v = '0x' + ethTx.signature.v.toString(16);
        r = ethTx.signature.r;
        s = ethTx.signature.s;
      }
    } catch (e) {
      console.warn('Could not parse signature from raw transaction:', e);
    }
  }
  
  return {
    hash: tx.hash,
    nonce: '0x' + (tx.nonce || 0).toString(16),
    blockHash: tx.blockHeight ? '0x' + tx.blockHeight.toString(16).padStart(64, '0') : null,
    blockNumber: tx.blockHeight ? '0x' + tx.blockHeight.toString(16) : null,
    transactionIndex: '0x0',
    from: tx.fromAddress,
    to: tx.toAddress,
    value: '0x' + BigInt(tx.value || 0).toString(16),
    gasPrice: '0x' + BigInt(tx.gasPrice || 1).toString(16),
    gas: '0x' + (tx.gasLimit || 21000).toString(16),
    input: tx.data || '0x',
    v: v,
    r: r,
    s: s,
    type: '0x0' // Legacy transaction type
  };
}

function formatReceipt(tx: any, block: any): any {
  return {
    transactionHash: tx.hash,
    transactionIndex: '0x0',
    blockHash: block ? block.hash : '0x' + '0'.repeat(64),
    blockNumber: block ? '0x' + block.height.toString(16) : '0x1',
    from: tx.fromAddress,
    to: tx.toAddress,
    cumulativeGasUsed: '0x' + (tx.gasUsed || 21000).toString(16),
    gasUsed: '0x' + (tx.gasUsed || 21000).toString(16),
    contractAddress: null,
    logs: [],
    logsBloom: '0x' + '0'.repeat(512),
    status: tx.status === 'failed' ? '0x0' : '0x1',
    effectiveGasPrice: '0x' + BigInt(tx.gasPrice || 1).toString(16),
    type: '0x0', // Legacy transaction type
    root: undefined // Post-byzantium, we use status instead
  };
}

function createError(id: any, code: number, message: string): any {
  return {
    jsonrpc: '2.0',
    error: {
      code,
      message
    },
    id
  };
}

function generateTxId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 15);
  const data = timestamp + random;
  
  // Use ethers.js keccak256 for EVM compatibility
  return ethers.keccak256(ethers.toUtf8Bytes(data));
}

// Parse and validate raw signed transaction from MetaMask
function parseRawTransaction(rawTx: string): any {
  try {
    console.log('Parsing raw transaction:', rawTx);
    
    // Parse the transaction using ethers.js
    const tx = ethers.Transaction.from(rawTx);
    
    console.log('Parsed transaction:', {
      from: tx.from,
      to: tx.to,
      value: tx.value?.toString(),
      gasLimit: tx.gasLimit?.toString(),
      gasPrice: tx.gasPrice?.toString(),
      nonce: tx.nonce,
      chainId: tx.chainId,
      hash: tx.hash,
      signature: {
        v: tx.signature?.v,
        r: tx.signature?.r,
        s: tx.signature?.s
      }
    });
    
    // Validate chain ID (should be 7827 for STARS network)
    if (tx.chainId && tx.chainId !== 7827n) {
      throw new Error(`Invalid chain ID: expected 7827, got ${tx.chainId}`);
    }
    
    // Validate required fields
    if (!tx.from) {
      throw new Error('Cannot recover sender address from transaction');
    }
    
    if (!tx.to) {
      throw new Error('Missing recipient address');
    }
    
    return {
      from: tx.from.toLowerCase(),
      to: tx.to.toLowerCase(), 
      value: tx.value?.toString() || '0',
      gas: tx.gasLimit?.toString() || '21000',
      gasPrice: tx.gasPrice?.toString() || '1',
      nonce: tx.nonce || 0,
      hash: tx.hash,
      v: tx.signature?.v,
      r: tx.signature?.r,
      s: tx.signature?.s,
      rawTransaction: rawTx
    };
  } catch (error: any) {
    console.error('Failed to parse raw transaction:', error);
    console.error('Raw transaction hex:', rawTx);
    
    // Return more detailed error information
    throw new Error(`Invalid transaction format: ${error.message}`);
  }
}

export default rpc;