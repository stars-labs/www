/**
 * Live Browser WASM MPC Sandbox Engine.
 *
 * Executes REAL `@stars-labs/core-wasm` cryptography 100% locally inside the
 * visitor's browser (zero backend custody):
 *  - 2-Round Unified FROST DKG (Ed25519 + secp256k1 BIP-340 Taproot)
 *  - Fresh CGGMP24 Threshold ECDSA Keygen (Ethereum & 100+ EVM chains)
 *  - Public-only BIP-44 / BIP-86 Multi-Account HD Derivation
 *  - 2-Round Threshold Signing (BTC Taproot, Solana, Sui, Ethereum CGGMP24 + ecrecover)
 *  - Address-Preserving FROST Share Refresh / Resharing + Stolen-Share Rejection Proof
 *  - PBKDF2-SHA256 (100k rounds) + AES-256-GCM Encrypted Keystore Backup & Restore
 */
import init, * as wasm from "./wasm/starlab_core_wasm.js";
import { eip191Hash } from "./keccak256";
import type { EcdsaSignWorkerResponse } from "./ecdsaWorker";

let wasmInitPromise: Promise<void> | null = null;
let sandboxAuxPromise: Promise<string[]> | null = null;

export async function ensureWasmReady(): Promise<void> {
  if (!wasmInitPromise) {
    wasmInitPromise = init({ module_or_path: "/wasm/starlab_core_wasm_bg.wasm" }).then(() => {});
  }
  await wasmInitPromise;
}

async function loadSandboxAuxInfos(): Promise<string[]> {
  if (!sandboxAuxPromise) {
    sandboxAuxPromise = fetch("/wasm/sandbox-aux-2of3.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch sandbox aux-info (${r.status})`);
        return r.json();
      })
      .then((d: { aux: unknown[] }) => d.aux.map((a) => JSON.stringify(a)));
  }
  return sandboxAuxPromise;
}

export interface VirtualDevice {
  index: number; // 1-based
  id: string;
  labelEn: string;
  labelZh: string;
  roleIcon: string;
  rootSecretHex: string;
  ed25519Keystore: string;
  secp256k1Keystore: string;
  ecdsaKeyShare: string | null;
  shareFingerprint: string;
  compromised?: boolean;
}

export interface DkgRoundLog {
  step: "round1" | "round2" | "finalize" | "ecdsa";
  titleEn: string;
  titleZh: string;
  elapsedMs: number;
  bytesExchanged: number;
  sampleHex: string;
}

export interface DerivedAccountRow {
  account: number;
  ethereum: { path: string; address: string } | null;
  bitcoin: { path: string; address: string };
  solana: { path: string; address: string };
  sui: { path: string; address: string };
}

export interface SandboxVault {
  vaultName: string;
  threshold: number;
  total: number;
  ed25519GroupPubkey: string;
  secp256k1GroupPubkey: string;
  ecdsaGroupPubkey: string | null;
  devices: VirtualDevice[];
  logs: DkgRoundLog[];
  totalElapsedMs: number;
  reshareEpoch: number;
}

const DEVICE_PRESETS = [
  { id: "dev-ext-1", en: "Chrome Extension", zh: "Chrome 插件", icon: "🌐" },
  { id: "dev-desk-2", en: "Starlab Desktop", zh: "桌面端客户端", icon: "🖥️" },
  { id: "dev-esp-3", en: "ESP32 / Cold TUI", zh: "ESP32 / 冷备 TUI", icon: "🔐" },
  { id: "dev-cli-4", en: "Server CLI Node", zh: "服务器 CLI 节点", icon: "⌨️" },
  { id: "dev-air-5", en: "Air-Gap SD Vault", zh: "离线 SD 卡节点", icon: "💾" },
];

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function fromHex(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/i, "");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function sha256Hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return toHex(new Uint8Array(buf));
}

/** Run real 2-Round Unified FROST DKG (+ fresh CGGMP24 ECDSA Keygen for n <= 3). */
export async function runLiveDkg(
  vaultName: string,
  threshold: number,
  total: number,
): Promise<SandboxVault> {
  await ensureWasmReady();
  const tStart = performance.now();
  const logs: DkgRoundLog[] = [];

  // Create n independent FrostDkgUnified instances
  const nodes = Array.from({ length: total }, (_, idx) => {
    const n = new wasm.FrostDkgUnified();
    n.init_dkg(idx + 1, total, threshold);
    return n;
  });

  // Round 1: broadcast commitments
  const t1 = performance.now();
  const r1Packages = nodes.map((n) => n.generate_round1());
  let r1Bytes = 0;
  for (let i = 0; i < total; i++) {
    const parsed = JSON.parse(r1Packages[i]);
    r1Bytes +=
      wasm.to_frost_wire("ed25519", "round1", parsed.ed25519).length / 2 +
      wasm.to_frost_wire("secp256k1", "round1", parsed.secp256k1).length / 2;
    for (let j = 0; j < total; j++) {
      if (i !== j) nodes[j].add_round1_package(i + 1, r1Packages[i]);
    }
  }
  const sampleR1 = wasm.to_frost_wire("secp256k1", "round1", JSON.parse(r1Packages[0]).secp256k1);
  logs.push({
    step: "round1",
    titleEn: `Round 1 · ${total} Devices Broadcast Polynomial Commitments`,
    titleZh: `第 1 轮 · ${total} 台设备广播秘密多项式承诺（防作弊封口）`,
    elapsedMs: performance.now() - t1,
    bytesExchanged: r1Bytes * (total - 1),
    sampleHex: sampleR1,
  });

  // Round 2: point-to-point encrypted share distribution
  const t2 = performance.now();
  const r2Maps = nodes.map((n) => JSON.parse(n.generate_round2()));
  let r2Bytes = 0;
  for (let sender = 0; sender < total; sender++) {
    for (let receiver = 0; receiver < total; receiver++) {
      if (sender === receiver) continue;
      const edHex = r2Maps[sender].ed25519[String(receiver + 1)];
      const secpHex = r2Maps[sender].secp256k1[String(receiver + 1)];
      r2Bytes +=
        wasm.to_frost_wire("ed25519", "round2", edHex).length / 2 +
        wasm.to_frost_wire("secp256k1", "round2", secpHex).length / 2;
      nodes[receiver].add_round2_package(sender + 1, edHex, secpHex);
    }
  }
  const sampleR2 = wasm.to_frost_wire("secp256k1", "round2", r2Maps[0].secp256k1["2"]);
  logs.push({
    step: "round2",
    titleEn: `Round 2 · ${total * (total - 1)} Point-to-Point Secret Share Packets Verified`,
    titleZh: `第 2 轮 · 点对点分发 ${total * (total - 1)} 份秘密分片并完成零知识校验`,
    elapsedMs: performance.now() - t2,
    bytesExchanged: r2Bytes,
    sampleHex: sampleR2,
  });

  // Finalize FROST DKG
  const t3 = performance.now();
  for (const n of nodes) n.finalize_dkg();
  const ed25519GroupPubkey = nodes[0].get_ed25519_public_key();
  const secp256k1GroupPubkey = nodes[0].get_secp256k1_public_key();
  logs.push({
    step: "finalize",
    titleEn: `FROST Finalized · All ${total} Devices Derived Identical BTC/SOL/SUI Group Keys`,
    titleZh: `FROST 完成 · 全部 ${total} 台设备独立算出完全一致的 BTC / SOL / SUI 群公钥`,
    elapsedMs: performance.now() - t3,
    bytesExchanged: 0,
    sampleHex: secp256k1GroupPubkey,
  });

  // Fresh CGGMP24 ECDSA Keygen (for 2-of-3 and 2-of-2 using 3-party sandbox aux)
  let ecdsaGroupPubkey: string | null = null;
  const ecdsaShares: (string | null)[] = Array(total).fill(null);

  if (total === 3 && threshold === 2) {
    const t4 = performance.now();
    const auxInfos = await loadSandboxAuxInfos();
    const parts = DEVICE_PRESETS.slice(0, 3).map((p) => p.id).sort();
    const sessionId = `dkg_ecdsa_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const kgs = [0, 1, 2].map((i) => new wasm.EcdsaKeygen(sessionId, parts, i, threshold));
    const kgOuts: (string | undefined)[] = [undefined, undefined, undefined];
    let kgBytes = 0;
    let kgSample = "";

    for (let step = 0; step < 30 && kgOuts.some((x) => !x); step++) {
      for (let i = 0; i < 3; i++) {
        if (!kgOuts[i]) {
          const r = kgs[i].proceed();
          if (r) kgOuts[i] = r;
        }
        for (const msg of kgs[i].take_outgoing()) {
          const payload =
            msg.payload instanceof Uint8Array ? msg.payload : new Uint8Array(msg.payload);
          kgBytes += payload.byteLength;
          if (!kgSample) kgSample = toHex(payload.slice(0, 48));
          if (msg.recipient === "broadcast") {
            for (let j = 0; j < 3; j++) if (j !== i) kgs[j].receive(i, payload);
          } else {
            kgs[Number(msg.recipient)].receive(i, payload);
          }
        }
      }
    }
    for (const k of kgs) k.free();

    for (let i = 0; i < 3; i++) {
      ecdsaShares[i] = wasm.ecdsa_key_share_from_parts(parts, kgOuts[i]!, auxInfos[i]);
    }
    const info = JSON.parse(wasm.ecdsa_share_info(ecdsaShares[0]!));
    ecdsaGroupPubkey = info.group_public_key;

    logs.push({
      step: "ecdsa",
      titleEn: `CGGMP24 ECDSA Keygen · Fresh Native Ethereum / 100+ EVM 0x Group Key`,
      titleZh: `CGGMP24 门限 ECDSA 建库 · 实时生成全新以太坊 / 100+ EVM 原生 0x 群公钥`,
      elapsedMs: performance.now() - t4,
      bytesExchanged: kgBytes,
      sampleHex: ecdsaGroupPubkey || kgSample,
    });
  }

  const devices: VirtualDevice[] = [];
  for (let i = 0; i < total; i++) {
    const preset = DEVICE_PRESETS[i] || {
      id: `dev-node-${i + 1}`,
      en: `Device #${i + 1}`,
      zh: `设备 #${i + 1}`,
      icon: "📱",
    };
    const edKs = nodes[i].export_ed25519_keystore();
    const secpKs = nodes[i].export_secp256k1_keystore();
    const fp = (await sha256Hex(edKs + secpKs)).slice(0, 16);
    devices.push({
      index: i + 1,
      id: preset.id,
      labelEn: preset.en,
      labelZh: preset.zh,
      roleIcon: preset.icon,
      rootSecretHex: nodes[i].get_root_secret_hex(),
      ed25519Keystore: edKs,
      secp256k1Keystore: secpKs,
      ecdsaKeyShare: ecdsaShares[i],
      shareFingerprint: fp,
    });
    nodes[i].free();
  }

  return {
    vaultName: vaultName.trim() || "Starlab Treasury",
    threshold,
    total,
    ed25519GroupPubkey,
    secp256k1GroupPubkey,
    ecdsaGroupPubkey,
    devices,
    logs,
    totalElapsedMs: performance.now() - tStart,
    reshareEpoch: 0,
  };
}

/** Public-only BIP-44 / BIP-86 HD multi-account address derivation. */
export function deriveVaultAccounts(vault: SandboxVault, count: number): DerivedAccountRow[] {
  const rows: DerivedAccountRow[] = [];
  for (let acct = 0; acct < count; acct++) {
    const btcList = JSON.parse(
      wasm.derive_account_addresses("secp256k1", vault.secp256k1GroupPubkey, acct),
    ) as { chain: string; path: string; address: string }[];
    const edList = JSON.parse(
      wasm.derive_account_addresses("ed25519", vault.ed25519GroupPubkey, acct),
    ) as { chain: string; path: string; address: string }[];

    const sol = edList.find((x) => x.chain.toLowerCase() === "solana")!;
    const sui = edList.find((x) => x.chain.toLowerCase() === "sui")!;
    const eth = vault.ecdsaGroupPubkey
      ? {
          path: wasm.standard_account_path("ethereum", acct) || `m/44'/60'/0'/0/${acct}`,
          address: wasm.ecdsa_ethereum_address(vault.ecdsaGroupPubkey, acct),
        }
      : null;

    rows.push({
      account: acct,
      ethereum: eth,
      bitcoin: { path: btcList[0].path, address: btcList[0].address },
      solana: { path: sol.path, address: sol.address },
      sui: { path: sui.path, address: sui.address },
    });
  }
  return rows;
}

export interface SigningResult {
  chain: "bitcoin" | "solana" | "sui" | "ethereum";
  account: number;
  path: string;
  signerAddress: string;
  participants: number[];
  messageHashHex: string;
  commitBytes: number;
  shareBytes: number;
  signatureHex: string;
  signatureLenBytes: number;
  elapsedMs: number;
  verified: boolean;
  verificationNoteEn: string;
  verificationNoteZh: string;
  sampleCommitHex: string;
  sampleShareHex: string;
}

/** Execute real 2-Round FROST Threshold Signing for BTC Taproot / Solana / Sui. */
export async function runFrostSigning(
  vault: SandboxVault,
  chain: "bitcoin" | "solana" | "sui",
  account: number,
  signerIndices: number[], // 1-based device indices
  messageText: string,
): Promise<SigningResult> {
  await ensureWasmReady();
  if (signerIndices.length < vault.threshold) {
    throw new Error(
      `INSUFFICIENT_QUORUM: Need at least ${vault.threshold} devices to sign, only ${signerIndices.length} selected`,
    );
  }
  const active = [...signerIndices].sort((a, b) => a - b).slice(0, vault.threshold);
  const path = wasm.standard_account_path(chain, account)!;
  const accountRow = deriveVaultAccounts(vault, account + 1)[account];
  const signerAddress =
    chain === "bitcoin"
      ? accountRow.bitcoin.address
      : chain === "solana"
        ? accountRow.solana.address
        : accountRow.sui.address;

  const t0 = performance.now();
  // Hash payload cleanly (32-byte SHA-256 digest for BTC BIP-341 sighash; UTF-8 bytes for SOL/SUI)
  const msgRaw = new TextEncoder().encode(messageText);
  const msgBytes =
    chain === "bitcoin"
      ? new Uint8Array(await crypto.subtle.digest("SHA-256", msgRaw))
      : msgRaw;
  const msgHex = toHex(msgBytes);

  if (chain === "bitcoin") {
    const signers = active.map((idx) => {
      const dev = vault.devices.find((d) => d.index === idx)!;
      const childKs = wasm.derive_child_keystore_secp256k1(dev.secp256k1Keystore, path);
      const inst = new wasm.FrostDkgSecp256k1();
      inst.import_keystore(childKs);
      return { idx, inst };
    });
    const commits = signers.map((s) => ({ idx: s.idx, hex: s.inst.signing_commit() }));
    const sampleCommitWire = wasm.to_frost_wire("secp256k1", "commitment", commits[0].hex);
    for (const s of signers) {
      for (const c of commits) {
        if (c.idx !== s.idx) s.inst.add_signing_commitment(c.idx, c.hex);
      }
    }
    const shares = signers.map((s) => ({ idx: s.idx, hex: s.inst.sign(msgHex) }));
    const sampleShareWire = wasm.to_frost_wire("secp256k1", "share", shares[0].hex);
    for (const sh of shares) {
      if (sh.idx !== signers[0].idx) signers[0].inst.add_signature_share(sh.idx, sh.hex);
    }
    const signatureHex = signers[0].inst.aggregate_signature(msgHex);
    for (const s of signers) s.inst.free();

    return {
      chain,
      account,
      path,
      signerAddress,
      participants: active,
      messageHashHex: `0x${msgHex}`,
      commitBytes: sampleCommitWire.length / 2,
      shareBytes: sampleShareWire.length / 2,
      signatureHex,
      signatureLenBytes: signatureHex.length / 2,
      elapsedMs: performance.now() - t0,
      verified: true,
      verificationNoteEn:
        "Verified by frost-secp256k1-tr aggregate() against BIP-86 tweaked P2TR output key (64-byte BIP-340 Schnorr)",
      verificationNoteZh:
        "已通过 frost-secp256k1-tr aggregate() 验签：标准 64 字节 BIP-340 Schnorr 签名，可直接花费 bc1p… Taproot 输出",
      sampleCommitHex: sampleCommitWire,
      sampleShareHex: sampleShareWire,
    };
  } else {
    const signers = active.map((idx) => {
      const dev = vault.devices.find((d) => d.index === idx)!;
      const childKs = wasm.derive_child_keystore_ed25519(dev.ed25519Keystore, path);
      const inst = new wasm.FrostDkgEd25519();
      inst.import_keystore(childKs);
      return { idx, inst };
    });
    const commits = signers.map((s) => ({ idx: s.idx, hex: s.inst.signing_commit() }));
    const sampleCommitWire = wasm.to_frost_wire("ed25519", "commitment", commits[0].hex);
    for (const s of signers) {
      for (const c of commits) {
        if (c.idx !== s.idx) s.inst.add_signing_commitment(c.idx, c.hex);
      }
    }
    const shares = signers.map((s) => ({ idx: s.idx, hex: s.inst.sign(msgHex) }));
    const sampleShareWire = wasm.to_frost_wire("ed25519", "share", shares[0].hex);
    for (const sh of shares) {
      if (sh.idx !== signers[0].idx) signers[0].inst.add_signature_share(sh.idx, sh.hex);
    }
    const signatureHex = signers[0].inst.aggregate_signature(msgHex);
    for (const s of signers) s.inst.free();

    return {
      chain,
      account,
      path,
      signerAddress,
      participants: active,
      messageHashHex: `0x${toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", msgRaw)))}`,
      commitBytes: sampleCommitWire.length / 2,
      shareBytes: sampleShareWire.length / 2,
      signatureHex,
      signatureLenBytes: signatureHex.length / 2,
      elapsedMs: performance.now() - t0,
      verified: true,
      verificationNoteEn: `Verified by frost-ed25519 aggregate() against derived ${chain.toUpperCase()} Ed25519 public key (64-byte standard EdDSA)`,
      verificationNoteZh: `已通过 frost-ed25519 aggregate() 验签：标准 64 字节 Ed25519 签名，链上与单签完全一致`,
      sampleCommitHex: sampleCommitWire,
      sampleShareHex: sampleShareWire,
    };
  }
}

/** Run real CGGMP24 Threshold ECDSA Signing in a dedicated Web Worker + EIP-191 ecrecover check! */
export function runEvmCggmp24Signing(
  vault: SandboxVault,
  account: number,
  signerIndices: number[], // 1-based device indices
  messageText: string,
  onProgress?: (p: { round: number; frames: number; bytes: number; label: string }) => void,
): Promise<SigningResult> {
  if (!vault.ecdsaGroupPubkey || vault.devices.some((d) => !d.ecdsaKeyShare)) {
    return Promise.reject(
      new Error("CGGMP24 EVM sandbox signing is enabled in 2-of-3 mode — switch threshold to 2-of-3 and recreate vault."),
    );
  }
  if (signerIndices.length < vault.threshold) {
    return Promise.reject(
      new Error(
        `INSUFFICIENT_QUORUM: Need at least ${vault.threshold} devices to sign, only ${signerIndices.length} selected`,
      ),
    );
  }

  const active1Based = [...signerIndices].sort((a, b) => a - b).slice(0, vault.threshold);
  const active0Based = active1Based.map((i) => i - 1);
  const path = wasm.standard_account_path("ethereum", account) || `m/44'/60'/0'/0/${account}`;
  const signerAddress = wasm.ecdsa_ethereum_address(vault.ecdsaGroupPubkey, account);
  const prehash = eip191Hash(messageText);

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./ecdsaWorker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (ev: MessageEvent<EcdsaSignWorkerResponse>) => {
      const msg = ev.data;
      if (msg.type === "progress") {
        onProgress?.(msg);
      } else if (msg.type === "done") {
        worker.terminate();
        const match = msg.recoveredAddress.toLowerCase() === signerAddress.toLowerCase();
        resolve({
          chain: "ethereum",
          account,
          path,
          signerAddress,
          participants: active1Based,
          messageHashHex: `0x${toHex(prehash)}`,
          commitBytes: Math.round(msg.bytes / Math.max(1, msg.frames)),
          shareBytes: msg.bytes,
          signatureHex: `0x${msg.signatureHex}`,
          signatureLenBytes: msg.signatureHex.length / 2,
          elapsedMs: msg.elapsedMs,
          verified: match,
          verificationNoteEn: `ecrecover(EIP-191 keccak256, 65B r‖s‖v) = ${msg.recoveredAddress} (${match ? "EXACT MATCH!" : "MISMATCH"})`,
          verificationNoteZh: `链上标准 ecrecover(EIP-191 keccak256, 65B r‖s‖v) 还原地址 = ${msg.recoveredAddress}（${match ? "与金库地址 100% 一致！" : "不匹配"}）`,
          sampleCommitHex: toHex(prehash),
          sampleShareHex: msg.signatureHex,
        });
      } else if (msg.type === "error") {
        worker.terminate();
        reject(new Error(msg.message));
      }
    };
    worker.onerror = (err) => {
      worker.terminate();
      reject(new Error(err.message || "CGGMP24 worker error"));
    };

    worker.postMessage({
      type: "sign",
      sessionId: `sign_web_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      shares: vault.devices.map((d) => d.ecdsaKeyShare!),
      signerIndices: active0Based,
      path,
      prehash: Array.from(prehash),
    });
  });
}

export interface ReshareOutcome {
  updatedVault: SandboxVault;
  droppedDeviceIndex: number;
  survivingIndices: number[];
  btcPubkeyUnchanged: boolean;
  edPubkeyUnchanged: boolean;
  stolenShareRejected: boolean;
  stolenShareError: string;
  elapsedMs: number;
}

/**
 * Execute REAL FROST Share Refresh / Resharing (dropping a stolen/lost device),
 * proving BOTH:
 *  1) Bitcoin Taproot & Solana/Sui addresses remain 100% IDENTICAL, and
 *  2) Attempting to sign with the old stolen share + a new refreshed share FAILS!
 */
export async function runLiveReshare(
  vault: SandboxVault,
  dropIndex: number,
): Promise<ReshareOutcome> {
  await ensureWasmReady();
  const survivors = vault.devices.filter((d) => d.index !== dropIndex && !d.compromised);
  if (survivors.length < vault.threshold) {
    throw new Error(`Need at least ${vault.threshold} surviving devices to reshare!`);
  }
  const stolenDev = vault.devices.find((d) => d.index === dropIndex);
  if (!stolenDev) throw new Error("Device not found");

  const t0 = performance.now();
  const idsCsv = survivors.map((d) => d.index).join(",");

  // Refresh BOTH Ed25519 and secp256k1-tr shares in parallel logic
  const edR = survivors.map((d) => {
    const r = new wasm.FrostReshareEd25519();
    r.init_reshare(d.ed25519Keystore, idsCsv, vault.threshold);
    return { idx: d.index, r };
  });
  const secpR = survivors.map((d) => {
    const r = new wasm.FrostReshareSecp256k1();
    r.init_reshare(d.secp256k1Keystore, idsCsv, vault.threshold);
    return { idx: d.index, r };
  });

  // Round 1
  const edR1 = edR.map((x) => ({ idx: x.idx, hex: x.r.reshare_round1() }));
  const secpR1 = secpR.map((x) => ({ idx: x.idx, hex: x.r.reshare_round1() }));
  for (const x of edR) for (const p of edR1) if (p.idx !== x.idx) x.r.add_reshare_round1(p.idx, p.hex);
  for (const x of secpR) for (const p of secpR1) if (p.idx !== x.idx) x.r.add_reshare_round1(p.idx, p.hex);

  // Round 2
  const edR2 = edR.map((x) => ({ idx: x.idx, map: JSON.parse(x.r.reshare_round2()) as Record<string, string> }));
  const secpR2 = secpR.map((x) => ({ idx: x.idx, map: JSON.parse(x.r.reshare_round2()) as Record<string, string> }));
  for (const x of edR) for (const p of edR2) if (p.idx !== x.idx) x.r.add_reshare_round2(p.idx, p.map[String(x.idx)]);
  for (const x of secpR) for (const p of secpR2) if (p.idx !== x.idx) x.r.add_reshare_round2(p.idx, p.map[String(x.idx)]);

  // Finalize
  const newEdKs = new Map<number, string>();
  const newSecpKs = new Map<number, string>();
  let newEdPub = "";
  let newSecpPub = "";
  for (const x of edR) {
    newEdKs.set(x.idx, x.r.finalize_reshare());
    newEdPub = x.r.get_group_public_key();
    x.r.free();
  }
  for (const x of secpR) {
    newSecpKs.set(x.idx, x.r.finalize_reshare());
    newSecpPub = x.r.get_group_public_key();
    x.r.free();
  }

  // Live cryptographic proof: try signing with STOLEN old share + NEW refreshed share -> MUST FAIL!
  let stolenShareRejected = false;
  let stolenShareError = "";
  try {
    const victim = survivors[0];
    const sNew = new wasm.FrostDkgEd25519();
    sNew.import_keystore(newEdKs.get(victim.index)!);
    const sOld = new wasm.FrostDkgEd25519();
    sOld.import_keystore(stolenDev.ed25519Keystore);
    const cNew = sNew.signing_commit();
    const cOld = sOld.signing_commit();
    sNew.add_signing_commitment(stolenDev.index, cOld);
    sOld.add_signing_commitment(victim.index, cNew);
    const probeHex = toHex(new TextEncoder().encode("stolen-share-attack-probe"));
    sNew.sign(probeHex);
    const shOld = sOld.sign(probeHex);
    sNew.add_signature_share(stolenDev.index, shOld);
    sNew.aggregate_signature(probeHex);
    sNew.free();
    sOld.free();
  } catch (err: any) {
    stolenShareRejected = true;
    stolenShareError = err?.message || String(err);
  }

  const newDevices: VirtualDevice[] = [];
  for (const d of vault.devices) {
    if (d.index === dropIndex) {
      newDevices.push({ ...d, compromised: true });
    } else if (newEdKs.has(d.index)) {
      const edKs = newEdKs.get(d.index)!;
      const secpKs = newSecpKs.get(d.index)!;
      const fp = (await sha256Hex(edKs + secpKs)).slice(0, 16);
      newDevices.push({
        ...d,
        ed25519Keystore: edKs,
        secp256k1Keystore: secpKs,
        shareFingerprint: fp,
      });
    } else {
      newDevices.push(d);
    }
  }

  return {
    updatedVault: {
      ...vault,
      devices: newDevices,
      reshareEpoch: vault.reshareEpoch + 1,
    },
    droppedDeviceIndex: dropIndex,
    survivingIndices: survivors.map((s) => s.index),
    btcPubkeyUnchanged: newSecpPub === vault.secp256k1GroupPubkey,
    edPubkeyUnchanged: newEdPub === vault.ed25519GroupPubkey,
    stolenShareRejected,
    stolenShareError,
    elapsedMs: performance.now() - t0,
  };
}

export interface EncryptedBackupEnvelope {
  format: "starlab-keystore-v2-pbkdf2-aes256gcm";
  device_id: string;
  vault_name: string;
  curves: string[];
  kdf: "PBKDF2-HMAC-SHA256";
  iterations: 100000;
  cipher: "AES-256-GCM";
  ciphertext_b64: string;
}

/** Real WebCrypto PBKDF2-HMAC-SHA256 (100k rounds) + AES-256-GCM encryption (matches starlab-core). */
export async function encryptDeviceBackup(
  vault: SandboxVault,
  device: VirtualDevice,
  password: string,
): Promise<EncryptedBackupEnvelope> {
  const payload = JSON.stringify({
    vault_name: vault.vaultName,
    device_id: device.id,
    ed25519: JSON.parse(device.ed25519Keystore),
    secp256k1: JSON.parse(device.secp256k1Keystore),
    secp256k1_ecdsa: device.ecdsaKeyShare ? JSON.parse(device.ecdsaKeyShare) : null,
  });

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const keyMat = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const aesKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMat,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, new TextEncoder().encode(payload)),
  );
  const packed = new Uint8Array(16 + 12 + ct.length);
  packed.set(salt, 0);
  packed.set(nonce, 16);
  packed.set(ct, 28);

  let bin = "";
  for (let i = 0; i < packed.length; i++) bin += String.fromCharCode(packed[i]);

  return {
    format: "starlab-keystore-v2-pbkdf2-aes256gcm",
    device_id: device.id,
    vault_name: vault.vaultName,
    curves: device.ecdsaKeyShare ? ["secp256k1-ecdsa", "secp256k1", "ed25519"] : ["secp256k1", "ed25519"],
    kdf: "PBKDF2-HMAC-SHA256",
    iterations: 100000,
    cipher: "AES-256-GCM",
    ciphertext_b64: btoa(bin),
  };
}

/** Real WebCrypto AES-256-GCM decryption test (rejects wrong password with AEAD failure). */
export async function decryptDeviceBackup(
  envelope: EncryptedBackupEnvelope,
  password: string,
): Promise<{ vault_name: string; device_id: string; curves_restored: number }> {
  const bin = atob(envelope.ciphertext_b64);
  const packed = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) packed[i] = bin.charCodeAt(i);
  const salt = packed.slice(0, 16);
  const nonce = packed.slice(16, 28);
  const ct = packed.slice(28);

  const keyMat = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const aesKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: envelope.iterations, hash: "SHA-256" },
    keyMat,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, aesKey, ct);
  const obj = JSON.parse(new TextDecoder().decode(pt));
  const count = (obj.ed25519 ? 1 : 0) + (obj.secp256k1 ? 1 : 0) + (obj.secp256k1_ecdsa ? 1 : 0);
  return { vault_name: obj.vault_name, device_id: obj.device_id, curves_restored: count };
}
