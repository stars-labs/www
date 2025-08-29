import { Hono } from 'hono';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { hashBlock } from '../crypto/mining';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex } from '@noble/hashes/utils';

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
    return createError(id, error.code || -32603, error.message || 'Internal error');
  }
}

async function handleMethod(
  db: DrizzleD1Database<typeof schema>,
  method: string,
  params: any[]
): Promise<any> {
  switch (method) {
    // Network methods
    case 'net_version':
      return '1337'; // Custom network ID
      
    case 'net_listening':
      return true;
      
    case 'net_peerCount':
      return '0x1'; // Always show 1 peer (the server)
      
    // Web3 methods
    case 'web3_clientVersion':
      return 'StarsLab/1.0.0';
      
    case 'web3_sha3':
      const data = params[0].replace('0x', '');
      const dataBytes = new Uint8Array(data.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
      const hashBytes = sha256(dataBytes);
      return '0x' + bytesToHex(hashBytes);
      
    // Eth methods
    case 'eth_chainId':
      return '0x539'; // 1337 in hex
      
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
      
      return '0x' + BigInt(wallet.balance).toString(16);
      
    case 'eth_getTransactionCount':
      const addr = params[0].toLowerCase();
      
      const txCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.transactions)
        .where(eq(schema.transactions.from, addr));
      
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
      
      const [transaction] = await db
        .select({
          tx: schema.transactions,
          block: schema.blocks
        })
        .from(schema.transactions)
        .leftJoin(schema.blocks, eq(schema.transactions.blockHash, schema.blocks.hash))
        .where(eq(schema.transactions.hash, receiptHash));
      
      if (!transaction?.tx) {
        return null;
      }
      
      return formatReceipt(transaction.tx, transaction.block);
      
    case 'eth_gasPrice':
      return '0x1'; // 1 starshars
      
    case 'eth_estimateGas':
      return '0x5208'; // Standard transfer gas (21000)
      
    case 'eth_sendRawTransaction':
      // This would need transaction signing implementation
      throw new Error('Raw transactions not yet supported');
      
    case 'eth_sendTransaction':
      const txParams = params[0];
      
      // Validate required fields
      if (!txParams.from || !txParams.to || !txParams.value) {
        throw new Error('Missing required transaction fields');
      }
      
      // Create transaction
      const value = BigInt(txParams.value).toString();
      const from = txParams.from.toLowerCase();
      const to = txParams.to.toLowerCase();
      
      // Check balance
      const [sender] = await db
        .select()
        .from(schema.wallets)
        .where(eq(schema.wallets.address, from));
      
      if (!sender || BigInt(sender.balance) < BigInt(value) + 1n) {
        throw new Error('Insufficient balance');
      }
      
      // Add to mempool
      const txId = generateTxId();
      const now = Date.now();
      
      await db.insert(schema.mempool).values({
        hash: txId,
        from,
        to,
        value,
        fee: '1',
        timestamp: now,
        data: txParams.data || null
      });
      
      return txId;
      
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
      // No smart contracts yet
      return '0x';
      
    case 'eth_accounts':
      // Return empty array (users should connect their wallet)
      return [];
      
    case 'eth_coinbase':
      // Return bot address as coinbase
      const [bot] = await db
        .select({ address: schema.wallets.address })
        .from(schema.wallets)
        .where(eq(schema.wallets.type, 'bot'));
      
      return bot?.address || '0x0000000000000000000000000000000000000000';
      
    case 'eth_mining':
      return true; // Always mining
      
    case 'eth_hashrate':
      // Approximate hashrate
      return '0x1000000'; // ~16 MH/s
      
    case 'eth_syncing':
      return false; // Always synced
      
    case 'eth_protocolVersion':
      return '0x1';
      
    default:
      throw new Error(`Method ${method} not supported`);
  }
}

function formatBlock(block: any, includeTx: boolean): any {
  return {
    number: '0x' + block.height.toString(16),
    hash: block.hash,
    parentHash: block.parentHash,
    nonce: '0x' + block.nonce,
    sha3Uncles: '0x0000000000000000000000000000000000000000000000000000000000000000',
    logsBloom: '0x' + '00'.repeat(256),
    transactionsRoot: block.merkleRoot,
    stateRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
    receiptsRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
    miner: block.miner,
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
  return {
    hash: tx.hash,
    nonce: '0x0',
    blockHash: tx.blockHash,
    blockNumber: tx.blockHash ? '0x1' : null,
    transactionIndex: '0x0',
    from: tx.from,
    to: tx.to,
    value: '0x' + BigInt(tx.value).toString(16),
    gasPrice: '0x1',
    gas: '0x5208',
    input: tx.data || '0x',
    v: '0x1b',
    r: '0x0000000000000000000000000000000000000000000000000000000000000000',
    s: '0x0000000000000000000000000000000000000000000000000000000000000000'
  };
}

function formatReceipt(tx: any, block: any): any {
  return {
    transactionHash: tx.hash,
    transactionIndex: '0x0',
    blockHash: tx.blockHash,
    blockNumber: block ? '0x' + block.height.toString(16) : '0x0',
    from: tx.from,
    to: tx.to,
    cumulativeGasUsed: '0x5208',
    gasUsed: '0x5208',
    contractAddress: null,
    logs: [],
    logsBloom: '0x' + '00'.repeat(256),
    status: '0x1',
    effectiveGasPrice: '0x1'
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
  const encoder = new TextEncoder();
  const hashBytes = sha256(encoder.encode(data));
  return '0x' + bytesToHex(hashBytes);
}

export default rpc;