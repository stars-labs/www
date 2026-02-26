import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { HDKey } from '@scure/bip32';
import * as secp256k1 from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha2';
import { keccak_256 } from '@noble/hashes/sha3';
import { wordlist } from '@scure/bip39/wordlists/english';

// Generate Ethereum-style address from public key
export function publicKeyToAddress(publicKey: Uint8Array): string {
  // Remove the first byte (0x04) if it's an uncompressed public key
  const pubKey = publicKey.length === 65 ? publicKey.slice(1) : publicKey;
  
  // Keccak256 hash of the public key
  const hash = keccak_256(pubKey);
  
  // Take last 20 bytes as address
  const address = hash.slice(-20);
  
  // Convert to hex with 0x prefix
  return '0x' + Buffer.from(address).toString('hex');
}

// Generate a new HD wallet
export function generateWallet() {
  // Generate 24-word mnemonic
  const mnemonic = generateMnemonic(wordlist, 256);
  
  // Derive seed from mnemonic
  const seed = mnemonicToSeedSync(mnemonic);
  
  // Create HD key from seed
  const hdKey = HDKey.fromMasterSeed(seed);
  
  // Derive first account using Ethereum derivation path
  const accountKey = hdKey.derive("m/44'/60'/0'/0/0");
  
  if (!accountKey.privateKey || !accountKey.publicKey) {
    throw new Error('Failed to derive keys');
  }
  
  // Get address from public key
  const address = publicKeyToAddress(accountKey.publicKey);
  
  return {
    mnemonic,
    privateKey: '0x' + Buffer.from(accountKey.privateKey).toString('hex'),
    publicKey: '0x' + Buffer.from(accountKey.publicKey).toString('hex'),
    address
  };
}

// Recover wallet from mnemonic
export function recoverWallet(mnemonic: string) {
  const seed = mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const accountKey = hdKey.derive("m/44'/60'/0'/0/0");
  
  if (!accountKey.privateKey || !accountKey.publicKey) {
    throw new Error('Failed to derive keys');
  }
  
  const address = publicKeyToAddress(accountKey.publicKey);
  
  return {
    mnemonic,
    privateKey: '0x' + Buffer.from(accountKey.privateKey).toString('hex'),
    publicKey: '0x' + Buffer.from(accountKey.publicKey).toString('hex'),
    address
  };
}

// Simple encryption for storing private keys (using environment secret)
export function encryptData(data: string, secret: string): string {
  // Simple XOR encryption (in production, use proper AES encryption)
  const secretBytes = new TextEncoder().encode(secret);
  const key = Buffer.from(sha256(secretBytes));
  const dataBuffer = Buffer.from(data, 'utf-8');
  const encrypted = Buffer.alloc(dataBuffer.length);
  
  for (let i = 0; i < dataBuffer.length; i++) {
    encrypted[i] = dataBuffer[i] ^ key[i % key.length];
  }
  
  return encrypted.toString('base64');
}

// Decrypt data
export function decryptData(encryptedData: string, secret: string): string {
  const secretBytes = new TextEncoder().encode(secret);
  const key = Buffer.from(sha256(secretBytes));
  const encrypted = Buffer.from(encryptedData, 'base64');
  const decrypted = Buffer.alloc(encrypted.length);
  
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ key[i % key.length];
  }
  
  return decrypted.toString('utf-8');
}

// Generate random address (for testing/bot transactions)
export function generateRandomAddress(): string {
  const privateKey = secp256k1.utils.randomPrivateKey();
  const publicKey = secp256k1.getPublicKey(privateKey, false);
  return publicKeyToAddress(publicKey);
}

// Sign a message hash with private key
export function signHash(hash: Uint8Array, privateKey: string): string {
  const privKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  const signature = secp256k1.sign(hash, privKey);
  return '0x' + signature.toCompactHex();
}

// Verify signature
export function verifySignature(hash: Uint8Array, signature: string, publicKey: string): boolean {
  try {
    const sig = signature.startsWith('0x') ? signature.slice(2) : signature;
    const pubKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;
    return secp256k1.verify(sig, hash, pubKey);
  } catch {
    return false;
  }
}