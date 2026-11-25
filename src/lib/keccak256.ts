/**
 * Minimal, zero-dependency Ethereum Keccak-256 (original Keccak padding 0x01,
 * NOT NIST SHA3-256 0x06) + EIP-191 personal_sign prehash helper.
 * Produces the exact 32-byte digest verified by Etherscan & MetaMask ecrecover.
 */

const RC: readonly bigint[] = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

const ROTC = [
  1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14,
  27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44,
];

const PILN = [
  10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4,
  15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1,
];

const MASK64 = 0xffffffffffffffffn;

function rotl64(x: bigint, n: number): bigint {
  const s = BigInt(n);
  return ((x << s) | (x >> (64n - s))) & MASK64;
}

function keccakF1600(st: BigUint64Array): void {
  const bc = new BigUint64Array(5);
  for (let round = 0; round < 24; round++) {
    // Theta
    for (let i = 0; i < 5; i++) {
      bc[i] = st[i] ^ st[i + 5] ^ st[i + 10] ^ st[i + 15] ^ st[i + 20];
    }
    for (let i = 0; i < 5; i++) {
      const t = bc[(i + 4) % 5] ^ rotl64(bc[(i + 1) % 5], 1);
      for (let j = 0; j < 25; j += 5) st[j + i] = (st[j + i] ^ t) & MASK64;
    }
    // Rho & Pi
    let t = st[1];
    for (let i = 0; i < 24; i++) {
      const j = PILN[i];
      bc[0] = st[j];
      st[j] = rotl64(t, ROTC[i]);
      t = bc[0];
    }
    // Chi
    for (let j = 0; j < 25; j += 5) {
      for (let i = 0; i < 5; i++) bc[i] = st[j + i];
      for (let i = 0; i < 5; i++) {
        st[j + i] = (bc[i] ^ ((~bc[(i + 1) % 5] & MASK64) & bc[(i + 2) % 5])) & MASK64;
      }
    }
    // Iota
    st[0] = (st[0] ^ RC[round]) & MASK64;
  }
}

export function keccak256(input: Uint8Array): Uint8Array {
  const rate = 136; // 1088 bits for Keccak-256
  const st = new BigUint64Array(25);
  const block = new Uint8Array(rate);
  let pos = 0;

  for (let i = 0; i < input.length; i++) {
    block[pos++] = input[i];
    if (pos === rate) {
      absorb(st, block);
      keccakF1600(st);
      pos = 0;
    }
  }

  // Keccak padding: 0x01 ... 0x80
  block.fill(0, pos);
  block[pos] = 0x01;
  block[rate - 1] |= 0x80;
  absorb(st, block);
  keccakF1600(st);

  const out = new Uint8Array(32);
  const view = new DataView(out.buffer);
  for (let i = 0; i < 4; i++) {
    view.setBigUint64(i * 8, st[i], true);
  }
  return out;
}

function absorb(st: BigUint64Array, block: Uint8Array): void {
  const view = new DataView(block.buffer, block.byteOffset, block.byteLength);
  for (let i = 0; i < 17; i++) {
    st[i] = (st[i] ^ view.getBigUint64(i * 8, true)) & MASK64;
  }
}

/** Standard Ethereum EIP-191 personal_sign digest: keccak256("\x19Ethereum Signed Message:\n" + len + msg). */
export function eip191Hash(message: string): Uint8Array {
  const enc = new TextEncoder();
  const msgBytes = enc.encode(message);
  const prefix = enc.encode(`\x19Ethereum Signed Message:\n${msgBytes.length}`);
  const combined = new Uint8Array(prefix.length + msgBytes.length);
  combined.set(prefix, 0);
  combined.set(msgBytes, prefix.length);
  return keccak256(combined);
}
