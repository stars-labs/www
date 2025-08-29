import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex } from '@noble/hashes/utils';
import { signHash, verifySignature } from './wallet';

export interface RawTransaction {
  from: string;
  to: string;
  value: string; // In starshars
  nonce: number;
  gasLimit: number;
  gasPrice: string; // In starshars
  timestamp?: number;
}

export interface SignedTransaction extends RawTransaction {
  hash: string;
  signature: string;
}

// Create transaction hash
export function hashTransaction(tx: RawTransaction): string {
  const data = [
    tx.from,
    tx.to,
    tx.value,
    tx.nonce.toString(),
    tx.gasLimit.toString(),
    tx.gasPrice,
    (tx.timestamp || Date.now()).toString()
  ].join(':');
  
  const hash = sha256(data);
  return '0x' + bytesToHex(hash);
}

// Sign a transaction
export function signTransaction(
  tx: RawTransaction,
  privateKey: string
): SignedTransaction {
  const txHash = hashTransaction(tx);
  const hashBytes = new Uint8Array(Buffer.from(txHash.slice(2), 'hex'));
  const signature = signHash(hashBytes, privateKey);
  
  return {
    ...tx,
    hash: txHash,
    signature
  };
}

// Verify transaction signature
export function verifyTransaction(
  tx: SignedTransaction,
  publicKey: string
): boolean {
  const txHash = hashTransaction(tx);
  
  if (txHash !== tx.hash) {
    return false; // Hash mismatch
  }
  
  const hashBytes = new Uint8Array(Buffer.from(txHash.slice(2), 'hex'));
  return verifySignature(hashBytes, tx.signature, publicKey);
}

// Calculate transaction fee
export function calculateTxFee(gasUsed: number, gasPrice: string): string {
  const fee = BigInt(gasUsed) * BigInt(gasPrice);
  return fee.toString();
}

// Validate transaction format
export function validateTransaction(tx: RawTransaction): { valid: boolean; error?: string } {
  // Check addresses
  if (!tx.from.match(/^0x[a-fA-F0-9]{40}$/)) {
    return { valid: false, error: 'Invalid from address' };
  }
  
  if (!tx.to.match(/^0x[a-fA-F0-9]{40}$/)) {
    return { valid: false, error: 'Invalid to address' };
  }
  
  // Check value
  try {
    const value = BigInt(tx.value);
    if (value < 0n) {
      return { valid: false, error: 'Negative value' };
    }
  } catch {
    return { valid: false, error: 'Invalid value' };
  }
  
  // Check gas
  if (tx.gasLimit < 21000) {
    return { valid: false, error: 'Gas limit too low' };
  }
  
  try {
    const gasPrice = BigInt(tx.gasPrice);
    if (gasPrice < 1n) {
      return { valid: false, error: 'Gas price too low' };
    }
  } catch {
    return { valid: false, error: 'Invalid gas price' };
  }
  
  // Check nonce
  if (tx.nonce < 0) {
    return { valid: false, error: 'Invalid nonce' };
  }
  
  return { valid: true };
}

// Create coinbase transaction (mining reward)
export function createCoinbaseTransaction(
  minerAddress: string,
  reward: string,
  blockHeight: number
): SignedTransaction {
  const tx: RawTransaction = {
    from: '0x0000000000000000000000000000000000000000', // System address
    to: minerAddress,
    value: reward,
    nonce: blockHeight, // Use block height as nonce for coinbase
    gasLimit: 0, // No gas for coinbase
    gasPrice: '0', // No gas price for coinbase
    timestamp: Date.now()
  };
  
  const hash = hashTransaction(tx);
  
  return {
    ...tx,
    hash,
    signature: '0x' // No signature for coinbase
  };
}

// Sort transactions by gas price (for mempool priority)
export function sortByGasPrice(transactions: RawTransaction[]): RawTransaction[] {
  return transactions.sort((a, b) => {
    const priceA = BigInt(a.gasPrice);
    const priceB = BigInt(b.gasPrice);
    
    if (priceA > priceB) return -1;
    if (priceA < priceB) return 1;
    return 0;
  });
}