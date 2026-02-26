import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

// Calculate difficulty target from difficulty level
export function calculateTarget(difficulty: number): string {
  // Target = 2^(256 - difficulty)
  // For simplicity, we use leading zeros approach
  // difficulty 4 = 0x0000FFFF... (4 leading zeros in hex, 16 in binary)
  const maxTarget = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
  const target = maxTarget >> BigInt(difficulty * 4); // Each hex digit is 4 bits
  return '0x' + target.toString(16).padStart(64, '0');
}

// Check if hash meets difficulty target
export function meetsTarget(hash: string, target: string): boolean {
  const hashBig = BigInt(hash.startsWith('0x') ? hash : '0x' + hash);
  const targetBig = BigInt(target);
  return hashBig <= targetBig;
}

// Create block header for hashing
export function createBlockHeader(template: {
  height: number;
  previousHash: string;
  merkleRoot: string;
  timestamp: number;
  difficulty: number;
  minerAddress: string;
}): string {
  // Concatenate all fields to create header
  return [
    template.height.toString(),
    template.previousHash,
    template.merkleRoot || '0x0',
    template.timestamp.toString(),
    template.difficulty.toString(),
    template.minerAddress
  ].join(':');
}

// Hash block with nonce
export function hashBlock(header: string, nonce: string): string {
  const data = header + ':' + nonce;
  const dataBytes = new TextEncoder().encode(data);
  const hash = sha256(dataBytes);
  return '0x' + bytesToHex(hash);
}

// Verify Proof of Work
export function verifyPoW(
  blockHeader: string,
  nonce: string,
  target: string
): { valid: boolean; hash: string } {
  const hash = hashBlock(blockHeader, nonce);
  const valid = meetsTarget(hash, target);
  return { valid, hash };
}

// Calculate merkle root from transaction hashes
export function calculateMerkleRoot(txHashes: string[]): string {
  if (txHashes.length === 0) {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }
  
  // If only one transaction, return its hash
  if (txHashes.length === 1) {
    return txHashes[0];
  }
  
  // Build merkle tree
  let level = txHashes.map(h => h.startsWith('0x') ? h.slice(2) : h);
  
  while (level.length > 1) {
    const nextLevel: string[] = [];
    
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left; // Duplicate last if odd number
      
      const leftBytes = hexToBytes(left);
      const rightBytes = hexToBytes(right);
      const combined = new Uint8Array(leftBytes.length + rightBytes.length);
      combined.set(leftBytes);
      combined.set(rightBytes, leftBytes.length);
      
      const hash = bytesToHex(sha256(combined));
      nextLevel.push(hash);
    }
    
    level = nextLevel;
  }
  
  return '0x' + level[0];
}

// Adjust difficulty based on block times
export function adjustDifficulty(
  currentDifficulty: number,
  actualTime: number, // Actual time for last N blocks in ms
  targetTime: number  // Target time for N blocks in ms
): number {
  // Limit adjustment to prevent huge swings
  const ratio = targetTime / actualTime;
  const clampedRatio = Math.max(0.25, Math.min(4, ratio)); // Max 4x change
  
  const newDifficulty = Math.round(currentDifficulty * clampedRatio);
  
  // Keep difficulty in reasonable range
  return Math.max(1, Math.min(32, newDifficulty)); // Between 1 and 32
}

// Generate a unique job ID
export function generateJobId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `job_${timestamp}_${random}`;
}

// Estimate hash rate from time and attempts
export function calculateHashRate(hashes: number, timeMs: number): number {
  if (timeMs === 0) return 0;
  return Math.round((hashes / timeMs) * 1000); // Hashes per second
}