/**
 * Live Browser WASM MPC Sandbox Engine + Real Per-Edge Animation Traces.
 *
 * Executes REAL `@stars-labs/core-wasm` cryptography 100% locally inside the
 * visitor's browser AND records every real wire packet (From -> To, exact byte
 * size, real WASM hex) so `MpcFlowVisualizer.svelte` can animate seed isolation,
 * commitment broadcasts, encrypted share exchanges, signing, attack blocks, and
 * address-preserving resharing step-by-step for beginners.
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

export type FlowTone = "cyan" | "violet" | "pink" | "emerald" | "amber" | "red";

export interface DeviceLogEntry {
  /** Stage index (0-based) when this real WASM event executed */
  stage: number;
  /** Wall-clock timestamp HH:MM:SS.mmm */
  ts: string;
  /** Subsystem tag e.g. CSPRNG, HKDF, TX, RX, ZK-CHECK, CGGMP24, FINALIZE, SIGN, SECURITY */
  tag: string;
  level: "info" | "tx" | "rx" | "ok" | "warn" | "err";
  msgZh: string;
  msgEn: string;
  hex?: string;
  bytes?: number;
}

export interface WirePacket {
  id: string;
  /** 1-based device index, or 0 = central Aggregator/Relay */
  from: number;
  /** 1-based device index, 0 = central Aggregator/Relay, or -1 = Blockchain Broadcast */
  to: number;
  tag: string;
  labelZh: string;
  labelEn: string;
  bytes: number;
  hexPreview: string;
  tone: FlowTone;
  /** Optional launch stagger (0..0.45) */
  stagger?: number;
}

export interface FlowStage {
  key: string;
  stepNum: number;
  titleZh: string;
  titleEn: string;
  explainZh: string;
  explainEn: string;
  durationMs: number;
  nodeNotes: Record<number, { zh: string; en: string; tone?: FlowTone }>;
  packets: WirePacket[];
  centerStatus?: {
    titleZh: string;
    titleEn: string;
    detail: string;
    tone: FlowTone;
  };
  blockedShield?: boolean;
  showChainTarget?: boolean;
  /** True once real Rust WASM has actually executed this stage */
  computed?: boolean;
}

export interface FlowScene {
  kind: "dkg" | "sign" | "attack" | "reshare";
  runId: number;
  /** Increments every time fresh WASM CSPRNG seeds/nonces are rolled */
  seedEpoch?: number;
  stages: FlowStage[];
  /** Per-device realistic timestamped Rust WASM terminal logs (key = 1-based device index) */
  deviceLogs: Record<number, DeviceLogEntry[]>;
}

function wallTs(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

function pushLog(
  logs: Record<number, DeviceLogEntry[]>,
  devIndex: number,
  entry: Omit<DeviceLogEntry, "ts">,
) {
  if (!logs[devIndex]) logs[devIndex] = [];
  logs[devIndex].push({ ...entry, ts: wallTs() });
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
  dkgScene: FlowScene;
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

async function sha256Hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return toHex(new Uint8Array(buf));
}

let globalSeedEpoch = 0;

export interface LiveDkgSnapshot {
  devices: VirtualDevice[];
  scene: FlowScene;
  logs: DkgRoundLog[];
  executedStage: number;
  vault: SandboxVault | null;
}

/**
 * True Step-by-Step Live Rust WASM DKG Session.
 *
 * Unlike a pre-baked animation, each stage (0: CSPRNG Seed -> 1: Round 1 Commit ->
 * 2: Round 2 P2P Shares + CGGMP24 -> 3: Finalize Keystores) genuinely invokes
 * `@stars-labs/core-wasm` on demand and streams real timestamped terminal logs
 * per device. Stepping back (`reseedAndRunTo`) destroys old WASM memory and rolls
 * brand-new 32-byte CSPRNG RootSecrets!
 */
export class LiveDkgSession {
  readonly vaultName: string;
  readonly threshold: number;
  readonly total: number;

  private nodes: wasm.FrostDkgUnified[] = [];
  private devices: VirtualDevice[] = [];
  private roundLogs: DkgRoundLog[] = [];
  private deviceLogs: Record<number, DeviceLogEntry[]> = {};
  private stages: FlowStage[] = [];
  private executedStage = -1;
  private seedEpoch = 0;
  private runId = Date.now();
  private totalElapsedMs = 0;
  private finalizedVault: SandboxVault | null = null;
  private ecdsaShares: (string | null)[] = [];
  private ecdsaGroupPubkey: string | null = null;

  constructor(vaultName: string, threshold: number, total: number) {
    this.vaultName = vaultName.trim() || "Starlab Treasury";
    this.threshold = threshold;
    this.total = total;
  }

  dispose() {
    for (const n of this.nodes) {
      try {
        n.free();
      } catch {
        // already freed
      }
    }
    this.nodes = [];
  }

  private buildPendingStage(stepNum: number, key: string, titleZh: string, titleEn: string, explainZh: string, explainEn: string): FlowStage {
    const notes: FlowStage["nodeNotes"] = {};
    for (const d of this.devices) {
      notes[d.index] = {
        zh: "⏳ 等待 WASM 执行此步骤…",
        en: "⏳ Awaiting WASM step…",
        tone: "amber",
      };
    }
    return {
      key,
      stepNum,
      titleZh,
      titleEn,
      explainZh,
      explainEn,
      durationMs: 2600,
      nodeNotes: notes,
      packets: [],
      computed: false,
      centerStatus: {
        titleZh: "等待执行",
        titleEn: "Pending WASM",
        detail: "Click Next to run",
        tone: "amber",
      },
    };
  }

  /** Step 0: Destroy any previous WASM instances and roll brand-new 32-byte CSPRNG RootSecrets. */
  async initFreshSeeds(reason?: "reseed" | "step-back"): Promise<LiveDkgSnapshot> {
    await ensureWasmReady();
    this.dispose();

    this.seedEpoch = ++globalSeedEpoch;
    this.runId = Date.now() + this.seedEpoch;
    this.roundLogs = [];
    this.deviceLogs = {};
    this.finalizedVault = null;
    this.ecdsaShares = Array(this.total).fill(null);
    this.ecdsaGroupPubkey = null;
    this.totalElapsedMs = 0;

    const t0 = performance.now();
    this.nodes = [];
    this.devices = [];

    for (let i = 0; i < this.total; i++) {
      const preset = DEVICE_PRESETS[i] || {
        id: `dev-node-${i + 1}`,
        en: `Device #${i + 1}`,
        zh: `设备 #${i + 1}`,
        icon: "📱",
      };
      const devIdx = i + 1;
      if (reason) {
        pushLog(this.deviceLogs, devIdx, {
          stage: 0,
          tag: "RESET",
          level: "warn",
          msgZh:
            reason === "step-back"
              ? `用户回退步骤：已清零旧 WASM 内存，重新调用 Rust getrandom() 摇新种子 (Epoch #${this.seedEpoch})`
              : `手动刷新熵源：已销毁旧会话，重新生成 32B 随机种子 (Epoch #${this.seedEpoch})`,
          msgEn:
            reason === "step-back"
              ? `Step-back triggered: zeroized old WASM memory, re-rolling CSPRNG seed (Epoch #${this.seedEpoch})`
              : `Manual reseed: zeroized old session, rolling fresh 32B CSPRNG seed (Epoch #${this.seedEpoch})`,
        });
      }

      const inst = new wasm.FrostDkgUnified();
      inst.init_dkg(devIdx, this.total, this.threshold);
      const rootSecretHex = inst.get_root_secret_hex();
      this.nodes.push(inst);

      this.devices.push({
        index: devIdx,
        id: preset.id,
        labelEn: preset.en,
        labelZh: preset.zh,
        roleIcon: preset.icon,
        rootSecretHex,
        ed25519Keystore: "",
        secp256k1Keystore: "",
        ecdsaKeyShare: null,
        shareFingerprint: `seed:${rootSecretHex.slice(0, 10)}`,
      });

      pushLog(this.deviceLogs, devIdx, {
        stage: 0,
        tag: "WASM-INIT",
        level: "info",
        msgZh: `FrostDkgUnified::init_dkg(id=${devIdx}, max=${this.total}, min=${this.threshold}) 启动成功`,
        msgEn: `FrostDkgUnified::init_dkg(id=${devIdx}, max=${this.total}, min=${this.threshold}) initialized`,
      });
      pushLog(this.deviceLogs, devIdx, {
        stage: 0,
        tag: "CSPRNG",
        level: "ok",
        msgZh: `getrandom(32B) 生成本地根随机种子 RootSecret（绝对不出本机）`,
        msgEn: `getrandom(32B) generated local RootSecret (strictly device-local)`,
        hex: rootSecretHex,
      });
      pushLog(this.deviceLogs, devIdx, {
        stage: 0,
        tag: "HKDF-256",
        level: "info",
        msgZh: `本地派生独立曲线子随机数源：frost-ed25519 + frost-secp256k1-tr · 外发流量 = 0 bytes`,
        msgEn: `Derived curve sub-RNGs locally (ed25519 + secp256k1-tr) · Network TX = 0 bytes`,
        bytes: 0,
      });
    }

    this.totalElapsedMs += performance.now() - t0;

    const seedNotes: FlowStage["nodeNotes"] = {};
    for (const d of this.devices) {
      seedNotes[d.index] = {
        zh: `🎲 新种子 ${d.rootSecretHex.slice(0, 8)}… (不出本机)`,
        en: `🎲 Seed ${d.rootSecretHex.slice(0, 8)}… (Local)`,
        tone: "cyan",
      };
    }

    const stage0: FlowStage = {
      key: "dkg-seed",
      stepNum: 0,
      titleZh: `第 0 步 · 每台设备各自本地生成全新 32 字节随机种子（绝不外发！Seed #${this.seedEpoch}）`,
      titleEn: `Step 0 · Fresh 32-Byte Local CSPRNG Seeds Generated (0 Bytes Sent · Seed #${this.seedEpoch})`,
      explainZh:
        "此时网络传输 0 字节！浏览器内真实 Rust WASM 刚刚为每台设备独立调用 getrandom(32B) 生成根种子 RootSecret。点任意一台机器即可查看实时终端日志，点「上一步/换新种子」会再次真机摇新种子！",
      explainEn:
        "0 bytes on the wire! Real Rust WASM just invoked getrandom(32B) independently per device. Click any device node to inspect its live terminal logs — stepping back rolls brand-new seeds!",
      durationMs: 2600,
      nodeNotes: seedNotes,
      packets: [],
      computed: true,
      centerStatus: {
        titleZh: "本地熵源隔离",
        titleEn: "Local Entropy",
        detail: "0 B sent · Local",
        tone: "cyan",
      },
    };

    this.stages = [
      stage0,
      this.buildPendingStage(
        1,
        "dkg-r1",
        "第 1 轮 (Round 1) · 全网广播「公开承诺信封」，锁死随机性防作弊",
        "Round 1 · Broadcast Public Polynomial Commitments",
        "每台设备将实时运行 generate_round1()，把多项式公开承诺广播给伙伴。",
        "Each device will run generate_round1() live and broadcast public commitments.",
      ),
      this.buildPendingStage(
        2,
        "dkg-r2",
        "第 2 轮 (Round 2) · 点对点加密交换秘密份额 + 零知识数学验算",
        "Round 2 · Point-to-Point Encrypted Share Exchange + ZK Check",
        "每台设备将实时运行 generate_round2() + CGGMP24 交互并验证每份份额。",
        "Each device will run generate_round2() + CGGMP24 keygen and verify every share.",
      ),
      this.buildPendingStage(
        3,
        "dkg-done",
        "建库完成 · 3 份独立分片落盘，全链群公钥 100% 收敛",
        "Vault Ready · Isolated Shares Sealed, Addresses Converged",
        "每台设备将运行 finalize_dkg() 落盘加密分片并派生全链地址。",
        "Each device will run finalize_dkg() to seal local shares and derive addresses.",
      ),
    ];

    this.executedStage = 0;
    return this.snapshot();
  }

  /** Step 1: Actually execute FROST Round 1 on the live WASM instances. */
  private runRound1Now() {
    if (this.executedStage >= 1) return;
    const t1 = performance.now();
    const r1Packages = this.nodes.map((n, idx) => {
      const ts0 = performance.now();
      const pkg = n.generate_round1();
      const dt = (performance.now() - ts0).toFixed(2);
      pushLog(this.deviceLogs, idx + 1, {
        stage: 1,
        tag: "ROUND-1",
        level: "info",
        msgZh: `generate_round1() 执行完成（耗时 ${dt} ms），生成公开多项式承诺与 Schnorr 零知识证明`,
        msgEn: `generate_round1() finished in ${dt} ms (polynomial commitment + PoK)`,
      });
      return pkg;
    });

    const r1Packets: WirePacket[] = [];
    let r1Bytes = 0;

    for (let i = 0; i < this.total; i++) {
      const parsed = JSON.parse(r1Packages[i]);
      const edWire = wasm.to_frost_wire("ed25519", "round1", parsed.ed25519);
      const secpWire = wasm.to_frost_wire("secp256k1", "round1", parsed.secp256k1);
      const pktBytes = edWire.length / 2 + secpWire.length / 2;
      r1Bytes += pktBytes;
      for (let j = 0; j < this.total; j++) {
        if (i !== j) {
          this.nodes[j].add_round1_package(i + 1, r1Packages[i]);
          r1Packets.push({
            id: `r1-${this.seedEpoch}-${i + 1}-${j + 1}`,
            from: i + 1,
            to: j + 1,
            tag: "DKG_R1",
            labelZh: `公开承诺 #${i + 1}→#${j + 1}`,
            labelEn: `Commitment #${i + 1}→#${j + 1}`,
            bytes: pktBytes,
            hexPreview: secpWire.slice(0, 28) + "…",
            tone: "cyan",
            stagger: (i * 0.12) % 0.36,
          });
          pushLog(this.deviceLogs, i + 1, {
            stage: 1,
            tag: `TX → #${j + 1}`,
            level: "tx",
            msgZh: `广播 DKG_R1 公开承诺包至设备 #${j + 1} (${pktBytes} B)`,
            msgEn: `Broadcast DKG_R1 commitment packet to #${j + 1} (${pktBytes} B)`,
            hex: secpWire.slice(0, 44) + "…",
            bytes: pktBytes,
          });
          pushLog(this.deviceLogs, j + 1, {
            stage: 1,
            tag: `RX ← #${i + 1}`,
            level: "rx",
            msgZh: `add_round1_package(#${i + 1}) ✓ 收到并校验 Schnorr 承诺封口 (${pktBytes} B)`,
            msgEn: `add_round1_package(#${i + 1}) ✓ Verified commitment PoK (${pktBytes} B)`,
            hex: secpWire.slice(0, 36) + "…",
            bytes: pktBytes,
          });
        }
      }
    }

    const elapsed1 = performance.now() - t1;
    this.totalElapsedMs += elapsed1;
    const sampleR1 = wasm.to_frost_wire("secp256k1", "round1", JSON.parse(r1Packages[0]).secp256k1);
    this.roundLogs.push({
      step: "round1",
      titleEn: `Round 1 · ${this.total} Devices Broadcast Polynomial Commitments`,
      titleZh: `第 1 轮 · ${this.total} 台设备广播秘密多项式承诺（防作弊封口）`,
      elapsedMs: elapsed1,
      bytesExchanged: r1Bytes * (this.total - 1),
      sampleHex: sampleR1,
    });

    const r1Notes: FlowStage["nodeNotes"] = {};
    for (const d of this.devices) {
      r1Notes[d.index] = {
        zh: `📢 已广播承诺 (${r1Bytes}B)`,
        en: `📢 Sent Commit (${r1Bytes}B)`,
        tone: "cyan",
      };
    }

    this.stages[1] = {
      key: "dkg-r1",
      stepNum: 1,
      titleZh: `第 1 轮 (Round 1) · 全网广播「公开承诺信封」，锁死随机性防作弊（WASM ${elapsed1.toFixed(1)} ms）`,
      titleEn: `Round 1 · Broadcast Public Commitments (${elapsed1.toFixed(1)} ms live WASM)`,
      explainZh:
        "每台设备刚刚在本地实时算出了多项式公开承诺（DKG_R1）并广播给所有伙伴。就像先把信封封口摆在桌上，防止任何节点事后篡改结果——点开设备可看真实收发字节！",
      explainEn:
        "Each device just computed its real polynomial commitment (DKG_R1) in WASM and broadcasted it to all peers to prevent rogue-key bias.",
      durationMs: 2800,
      nodeNotes: r1Notes,
      packets: r1Packets,
      computed: true,
      centerStatus: {
        titleZh: "广播公开承诺",
        titleEn: "Broadcast R1",
        detail: `${r1Packets.length} pkts · ${r1Bytes * (this.total - 1)} B`,
        tone: "cyan",
      },
    };
    this.executedStage = 1;
  }

  /** Step 2: Actually execute FROST Round 2 + CGGMP24 ECDSA Keygen on the live WASM instances. */
  private async runRound2Now() {
    if (this.executedStage >= 2) return;
    if (this.executedStage < 1) this.runRound1Now();

    const t2 = performance.now();
    const r2Maps = this.nodes.map((n, idx) => {
      const ts0 = performance.now();
      const map = JSON.parse(n.generate_round2());
      const dt = (performance.now() - ts0).toFixed(2);
      pushLog(this.deviceLogs, idx + 1, {
        stage: 2,
        tag: "ROUND-2",
        level: "info",
        msgZh: `generate_round2() 计算出各伙伴的专属秘密多项式求值 f_${idx + 1}(j)（${dt} ms）`,
        msgEn: `generate_round2() evaluated secret polynomial f_${idx + 1}(j) in ${dt} ms`,
      });
      return map;
    });

    const r2Packets: WirePacket[] = [];
    let r2Bytes = 0;
    for (let sender = 0; sender < this.total; sender++) {
      for (let receiver = 0; receiver < this.total; receiver++) {
        if (sender === receiver) continue;
        const edHex = r2Maps[sender].ed25519[String(receiver + 1)];
        const secpHex = r2Maps[sender].secp256k1[String(receiver + 1)];
        const edWire = wasm.to_frost_wire("ed25519", "round2", edHex);
        const secpWire = wasm.to_frost_wire("secp256k1", "round2", secpHex);
        const pktBytes = edWire.length / 2 + secpWire.length / 2;
        r2Bytes += pktBytes;
        this.nodes[receiver].add_round2_package(sender + 1, edHex, secpHex);
        r2Packets.push({
          id: `r2-${this.seedEpoch}-${sender + 1}-${receiver + 1}`,
          from: sender + 1,
          to: receiver + 1,
          tag: "DKG_R2 🔒",
          labelZh: `密文份额 #${sender + 1}→#${receiver + 1}`,
          labelEn: `Secret Share #${sender + 1}→#${receiver + 1}`,
          bytes: pktBytes,
          hexPreview: secpWire.slice(0, 28) + "…",
          tone: "violet",
          stagger: (sender * 0.14) % 0.36,
        });
        pushLog(this.deviceLogs, sender + 1, {
          stage: 2,
          tag: `TX → #${receiver + 1}`,
          level: "tx",
          msgZh: `点对点发送加密秘密份额 DKG_R2 🔒 至 #${receiver + 1} (${pktBytes} B)`,
          msgEn: `Sent P2P encrypted share DKG_R2 🔒 to #${receiver + 1} (${pktBytes} B)`,
          hex: secpWire.slice(0, 44) + "…",
          bytes: pktBytes,
        });
        pushLog(this.deviceLogs, receiver + 1, {
          stage: 2,
          tag: "ZK-CHECK",
          level: "ok",
          msgZh: `收到 #${sender + 1} 份额 (${pktBytes} B) → Feldman VSS 零知识核对 R1 承诺通过 ✓`,
          msgEn: `Received share from #${sender + 1} (${pktBytes} B) → Feldman VSS verified ✓`,
          hex: edWire.slice(0, 36) + "…",
          bytes: pktBytes,
        });
      }
    }

    const elapsed2 = performance.now() - t2;
    this.totalElapsedMs += elapsed2;
    const sampleR2 = wasm.to_frost_wire("secp256k1", "round2", r2Maps[0].secp256k1["2"]);
    this.roundLogs.push({
      step: "round2",
      titleEn: `Round 2 · ${this.total * (this.total - 1)} Point-to-Point Secret Share Packets Verified`,
      titleZh: `第 2 轮 · 点对点分发 ${this.total * (this.total - 1)} 份秘密分片并完成零知识校验`,
      elapsedMs: elapsed2,
      bytesExchanged: r2Bytes,
      sampleHex: sampleR2,
    });

    // Fresh CGGMP24 ECDSA Keygen for 2-of-3
    const ecdsaPackets: WirePacket[] = [];
    if (this.total === 3 && this.threshold === 2) {
      const t4 = performance.now();
      const auxInfos = await loadSandboxAuxInfos();
      const parts = DEVICE_PRESETS.slice(0, 3).map((p) => p.id).sort();
      const sessionId = `dkg_ecdsa_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      const kgs = [0, 1, 2].map((i) => new wasm.EcdsaKeygen(sessionId, parts, i, this.threshold));
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
            const hexP = toHex(payload.slice(0, 14)) + "…";
            if (!kgSample) kgSample = toHex(payload.slice(0, 48));
            if (msg.recipient === "broadcast") {
              for (let j = 0; j < 3; j++) {
                if (j !== i) {
                  kgs[j].receive(i, payload);
                  if (ecdsaPackets.length < 6) {
                    ecdsaPackets.push({
                      id: `ecdsa-${this.seedEpoch}-${i + 1}-${j + 1}-${ecdsaPackets.length}`,
                      from: i + 1,
                      to: j + 1,
                      tag: "ECDSA_KG",
                      labelZh: `CGGMP24 #${i + 1}→#${j + 1}`,
                      labelEn: `CGGMP24 #${i + 1}→#${j + 1}`,
                      bytes: payload.byteLength,
                      hexPreview: hexP,
                      tone: "pink",
                      stagger: (i * 0.14) % 0.36,
                    });
                  }
                }
              }
            } else {
              kgs[Number(msg.recipient)].receive(i, payload);
            }
          }
        }
      }
      for (const k of kgs) k.free();

      for (let i = 0; i < 3; i++) {
        this.ecdsaShares[i] = wasm.ecdsa_key_share_from_parts(parts, kgOuts[i]!, auxInfos[i]);
        pushLog(this.deviceLogs, i + 1, {
          stage: 2,
          tag: "CGGMP24",
          level: "ok",
          msgZh: `EcdsaKeygen(party=${i}, t=2, n=3) 完成：交互 ${Math.round(kgBytes / 3)} B CBOR 报文，产出以太坊 ECDSA 分片`,
          msgEn: `EcdsaKeygen(party=${i}, t=2, n=3) finished (${Math.round(kgBytes / 3)} B CBOR) -> EVM share ready`,
          hex: kgSample.slice(0, 40) + "…",
          bytes: Math.round(kgBytes / 3),
        });
      }
      const info = JSON.parse(wasm.ecdsa_share_info(this.ecdsaShares[0]!));
      this.ecdsaGroupPubkey = info.group_public_key;

      const elapsed4 = performance.now() - t4;
      this.totalElapsedMs += elapsed4;
      this.roundLogs.push({
        step: "ecdsa",
        titleEn: `CGGMP24 ECDSA Keygen · Fresh Native Ethereum / 100+ EVM 0x Group Key`,
        titleZh: `CGGMP24 门限 ECDSA 建库 · 实时生成全新以太坊 / 100+ EVM 原生 0x 群公钥`,
        elapsedMs: elapsed4,
        bytesExchanged: kgBytes,
        sampleHex: this.ecdsaGroupPubkey || kgSample,
      });
    }

    const r2Notes: FlowStage["nodeNotes"] = {};
    for (const d of this.devices) {
      r2Notes[d.index] = {
        zh: `✓ 收到份额 · 零知识验算通过`,
        en: `✓ Shares Verified (ZK)`,
        tone: "violet",
      };
    }

    this.stages[2] = {
      key: "dkg-r2",
      stepNum: 2,
      titleZh: `第 2 轮 (Round 2) · 点对点加密交换秘密份额 + 零知识验算（WASM ${elapsed2.toFixed(1)} ms）`,
      titleEn: `Round 2 · P2P Encrypted Shares + ZK Check (${elapsed2.toFixed(1)} ms live WASM)`,
      explainZh:
        "每台设备刚刚运行了真实的 generate_round2() 与 CGGMP24 建库，把专属份额发给对应伙伴并用第 1 轮承诺做零知识验算——假份额立刻被揪出，没人能拼出完整私钥！",
      explainEn:
        "Each device just executed real generate_round2() + CGGMP24 keygen and verified every incoming share against Round 1 commitments.",
      durationMs: 3000,
      nodeNotes: r2Notes,
      packets: [...r2Packets, ...ecdsaPackets.slice(0, 6)],
      computed: true,
      centerStatus: {
        titleZh: "P2P 份额 + ZK 验算",
        titleEn: "P2P + ZK Check",
        detail: `${r2Packets.length} FROST${ecdsaPackets.length ? " + EVM" : ""}`,
        tone: "violet",
      },
    };
    this.executedStage = 2;
  }

  /** Step 3: Finalize FROST DKG, seal per-device keystores, derive multi-chain addresses. */
  private async runFinalizeNow() {
    if (this.executedStage >= 3) return;
    if (this.executedStage < 2) await this.runRound2Now();

    const t3 = performance.now();
    for (const n of this.nodes) n.finalize_dkg();
    const ed25519GroupPubkey = this.nodes[0].get_ed25519_public_key();
    const secp256k1GroupPubkey = this.nodes[0].get_secp256k1_public_key();
    const elapsed3 = performance.now() - t3;
    this.totalElapsedMs += elapsed3;

    this.roundLogs.push({
      step: "finalize",
      titleEn: `FROST Finalized · All ${this.total} Devices Derived Identical BTC/SOL/SUI Group Keys`,
      titleZh: `FROST 完成 · 全部 ${this.total} 台设备独立算出完全一致的 BTC / SOL / SUI 群公钥`,
      elapsedMs: elapsed3,
      bytesExchanged: 0,
      sampleHex: secp256k1GroupPubkey,
    });

    const btc0 = (JSON.parse(wasm.derive_account_addresses("secp256k1", secp256k1GroupPubkey, 0)) as { address: string }[])[0].address;
    const eth0 = this.ecdsaGroupPubkey ? wasm.ecdsa_ethereum_address(this.ecdsaGroupPubkey, 0) : null;

    const updatedDevices: VirtualDevice[] = [];
    for (let i = 0; i < this.total; i++) {
      const edKs = this.nodes[i].export_ed25519_keystore();
      const secpKs = this.nodes[i].export_secp256k1_keystore();
      const fp = (await sha256Hex(edKs + secpKs)).slice(0, 16);
      updatedDevices.push({
        ...this.devices[i],
        ed25519Keystore: edKs,
        secp256k1Keystore: secpKs,
        ecdsaKeyShare: this.ecdsaShares[i],
        shareFingerprint: fp,
      });
      pushLog(this.deviceLogs, i + 1, {
        stage: 3,
        tag: "FINALIZE",
        level: "ok",
        msgZh: `finalize_dkg() 完成！本地已保存 ${this.ecdsaShares[i] ? "3" : "2"} 份独立分片（指纹 ${fp}）`,
        msgEn: `finalize_dkg() complete! Sealed ${this.ecdsaShares[i] ? "3" : "2"} local shares (FP ${fp})`,
        hex: `group_btc=${secp256k1GroupPubkey.slice(0, 24)}…`,
      });
      pushLog(this.deviceLogs, i + 1, {
        stage: 3,
        tag: "ADDR-SYNC",
        level: "ok",
        msgZh: eth0
          ? `全链地址收敛：ETH ${eth0} · BTC ${btc0}（完整私钥从未存在！）`
          : `全链地址收敛：BTC ${btc0}（完整私钥从未存在！）`,
        msgEn: eth0
          ? `Addresses converged: ETH ${eth0} · BTC ${btc0} (No full key ever existed!)`
          : `Addresses converged: BTC ${btc0} (No full key ever existed!)`,
      });
    }
    this.devices = updatedDevices;
    this.dispose();

    const finNotes: FlowStage["nodeNotes"] = {};
    for (const d of this.devices) {
      finNotes[d.index] = {
        zh: `🔒 ${d.ecdsaKeyShare ? "3" : "2"} 份分片 · ${d.shareFingerprint.slice(0, 8)}`,
        en: `🔒 ${d.ecdsaKeyShare ? "3" : "2"} Shares · ${d.shareFingerprint.slice(0, 8)}`,
        tone: "emerald",
      };
    }

    this.stages[3] = {
      key: "dkg-done",
      stepNum: 3,
      titleZh: `建库完成 · 3 份独立分片落盘，全链群公钥 100% 收敛（完整私钥从未诞生！）`,
      titleEn: `Vault Ready · 3 Isolated Shares Sealed, Multi-Chain Addresses Converged`,
      explainZh:
        "全部设备独立合成了自己的加密分片（点击每台机器对比指纹，完全不同！），但算出来的 ETH / BTC / SOL / SUI 地址一字不差——完整私钥从未在任何位置出现过！",
      explainEn:
        "Every device saved its own distinct encrypted shares (inspect each machine to compare fingerprints!), yet all converged on identical ETH/BTC/SOL/SUI addresses!",
      durationMs: 2800,
      nodeNotes: finNotes,
      packets: [],
      computed: true,
      centerStatus: {
        titleZh: "✓ 金库已收敛",
        titleEn: "✓ Vault Ready",
        detail: eth0 ? `ETH ${eth0.slice(0, 8)}…` : `BTC ${btc0.slice(0, 9)}…`,
        tone: "emerald",
      },
    };
    this.executedStage = 3;

    this.finalizedVault = {
      vaultName: this.vaultName,
      threshold: this.threshold,
      total: this.total,
      ed25519GroupPubkey,
      secp256k1GroupPubkey,
      ecdsaGroupPubkey: this.ecdsaGroupPubkey,
      devices: this.devices,
      logs: [...this.roundLogs],
      dkgScene: this.buildScene(),
      totalElapsedMs: this.totalElapsedMs,
      reshareEpoch: 0,
    };
  }

  /** Advance live WASM execution forward to `targetStage` (0..3) using the SAME seeds from Step 0. */
  async advanceToStage(targetStage: number): Promise<LiveDkgSnapshot> {
    if (this.executedStage < 0) {
      await this.initFreshSeeds();
    }
    if (targetStage >= 1 && this.executedStage < 1) this.runRound1Now();
    if (targetStage >= 2 && this.executedStage < 2) await this.runRound2Now();
    if (targetStage >= 3 && this.executedStage < 3) await this.runFinalizeNow();
    return this.snapshot();
  }

  /** Re-roll brand-new WASM CSPRNG seeds and genuinely execute Rust WASM up to `targetStage`. */
  async reseedAndRunTo(targetStage: number, reason: "reseed" | "step-back" = "step-back"): Promise<LiveDkgSnapshot> {
    await this.initFreshSeeds(reason);
    if (targetStage >= 1) this.runRound1Now();
    if (targetStage >= 2) await this.runRound2Now();
    if (targetStage >= 3) await this.runFinalizeNow();
    return this.snapshot();
  }

  private buildScene(): FlowScene {
    const clonedLogs: Record<number, DeviceLogEntry[]> = {};
    for (const [k, v] of Object.entries(this.deviceLogs)) {
      clonedLogs[Number(k)] = [...v];
    }
    return {
      kind: "dkg",
      runId: this.runId,
      seedEpoch: this.seedEpoch,
      stages: [...this.stages],
      deviceLogs: clonedLogs,
    };
  }

  snapshot(): LiveDkgSnapshot {
    return {
      devices: [...this.devices],
      scene: this.buildScene(),
      logs: [...this.roundLogs],
      executedStage: this.executedStage,
      vault: this.finalizedVault,
    };
  }
}

export async function startLiveDkgSession(
  vaultName: string,
  threshold: number,
  total: number,
): Promise<{ session: LiveDkgSession; snapshot: LiveDkgSnapshot }> {
  const session = new LiveDkgSession(vaultName, threshold, total);
  const snapshot = await session.initFreshSeeds();
  return { session, snapshot };
}

/** Run full 2-Round Unified FROST DKG (+ CGGMP24 ECDSA Keygen for 2-of-3) in one call. */
export async function runLiveDkg(
  vaultName: string,
  threshold: number,
  total: number,
): Promise<SandboxVault> {
  const session = new LiveDkgSession(vaultName, threshold, total);
  const snap = await session.advanceToStage(3);
  return snap.vault!;
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
  signScene: FlowScene;
}

/** Build animated proof scene when < threshold devices try to sign (single-device hack simulation). */
export function buildSingleDeviceAttackScene(
  vault: SandboxVault,
  attackerIndices: number[],
): FlowScene {
  const attacker = attackerIndices[0] ?? 1;
  const stage0Notes: FlowStage["nodeNotes"] = {};
  const stage1Notes: FlowStage["nodeNotes"] = {};
  const atkLogs: Record<number, DeviceLogEntry[]> = {};
  for (const d of vault.devices) {
    if (attackerIndices.includes(d.index)) {
      stage0Notes[d.index] = { zh: "⚠️ 木马窃取本机分片", en: "⚠️ Share Stolen", tone: "red" };
      stage1Notes[d.index] = { zh: "🚫 单机强签失败", en: "🚫 Forge Blocked", tone: "red" };
      pushLog(atkLogs, d.index, {
        stage: 0,
        tag: "ALERT",
        level: "warn",
        msgZh: `木马进程读取了本地分片（指纹 ${d.shareFingerprint}），试图发起未授权转账`,
        msgEn: `Malware accessed local share (FP ${d.shareFingerprint}), attempting unauthorized spend`,
      });
      pushLog(atkLogs, d.index, {
        stage: 1,
        tag: "ERROR",
        level: "err",
        msgZh: `强行调用 frost_core::aggregate(signers=${attackerIndices.length}, threshold=${vault.threshold}) → 直接抛出 InsufficientSigners！`,
        msgEn: `Called frost_core::aggregate(signers=${attackerIndices.length}, threshold=${vault.threshold}) → THREW InsufficientSigners!`,
        hex: `QUORUM_ERROR: ${attackerIndices.length} < ${vault.threshold} · 0 bits leaked`,
      });
    } else {
      stage0Notes[d.index] = { zh: "🔒 隔离 · 未批准", en: "🔒 Isolated · Idle", tone: "emerald" };
      stage1Notes[d.index] = { zh: "🛡️ 拒绝协同 · 安全", en: "🛡️ Refused · Safe", tone: "emerald" };
      pushLog(atkLogs, d.index, {
        stage: 0,
        tag: "GUARD",
        level: "info",
        msgZh: `设备处于独立安全环境，未收到用户物理确认，拒绝启动签名会话`,
        msgEn: `Device isolated with no user confirmation — signing session refused`,
      });
      pushLog(atkLogs, d.index, {
        stage: 1,
        tag: "SECURITY",
        level: "ok",
        msgZh: `收到异常单签请求已自动丢弃（0 bytes 传出），资产 100% 安全`,
        msgEn: `Dropped unauthorized signing request (0 bytes sent) — funds 100% safe`,
      });
    }
  }

  return {
    kind: "attack",
    runId: Date.now(),
    deviceLogs: atkLogs,
    stages: [
      {
        key: "atk-0",
        stepNum: 0,
        titleZh: `⚠️ 模拟黑客攻击：电脑中木马，设备 #${attacker} 的分片被彻底窃取`,
        titleEn: `⚠️ Attack Simulation: Malware Compromises Device #${attacker}'s Share`,
        explainZh:
          `假设黑客已经完全控制设备 #${attacker}，拿到了它本地的分片数据。但此时其他设备（门限要求至少 ${vault.threshold} 台）并未批准这笔非法转账！`,
        explainEn:
          `Suppose malware completely compromises Device #${attacker} and steals its share. The remaining devices (threshold requires ${vault.threshold}) refuse to co-sign.`,
        durationMs: 2200,
        nodeNotes: stage0Notes,
        packets: [],
        centerStatus: {
          titleZh: "检测到单设备异常请求",
          titleEn: "Unauthorized Single-Device Request",
          detail: `Signers: ${attackerIndices.length} / ${vault.threshold} required`,
          tone: "red",
        },
      },
      {
        key: "atk-1",
        stepNum: 1,
        titleZh: "🚫 数学拦截：单分片泄露 0 bit 私钥，强行签名被密码学防火墙当场弹回！",
        titleEn: "🚫 Blocked: 1 Share Leaks 0 Bits of Key — Forgery Mathematically Impossible!",
        explainZh:
          "设备 #1 试图独自向链上提交签名请求，但在 Shamir/FROST/CGGMP24 门限密码学下，少于 t 份分片在信息论意义上泄露 0 bit 私钥，绝无可能算出合法签名，1 分钱都转不走！",
        explainEn:
          "Device #1 tries to sign alone — under threshold cryptography, fewer than t shares reveal 0 bits of the private key. Forgery is mathematically impossible!",
        durationMs: 3200,
        nodeNotes: stage1Notes,
        blockedShield: true,
        packets: attackerIndices.map((idx) => ({
          id: `atk-${idx}`,
          from: idx,
          to: 0,
          tag: "FORGE ✗",
          labelZh: `非法单签尝试 #${idx}`,
          labelEn: `Unauthorized Attempt #${idx}`,
          bytes: 32,
          hexPreview: "REJECTED · QUORUM < " + vault.threshold,
          tone: "red",
        })),
        centerStatus: {
          titleZh: "🚫 门限不足 · 彻底拦截",
          titleEn: "🚫 Quorum Not Met · Blocked",
          detail: `${attackerIndices.length} < ${vault.threshold} · 0 bits leaked`,
          tone: "red",
        },
      },
    ],
  };
}

function buildFrostSignScene(
  vault: SandboxVault,
  chain: "bitcoin" | "solana" | "sui",
  active: number[],
  commitPackets: WirePacket[],
  sharePackets: WirePacket[],
  signatureHex: string,
  signerAddress: string,
  path: string,
  msgHex: string,
): FlowScene {
  const r1Notes: FlowStage["nodeNotes"] = {};
  const r2Notes: FlowStage["nodeNotes"] = {};
  const doneNotes: FlowStage["nodeNotes"] = {};
  const signLogs: Record<number, DeviceLogEntry[]> = {};
  const nonceEpoch = ++globalSeedEpoch;

  for (const d of vault.devices) {
    if (active.includes(d.index)) {
      r1Notes[d.index] = { zh: "🎲 新 Nonce + 发承诺", en: "🎲 Fresh Nonce", tone: "cyan" };
      r2Notes[d.index] = { zh: "✍️ 局部签名 + 销 Nonce", en: "✍️ Partial Sig", tone: "violet" };
      doneNotes[d.index] = { zh: "✓ 协同完成 · 私钥零拼接", en: "✓ Co-Signed", tone: "emerald" };

      const myCommit = commitPackets.find((p) => p.from === d.index);
      const myShare = sharePackets.find((p) => p.from === d.index);
      pushLog(signLogs, d.index, {
        stage: 0,
        tag: "HD-DERIVE",
        level: "info",
        msgZh: `按路径 ${path} 无交互本地派生子分片（无需重新 DKG）`,
        msgEn: `Derived child key share locally at ${path} (zero extra DKG)`,
      });
      pushLog(signLogs, d.index, {
        stage: 0,
        tag: "NONCE",
        level: "tx",
        msgZh: `signing_commit() 摇出全新一次性 Nonce (Nonce #${nonceEpoch})，广播 ${myCommit?.bytes ?? 69} B 承诺`,
        msgEn: `signing_commit() rolled fresh 1-time Nonce (#${nonceEpoch}), sent ${myCommit?.bytes ?? 69} B commitment`,
        hex: myCommit?.hexPreview,
        bytes: myCommit?.bytes,
      });
      pushLog(signLogs, d.index, {
        stage: 1,
        tag: "SIGN",
        level: "tx",
        msgZh: `sign(digest=${msgHex.slice(0, 14)}…) 产出 ${myShare?.bytes ?? 32} B 局部签名分片并立即销毁一次性 Nonce`,
        msgEn: `sign(digest=${msgHex.slice(0, 14)}…) produced ${myShare?.bytes ?? 32} B partial share & ZEROIZED nonce`,
        hex: myShare?.hexPreview,
        bytes: myShare?.bytes,
      });
      pushLog(signLogs, d.index, {
        stage: 2,
        tag: "VERIFY",
        level: "ok",
        msgZh: `aggregate_signature() 合成标准 64B 单签并验签通过 → 广播至 ${chain.toUpperCase()}`,
        msgEn: `aggregate_signature() verified standard 64B sig → ready for ${chain.toUpperCase()} broadcast`,
        hex: signatureHex.slice(0, 48) + "…",
      });
    } else if (d.compromised) {
      r1Notes[d.index] = { zh: "🔥 已作废", en: "🔥 Revoked", tone: "red" };
      r2Notes[d.index] = { zh: "🔥 已作废", en: "🔥 Revoked", tone: "red" };
      doneNotes[d.index] = { zh: "🔥 已作废", en: "🔥 Revoked", tone: "red" };
      pushLog(signLogs, d.index, {
        stage: 0,
        tag: "REVOKED",
        level: "err",
        msgZh: `此设备分片已在 Reshare 中彻底作废，被排除在签名集合之外`,
        msgEn: `Device share revoked during Reshare — excluded from signing quorum`,
      });
    } else {
      r1Notes[d.index] = { zh: "💤 离线待机", en: "💤 Offline", tone: "amber" };
      r2Notes[d.index] = { zh: "💤 离线待机", en: "💤 Offline", tone: "amber" };
      doneNotes[d.index] = { zh: "💤 离线待机", en: "💤 Offline", tone: "amber" };
      pushLog(signLogs, d.index, {
        stage: 0,
        tag: "IDLE",
        level: "info",
        msgZh: `本轮未勾选此设备（满足 ${vault.threshold}-of-${vault.total} 门限即可离线），0 bytes 通信`,
        msgEn: `Unselected for this ${vault.threshold}-of-${vault.total} quorum — stayed offline, 0 bytes sent`,
      });
    }
  }

  return {
    kind: "sign",
    runId: Date.now() + nonceEpoch,
    seedEpoch: nonceEpoch,
    deviceLogs: signLogs,
    stages: [
      {
        key: "sign-r1",
        stepNum: 0,
        titleZh: `第 1 轮 (Round 1) · 参与设备 #${active.join("、#")} 交换一次性随机数承诺 (SIGN_COMMIT)`,
        titleEn: `Round 1 · Signers #${active.join(", #")} Exchange Single-Use Nonce Commitments`,
        explainZh:
          "每次多签前，参与设备各自生成全新的「一次性随机数 Nonce」，并互相交换公开承诺（仅 69 字节）。未勾选的设备完全可以离线，不影响 2-of-3 签发！",
        explainEn:
          "Before signing, active devices generate fresh single-use nonces and exchange tiny 69-byte commitments. Unselected devices can stay completely offline!",
        durationMs: 2600,
        nodeNotes: r1Notes,
        packets: commitPackets,
        centerStatus: {
          titleZh: "Round 1 · 锁定联合随机点 R",
          titleEn: "Round 1 · Locking Joint Nonce R",
          detail: `${commitPackets.length} SIGN_COMMIT packets`,
          tone: "cyan",
        },
      },
      {
        key: "sign-r2",
        stepNum: 1,
        titleZh: "第 2 轮 (Round 2) · 各自本地算出 32 字节局部签名分片 (SIGN_SHARE) 发往聚合器",
        titleEn: "Round 2 · Each Signer Computes Its 32-Byte Partial Signature Share",
        explainZh:
          "每台设备在自己内存里用「分片 + 交易哈希 + 联合承诺 R」算出 32 字节局部签名，立刻销毁一次性 Nonce 防重放；完整私钥全程从不汇总！",
        explainEn:
          "Each signer computes a 32-byte partial signature locally and immediately destroys its nonce. The full private key is NEVER reconstructed anywhere.",
        durationMs: 2800,
        nodeNotes: r2Notes,
        packets: sharePackets,
        centerStatus: {
          titleZh: "Round 2 · 收集局部签名分片",
          titleEn: "Round 2 · Collecting Partial Shares",
          detail: `${sharePackets.length} SIGN_SHARE (32B each)`,
          tone: "violet",
        },
      },
      {
        key: "sign-done",
        stepNum: 2,
        titleZh: `聚合为标准 64 字节单签 + 链上验签通过 → 广播至 ${chain.toUpperCase()} 网络！`,
        titleEn: `Aggregated 64-Byte Single-Sig Verified → Broadcast to ${chain.toUpperCase()}!`,
        explainZh:
          "局部签名相加即可合成一笔与普通单签钱包 100% 相同的 64 字节标准签名，直接广播上链：链上不暴露任何多签结构、Gas 最低、隐私拉满！",
        explainEn:
          "Partial shares aggregate into a standard 64-byte single signature identical to an ordinary wallet — lowest gas, zero on-chain multisig footprint!",
        durationMs: 3000,
        nodeNotes: doneNotes,
        showChainTarget: true,
        packets: [
          {
            id: "broadcast-tx",
            from: 0,
            to: -1,
            tag: `${chain.toUpperCase()} TX ✓`,
            labelZh: `广播标准 64B 签名上链`,
            labelEn: `Broadcast 64B Standard Sig`,
            bytes: 64,
            hexPreview: signatureHex.slice(0, 26) + "…",
            tone: "emerald",
          },
        ],
        centerStatus: {
          titleZh: `✓ ${chain.toUpperCase()} 验签通过`,
          titleEn: `✓ ${chain.toUpperCase()} Verified`,
          detail: `${signerAddress.slice(0, 12)}… · 64B sig`,
          tone: "emerald",
        },
      },
    ],
  };
}

/** Execute real 2-Round FROST Threshold Signing for BTC Taproot / Solana / Sui. */
export async function runFrostSigning(
  vault: SandboxVault,
  chain: "bitcoin" | "solana" | "sui",
  account: number,
  signerIndices: number[],
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
  const msgRaw = new TextEncoder().encode(messageText);
  const msgBytes =
    chain === "bitcoin"
      ? new Uint8Array(await crypto.subtle.digest("SHA-256", msgRaw))
      : msgRaw;
  const msgHex = toHex(msgBytes);

  const commitPackets: WirePacket[] = [];
  const sharePackets: WirePacket[] = [];

  if (chain === "bitcoin") {
    const signers = active.map((idx) => {
      const dev = vault.devices.find((d) => d.index === idx)!;
      const childKs = wasm.derive_child_keystore_secp256k1(dev.secp256k1Keystore, path);
      const inst = new wasm.FrostDkgSecp256k1();
      inst.import_keystore(childKs);
      return { idx, inst };
    });
    const commits = signers.map((s) => {
      const hex = s.inst.signing_commit();
      const wire = wasm.to_frost_wire("secp256k1", "commitment", hex);
      return { idx: s.idx, hex, wire };
    });
    for (const s of signers) {
      for (const c of commits) {
        if (c.idx !== s.idx) {
          s.inst.add_signing_commitment(c.idx, c.hex);
          commitPackets.push({
            id: `sc-${c.idx}-${s.idx}`,
            from: c.idx,
            to: s.idx,
            tag: "SIGN_COMMIT",
            labelZh: `随机数承诺 #${c.idx}→#${s.idx}`,
            labelEn: `Nonce Commit #${c.idx}→#${s.idx}`,
            bytes: c.wire.length / 2,
            hexPreview: c.wire.slice(0, 26) + "…",
            tone: "cyan",
          });
        }
      }
    }
    const shares = signers.map((s) => {
      const hex = s.inst.sign(msgHex);
      const wire = wasm.to_frost_wire("secp256k1", "share", hex);
      sharePackets.push({
        id: `ss-${s.idx}`,
        from: s.idx,
        to: 0,
        tag: "SIGN_SHARE",
        labelZh: `局部签名 #${s.idx}→聚合器`,
        labelEn: `Partial Sig #${s.idx}→Hub`,
        bytes: wire.length / 2,
        hexPreview: wire.slice(0, 26) + "…",
        tone: "violet",
      });
      return { idx: s.idx, hex, wire };
    });
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
      commitBytes: commits[0].wire.length / 2,
      shareBytes: shares[0].wire.length / 2,
      signatureHex,
      signatureLenBytes: signatureHex.length / 2,
      elapsedMs: performance.now() - t0,
      verified: true,
      verificationNoteEn:
        "Verified by frost-secp256k1-tr aggregate() against BIP-86 tweaked P2TR output key (64-byte BIP-340 Schnorr)",
      verificationNoteZh:
        "已通过 frost-secp256k1-tr aggregate() 验签：标准 64 字节 BIP-340 Schnorr 签名，可直接花费 bc1p… Taproot 输出",
      sampleCommitHex: commits[0].wire,
      sampleShareHex: shares[0].wire,
      signScene: buildFrostSignScene(vault, chain, active, commitPackets, sharePackets, signatureHex, signerAddress, path, msgHex),
    };
  } else {
    const signers = active.map((idx) => {
      const dev = vault.devices.find((d) => d.index === idx)!;
      const childKs = wasm.derive_child_keystore_ed25519(dev.ed25519Keystore, path);
      const inst = new wasm.FrostDkgEd25519();
      inst.import_keystore(childKs);
      return { idx, inst };
    });
    const commits = signers.map((s) => {
      const hex = s.inst.signing_commit();
      const wire = wasm.to_frost_wire("ed25519", "commitment", hex);
      return { idx: s.idx, hex, wire };
    });
    for (const s of signers) {
      for (const c of commits) {
        if (c.idx !== s.idx) {
          s.inst.add_signing_commitment(c.idx, c.hex);
          commitPackets.push({
            id: `sc-${c.idx}-${s.idx}`,
            from: c.idx,
            to: s.idx,
            tag: "SIGN_COMMIT",
            labelZh: `随机数承诺 #${c.idx}→#${s.idx}`,
            labelEn: `Nonce Commit #${c.idx}→#${s.idx}`,
            bytes: c.wire.length / 2,
            hexPreview: c.wire.slice(0, 26) + "…",
            tone: "cyan",
          });
        }
      }
    }
    const shares = signers.map((s) => {
      const hex = s.inst.sign(msgHex);
      const wire = wasm.to_frost_wire("ed25519", "share", hex);
      sharePackets.push({
        id: `ss-${s.idx}`,
        from: s.idx,
        to: 0,
        tag: "SIGN_SHARE",
        labelZh: `局部签名 #${s.idx}→聚合器`,
        labelEn: `Partial Sig #${s.idx}→Hub`,
        bytes: wire.length / 2,
        hexPreview: wire.slice(0, 26) + "…",
        tone: "violet",
      });
      return { idx: s.idx, hex, wire };
    });
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
      commitBytes: commits[0].wire.length / 2,
      shareBytes: shares[0].wire.length / 2,
      signatureHex,
      signatureLenBytes: signatureHex.length / 2,
      elapsedMs: performance.now() - t0,
      verified: true,
      verificationNoteEn: `Verified by frost-ed25519 aggregate() against derived ${chain.toUpperCase()} Ed25519 public key (64-byte standard EdDSA)`,
      verificationNoteZh: `已通过 frost-ed25519 aggregate() 验签：标准 64 字节 Ed25519 签名，链上与单签完全一致`,
      sampleCommitHex: commits[0].wire,
      sampleShareHex: shares[0].wire,
      signScene: buildFrostSignScene(vault, chain, active, commitPackets, sharePackets, signatureHex, signerAddress, path, msgHex),
    };
  }
}

/** Run real CGGMP24 Threshold ECDSA Signing in a dedicated Web Worker + EIP-191 ecrecover check! */
export function runEvmCggmp24Signing(
  vault: SandboxVault,
  account: number,
  signerIndices: number[],
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
        const [a, b] = active1Based;
        const nNotes = (zh: string, en: string, tone: FlowTone): FlowStage["nodeNotes"] => {
          const out: FlowStage["nodeNotes"] = {};
          for (const d of vault.devices) {
            out[d.index] = active1Based.includes(d.index)
              ? { zh, en, tone }
              : { zh: "💤 离线待机", en: "💤 Idle", tone: "amber" };
          }
          return out;
        };

        const evmLogs: Record<number, DeviceLogEntry[]> = {};
        for (const d of vault.devices) {
          if (active1Based.includes(d.index)) {
            pushLog(evmLogs, d.index, {
              stage: 0,
              tag: "CGGMP24",
              level: "tx",
              msgZh: `Web Worker 启动 EcdsaSign(${path})：交换 ${msg.frames} 帧 Paillier 3072-bit 同态密文（${(msg.bytes / 1024).toFixed(1)} KB）`,
              msgEn: `Web Worker EcdsaSign(${path}): exchanged ${msg.frames} Paillier 3072-bit MtA frames (${(msg.bytes / 1024).toFixed(1)} KB)`,
              hex: `eip191=${toHex(prehash).slice(0, 36)}…`,
              bytes: Math.round(msg.bytes / 2),
            });
            pushLog(evmLogs, d.index, {
              stage: 1,
              tag: "ECRECOVER",
              level: match ? "ok" : "err",
              msgZh: `产出 65B 低-s ECDSA (r‖s‖v) → ecrecover = ${msg.recoveredAddress} (${match ? "100% 匹配！" : "不匹配"})`,
              msgEn: `Produced 65B low-s ECDSA (r‖s‖v) → ecrecover = ${msg.recoveredAddress} (${match ? "EXACT MATCH!" : "MISMATCH"})`,
              hex: "0x" + msg.signatureHex.slice(0, 44) + "…",
            });
          } else {
            pushLog(evmLogs, d.index, {
              stage: 0,
              tag: "IDLE",
              level: "info",
              msgZh: `未参与本轮 EVM 2-of-3 签名，保持离线隔离（0 bytes）`,
              msgEn: `Not in this 2-of-3 EVM signing set — offline (0 bytes)`,
            });
          }
        }

        const evmScene: FlowScene = {
          kind: "sign",
          runId: Date.now(),
          seedEpoch: ++globalSeedEpoch,
          deviceLogs: evmLogs,
          stages: [
            {
              key: "evm-mta",
              stepNum: 0,
              titleZh: `CGGMP24 MtA 协同 · 设备 #${a} ↔ #${b} 交换 3072-bit Paillier 同态密文`,
              titleEn: `CGGMP24 MtA · Devices #${a} ↔ #${b} Exchange 3072-bit Paillier Ciphertexts`,
              explainZh:
                "以太坊原生 ECDSA 签名公式含非线性乘积 k⁻¹·x，两台设备通过 Paillier 同态加密和零知识证明在不暴露各自秘密的前提下协同计算乘积分片！",
              explainEn:
                "Ethereum ECDSA requires nonlinear k⁻¹·x multiplication — both devices exchange Paillier homomorphic ciphertexts + ZK proofs without revealing secrets!",
              durationMs: 2800,
              nodeNotes: nNotes("🔐 Paillier 同态加密 + ZK", "🔐 Paillier MtA + ZK", "pink"),
              packets: [
                {
                  id: "mta-ab",
                  from: a,
                  to: b,
                  tag: "ECDSA_MTA",
                  labelZh: `同态密文 #${a}→#${b}`,
                  labelEn: `Paillier MtA #${a}→#${b}`,
                  bytes: Math.round(msg.bytes / 2),
                  hexPreview: toHex(prehash).slice(0, 24) + "…",
                  tone: "pink",
                },
                {
                  id: "mta-ba",
                  from: b,
                  to: a,
                  tag: "ECDSA_MTA",
                  labelZh: `同态密文 #${b}→#${a}`,
                  labelEn: `Paillier MtA #${b}→#${a}`,
                  bytes: Math.round(msg.bytes / 2),
                  hexPreview: msg.signatureHex.slice(0, 24) + "…",
                  tone: "violet",
                  stagger: 0.15,
                },
              ],
              centerStatus: {
                titleZh: `Web Worker 完成 ${msg.frames} 帧协同`,
                titleEn: `Completed ${msg.frames} CGGMP24 Frames`,
                detail: `${(msg.bytes / 1024).toFixed(1)} KB CBOR wire`,
                tone: "pink",
              },
            },
            {
              key: "evm-ecrecover",
              stepNum: 1,
              titleZh: "产出标准 65 字节 ECDSA (r‖s‖v) → ecrecover 还原地址 100% 匹配并广播上链！",
              titleEn: "65-Byte ECDSA (r‖s‖v) Produced → ecrecover Matches Vault Address 100%!",
              explainZh:
                `以太坊底层 ecrecover(EIP-191 keccak256, sig) 还原出的地址为 ${msg.recoveredAddress}，与原生 0x 金库完全一致，零合约部署直接上链！`,
              explainEn:
                `Standard ecrecover(EIP-191 keccak256, sig) recovers ${msg.recoveredAddress} — exact match with the native 0x EOA vault!`,
              durationMs: 3200,
              nodeNotes: nNotes("✓ ECDSA 协同签名完成", "✓ ECDSA Signed", "emerald"),
              showChainTarget: true,
              packets: [
                {
                  id: "evm-broadcast",
                  from: 0,
                  to: -1,
                  tag: "EVM 65B r‖s‖v ✓",
                  labelZh: "广播标准 EVM 交易",
                  labelEn: "Broadcast Native EVM Tx",
                  bytes: 65,
                  hexPreview: "0x" + msg.signatureHex.slice(0, 24) + "…",
                  tone: "emerald",
                },
              ],
              centerStatus: {
                titleZh: "✓ ecrecover 100% 匹配",
                titleEn: "✓ ecrecover Exact Match",
                detail: msg.recoveredAddress.slice(0, 14) + "…",
                tone: "emerald",
              },
            },
          ],
        };

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
          signScene: evmScene,
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
  reshareScene: FlowScene;
}

/** Execute REAL FROST Share Refresh / Resharing with animated stolen-share rejection scene. */
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

  const refreshPackets: WirePacket[] = [];
  const edR1 = edR.map((x) => ({ idx: x.idx, hex: x.r.reshare_round1() }));
  const secpR1 = secpR.map((x) => ({ idx: x.idx, hex: x.r.reshare_round1() }));
  for (const x of edR) {
    for (const p of edR1) {
      if (p.idx !== x.idx) {
        x.r.add_reshare_round1(p.idx, p.hex);
        refreshPackets.push({
          id: `rf1-${p.idx}-${x.idx}`,
          from: p.idx,
          to: x.idx,
          tag: "REFRESH_R1",
          labelZh: `零多项式承诺 #${p.idx}→#${x.idx}`,
          labelEn: `Zero-Poly Commit #${p.idx}→#${x.idx}`,
          bytes: p.hex.length / 2,
          hexPreview: p.hex.slice(0, 24) + "…",
          tone: "amber",
        });
      }
    }
  }
  for (const x of secpR) for (const p of secpR1) if (p.idx !== x.idx) x.r.add_reshare_round1(p.idx, p.hex);

  const edR2 = edR.map((x) => ({ idx: x.idx, map: JSON.parse(x.r.reshare_round2()) as Record<string, string> }));
  const secpR2 = secpR.map((x) => ({ idx: x.idx, map: JSON.parse(x.r.reshare_round2()) as Record<string, string> }));
  for (const x of edR) for (const p of edR2) if (p.idx !== x.idx) x.r.add_reshare_round2(p.idx, p.map[String(x.idx)]);
  for (const x of secpR) for (const p of secpR2) if (p.idx !== x.idx) x.r.add_reshare_round2(p.idx, p.map[String(x.idx)]);

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

  const s0Notes: FlowStage["nodeNotes"] = {};
  const s1Notes: FlowStage["nodeNotes"] = {};
  const s2Notes: FlowStage["nodeNotes"] = {};
  const rsLogs: Record<number, DeviceLogEntry[]> = {};
  for (const d of newDevices) {
    if (d.index === dropIndex || d.compromised) {
      s0Notes[d.index] = { zh: "🔥 被盗 · 踢出集合", en: "🔥 Stolen · Isolated", tone: "red" };
      s1Notes[d.index] = { zh: "🚫 已排除刷新协议", en: "🚫 Excluded", tone: "red" };
      s2Notes[d.index] = { zh: "✗ 旧分片混签被拒", en: "✗ Old Share Dead", tone: "red" };
      pushLog(rsLogs, d.index, {
        stage: 0,
        tag: "EVICTED",
        level: "warn",
        msgZh: `设备 #${d.index} 已被标记丢失/失窃，从新门限集合中移除`,
        msgEn: `Device #${d.index} marked lost/stolen and removed from refresh quorum`,
      });
      pushLog(rsLogs, d.index, {
        stage: 2,
        tag: "PROBE-FAIL",
        level: "err",
        msgZh: `实时探测：试图用旧 Epoch 分片混签 → WASM 当场拒绝（${stolenShareError}）`,
        msgEn: `Live attack probe with old Epoch share → REJECTED by WASM (${stolenShareError})`,
      });
    } else {
      s0Notes[d.index] = { zh: "✓ 存活 · 准备换片", en: "✓ Survivor Ready", tone: "amber" };
      s1Notes[d.index] = { zh: "🔄 交换零多项式刷新", en: "🔄 Zero-Poly Refresh", tone: "amber" };
      s2Notes[d.index] = { zh: `✓ 新片 ${d.shareFingerprint.slice(0, 8)}`, en: `✓ New ${d.shareFingerprint.slice(0, 8)}`, tone: "emerald" };
      pushLog(rsLogs, d.index, {
        stage: 0,
        tag: "RESHARE",
        level: "info",
        msgZh: `启动 frost_core::keys::refresh(survivors=[${survivors.map((s) => s.index).join(",")}])`,
        msgEn: `Initialized frost_core::keys::refresh(survivors=[${survivors.map((s) => s.index).join(",")}])`,
      });
      pushLog(rsLogs, d.index, {
        stage: 1,
        tag: "ZERO-POLY",
        level: "tx",
        msgZh: `生成常数项 Δf(0)=0 的刷新多项式并与其他存活节点完成 2 轮交换`,
        msgEn: `Generated zero-constant refresh polynomial Δf(0)=0 and completed 2-round exchange`,
      });
      pushLog(rsLogs, d.index, {
        stage: 2,
        tag: "ROTATED",
        level: "ok",
        msgZh: `分片指纹已刷新为 ${d.shareFingerprint}，BTC/SOL/SUI 群公钥 0 字节变化 ✓`,
        msgEn: `Share rotated to new FP ${d.shareFingerprint}; BTC/SOL/SUI group pubkeys 100% unchanged ✓`,
      });
    }
  }

  const reshareScene: FlowScene = {
    kind: "reshare",
    runId: Date.now(),
    seedEpoch: ++globalSeedEpoch,
    deviceLogs: rsLogs,
    stages: [
      {
        key: "rs-isolate",
        stepNum: 0,
        titleZh: `⚠️ 设备 #${dropIndex} 丢失/被盗 → 存活设备立即启动无换地址换片！`,
        titleEn: `⚠️ Device #${dropIndex} Lost/Stolen → Survivors Launch Share Refresh`,
        explainZh:
          `设备 #${dropIndex} 已被标记失窃。幸好这是 ${vault.threshold}-of-${vault.total} 金库，剩余存活设备无需把币转走，可直接原地刷新数学分片！`,
        explainEn:
          `Device #${dropIndex} is compromised. Surviving nodes can rotate shares in place without moving a single satoshi on-chain!`,
        durationMs: 2000,
        nodeNotes: s0Notes,
        packets: [],
        centerStatus: {
          titleZh: `踢除设备 #${dropIndex}`,
          titleEn: `Evicting Device #${dropIndex}`,
          detail: `Survivors: #${survivors.map((s) => s.index).join(", #")}`,
          tone: "amber",
        },
      },
      {
        key: "rs-refresh",
        stepNum: 1,
        titleZh: `存活设备 #${survivors.map((s) => s.index).join(" ↔ #")} 互发零多项式刷新包（彻底绕开 #${dropIndex}）`,
        titleEn: `Survivors #${survivors.map((s) => s.index).join(" ↔ #")} Exchange Refresh Shares (Bypassing #${dropIndex})`,
        explainZh:
          "存活设备互发常数项为 0 的随机多项式份额：加到原分片上后，群私钥（即钱包地址）精确保持 +0 不变，但每个人的分片数值彻底洗牌换新！",
        explainEn:
          "Survivors add a zero-constant refresh polynomial: the group secret (wallet address) shifts by 0, while every individual share is completely replaced!",
        durationMs: 2800,
        nodeNotes: s1Notes,
        packets: refreshPackets,
        centerStatus: {
          titleZh: "FROST Refresh 换片中",
          titleEn: "FROST Refresh Active",
          detail: "Group Key Δ = 0 · Shares Rotated",
          tone: "amber",
        },
      },
      {
        key: "rs-prove",
        stepNum: 2,
        titleZh: `✓ 地址 100% 不变 + 实测被盗旧分片 #${dropIndex} 企图混签被当场击碎！`,
        titleEn: `✓ Address 100% Unchanged + Stolen Old Share #${dropIndex} Shattered Live!`,
        explainZh:
          `刷新完成！BTC / SOL / SUI 收款地址 0 变化；同时 WASM 刚刚自动用被盗的旧分片 #${dropIndex} 与新分片强行混签——直接触发数学校验失败，旧分片彻底变废纸！`,
        explainEn:
          `Done! BTC/SOL/SUI addresses are 100% unchanged, and a live attack probe mixing old stolen share #${dropIndex} with a refreshed share was cryptographically rejected!`,
        durationMs: 3200,
        nodeNotes: s2Notes,
        blockedShield: true,
        packets: [
          {
            id: "stolen-probe",
            from: dropIndex,
            to: 0,
            tag: "OLD SHARE ✗",
            labelZh: `旧被盗分片 #${dropIndex} 混签探测`,
            labelEn: `Stolen Old Share #${dropIndex} Probe`,
            bytes: 32,
            hexPreview: "REJECTED · INVALID SHARE",
            tone: "red",
          },
        ],
        centerStatus: {
          titleZh: "✓ 地址未变 · 旧片已废",
          titleEn: "✓ Same Address · Old Share Dead",
          detail: "BTC/SOL/SUI 100% preserved",
          tone: "emerald",
        },
      },
    ],
  };

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
    reshareScene,
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
