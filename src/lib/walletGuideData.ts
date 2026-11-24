import type { Callout } from '../components/AnnotatedScreenshot.svelte';

export interface GuideShot {
  id: string;
  src: string;
  alt: string;
  device: 'desktop' | 'extension' | 'tui' | 'cli';
  stepTag: string;
  titleEn: string;
  titleZh: string;
  summaryEn: string;
  summaryZh: string;
  callouts: Callout[];
  /** Optional span class for desktop grids: 'wide' spans full width */
  layout?: 'wide' | 'normal';
}

export const chainFamilies = [
  {
    badge: 'SECP256K1 · CGGMP24 ECDSA',
    accentClass: 'text-indigo-300 border-indigo-400/30 bg-indigo-500/10',
    titleEn: 'All EVM Networks (100+ Chains, 1 Address)',
    titleZh: '全 EVM 生态（100+ 条链共用同一金库地址）',
    descEn:
      'Built-in Ethereum, Arbitrum, Optimism, Base, Polygon, BNB Chain, Avalanche C-Chain + testnets, and add ANY custom EVM RPC (zkSync, Linea, Scroll, Blast, Mantle, Gnosis, Sonic, Berachain…).',
    descZh:
      '原生内置 Ethereum、Arbitrum、Optimism、Base、Polygon、BNB Chain、Avalanche 等主流网络及测试网，并支持自定义添加任意 EVM RPC（zkSync、Linea、Scroll、Blast、Mantle、Gnosis、Berachain 等全部直接通用）。',
    pills: ['Ethereum', 'Arbitrum', 'Optimism', 'Base', 'Polygon', 'BNB Chain', 'Avalanche', 'zkSync', 'Linea', 'Scroll', '+ Any Custom EVM RPC'],
  },
  {
    badge: 'SECP256K1 · BIP-340 TAPROOT FROST',
    accentClass: 'text-amber-300 border-amber-400/30 bg-amber-500/10',
    titleEn: 'Bitcoin Native Taproot (P2TR bc1p…)',
    titleZh: '比特币原生 Taproot（bc1p… 最低矿工费）',
    descEn:
      'BIP-86 hierarchical derivation with threshold BIP-340 Schnorr signatures. On-chain transactions look identical to single-key Taproot spends — zero multisig script bloat.',
    descZh:
      '采用标准 BIP-86 派生路径与 BIP-340 Schnorr 门限签名；链上呈现为普通单签 Taproot 交易，不暴露多签脚本，矿工费最低、隐私性拉满。',
    pills: ['Bitcoin Mainnet (bc1p…)', 'BIP-86 HD Accounts', 'BIP-340 Schnorr', 'Single-Sig Fee Footprint'],
  },
  {
    badge: 'ED25519 · FROST SCHNORR',
    accentClass: 'text-teal-300 border-teal-400/30 bg-teal-500/10',
    titleEn: 'Solana, Sui, Aptos & Ed25519 Ecosystem',
    titleZh: 'Solana、Sui、Aptos 与 Ed25519 高性能链生态',
    descEn:
      'Native Ed25519 threshold signing powers Solana, Sui, and Aptos out of the box — the exact same elliptic curve Ledger uses across high-throughput Ed25519 chains (TON, NEAR, Stellar, Polkadot).',
    descZh:
      '原生支持 Solana、Sui、Aptos 门限签名；底层采用与 Ledger 相同的 Ed25519 椭圆曲线体系，覆盖主流高性能公链生态并支持统一 HD 多账户派生。',
    pills: ['Solana', 'Sui', 'Aptos', 'Ed25519 Curve (TON / NEAR / Stellar)'],
  },
  {
    badge: 'HARDWARE + WATCH-ONLY',
    accentClass: 'text-violet-300 border-violet-400/30 bg-violet-500/10',
    titleEn: 'Direct Ledger WebHID + YubiKey + Watch-Only',
    titleZh: '原生兼容 Ledger 硬件钱包、YubiKey 与观察账户',
    descEn:
      'Already own a Ledger? Plug it in via WebHID inside Starlab Extension to manage your Ledger accounts alongside your MPC vaults, plus YubiKey hardware unlock and watch-only simulation.',
    descZh:
      '手里已经有 Ledger？插件内置 WebHID 支持直接连接 Ledger 账户与 MPC 金库同屏管理；同时支持 YubiKey 硬件解锁与任意地址的只读观察/沙箱模拟账户。',
    pills: ['Ledger WebHID Signer', 'YubiKey Unlock', 'Watch-Only Sandbox', 'Air-Gap SD Card Mode'],
  },
];

// ============================================================================
// 1. CHROME EXTENSION (starlab-wallet) — 15 REAL ANNOTATED SCREENSHOTS
// ============================================================================
export const extensionShots: GuideShot[] = [
  {
    id: 'ext-01',
    src: '/wallet-guide/ext-welcome.webp',
    alt: 'Starlab Chrome Extension Welcome Screen',
    device: 'extension',
    stepTag: 'EXT 01 · 初始化',
    titleEn: '01 · First Launch — Welcome to MPC Wallet',
    titleZh: '01 · 首次启动：无单点风险的 MPC 钱包欢迎页',
    summaryEn: 'Install the Chrome Extension and click “Get started” to choose your device protection method.',
    summaryZh: '安装 Chrome 插件后首次打开即进入欢迎页，明确告知私钥分片存储在多台设备，点击「Get started」开始。',
    callouts: [
      {
        id: 1, x: 11, y: 47, w: 78, h: 25, anchor: 'tl', tone: 'violet',
        labelEn: 'Zero Single-Device Custody', labelZh: '无单点控制声明',
        detailEn: 'Keys are split across devices — no single device can sign alone.',
        detailZh: '私钥拆分为多份加密分片，单台浏览器被攻破也无法盗币。',
      },
      {
        id: 2, x: 6, y: 74, w: 88, h: 12, anchor: 'tl', tone: 'accent',
        labelEn: 'Click “Get started”', labelZh: '点击「Get started」进入解锁配置',
      },
    ],
  },
  {
    id: 'ext-02',
    src: '/wallet-guide/ext-unlock-setup.webp',
    alt: 'Protect this device with YubiKey or Password',
    device: 'extension',
    stepTag: 'EXT 02 · 解锁方式',
    titleEn: '02 · Protect This Device — YubiKey (Recommended) or Password',
    titleZh: '02 · 保护当前设备：选择 YubiKey 硬件解锁或密码解锁',
    summaryEn: 'Bind a FIDO2 YubiKey for passwordless hardware encryption, or switch to the Password tab.',
    summaryZh: '推荐使用支持 FIDO2 的 YubiKey 实现免密硬件级加密；如果没有 YubiKey，点击右侧「Password」使用强密码。',
    callouts: [
      {
        id: 1, x: 8, y: 29, w: 42, h: 12, anchor: 'tl', tone: 'neon',
        labelEn: 'YubiKey Hardware Unlock', labelZh: 'YubiKey 硬件级免密保护（推荐）',
      },
      {
        id: 2, x: 51, y: 29, w: 41, h: 12, anchor: 'tr', tone: 'violet',
        labelEn: 'Switch to Local Password', labelZh: '切换为本地强密码保护',
      },
    ],
  },
  {
    id: 'ext-03',
    src: '/wallet-guide/ext-password-form.webp',
    alt: 'Local Password Creation Form',
    device: 'extension',
    stepTag: 'EXT 03 · 设密码',
    titleEn: '03 · Set Independent Browser Share Password',
    titleZh: '03 · 设置浏览器端独立的本地加密密码',
    summaryEn: 'Set an 8+ character password to encrypt this browser’s share locally (use a different password from Desktop!).',
    summaryZh: '输入 8 位以上强密码并确认，仅用于加密当前浏览器本地的分片（建议与桌面端使用不同密码以隔离风险）。',
    callouts: [
      {
        id: 1, x: 8, y: 45, w: 84, h: 28, anchor: 'tl', tone: 'violet',
        labelEn: 'Password + Confirm Fields', labelZh: '本地加密口令（不上传服务器）',
      },
      {
        id: 2, x: 8, y: 74, w: 62, h: 9, anchor: 'tl', tone: 'accent',
        labelEn: 'Click “Continue”', labelZh: '点击「Continue」保存解锁方式',
      },
    ],
  },
  {
    id: 'ext-04',
    src: '/wallet-guide/ext-onboarding.webp',
    alt: 'Create shared wallet or Join a shared wallet',
    device: 'extension',
    stepTag: 'EXT 04 · 建库/加入',
    titleEn: '04 · Choose: Create Shared Wallet or Join Existing Invite',
    titleZh: '04 · 选择创建全新共享钱包，或加入其他设备的邀请',
    summaryEn: 'Pick “Create shared wallet” to act as DKG initiator, or “Join a shared wallet” if Desktop started it.',
    summaryZh: '由当前插件发起建库选「Create shared wallet」；若桌面端先建库则选「Join a shared wallet」，然后点右下角「Continue」。',
    callouts: [
      {
        id: 1, x: 6, y: 39, w: 88, h: 19, anchor: 'tl', tone: 'neon',
        labelEn: 'Create Shared Wallet (Initiator)', labelZh: '发起新 MPC 钱包（DKG 发起方）',
      },
      {
        id: 2, x: 6, y: 59, w: 88, h: 17, anchor: 'tl', tone: 'violet',
        labelEn: 'Join Shared Wallet (Co-Signer)', labelZh: '输入邀请加入已有建库流程',
      },
    ],
  },
  {
    id: 'ext-05',
    src: '/wallet-guide/ext-hardware-options.webp',
    alt: 'More account options: Ledger WebHID, YubiKey, Simulation address',
    device: 'extension',
    stepTag: 'EXT 05 · 硬件兼容',
    titleEn: '05 · More Account Options — Ledger WebHID, YubiKey & Watch-Only',
    titleZh: '05 · 展开更多账户：直连 Ledger 硬件、YubiKey 与沙箱观察账户',
    summaryEn: 'Click “More account options” to connect a physical Ledger over WebHID, YubiKey accounts, or any watch-only address.',
    summaryZh: '点击「More account options」即可看到：原生通过 WebHID 直连 Ledger、接入 YubiKey 账户，或添加任意只读模拟地址。',
    callouts: [
      {
        id: 1, x: 6, y: 61, w: 88, h: 12, anchor: 'tl', tone: 'neon',
        labelEn: 'Connect Physical Ledger via WebHID', labelZh: 'WebHID 直连 Ledger 硬件钱包',
      },
      {
        id: 2, x: 6, y: 74, w: 88, h: 24, anchor: 'tl', tone: 'violet',
        labelEn: 'YubiKey & Sandbox Watch-Only', labelZh: 'YubiKey 账户与沙箱只读模拟地址',
      },
    ],
  },
  {
    id: 'ext-06',
    src: '/wallet-guide/ext-room-setup.webp',
    alt: 'Signal Server Room ID Setup',
    device: 'extension',
    stepTag: 'EXT 06 · 房间号',
    titleEn: '06 · Set Shared Pairing Room ID (16+ chars)',
    titleZh: '06 · 设置设备配对房间号（Room ID，至少 16 位）',
    summaryEn: 'All co-signing devices must enter the exact same Room ID so they find each other on the signal server.',
    summaryZh: '点击「Generate」生成高强度随机房间号（或手动输入），并复制填进桌面端/TUI 的 Room ID 中，点「Save room & continue」。',
    callouts: [
      {
        id: 1, x: 6, y: 55, w: 56, h: 12, anchor: 'tl', tone: 'neon',
        labelEn: 'Shared Tenant Room ID', labelZh: '多设备共用的加密配对暗号',
      },
      {
        id: 2, x: 51, y: 71, w: 43, h: 11, anchor: 'tr', tone: 'accent',
        labelEn: 'Save Room & Continue', labelZh: '保存房间号并进入门限配置',
      },
    ],
  },
  {
    id: 'ext-07',
    src: '/wallet-guide/ext-configure.webp',
    alt: 'Configure 2-of-2 Multi-Chain MPC Wallet in Extension',
    device: 'extension',
    stepTag: 'EXT 07 · 门限配置',
    titleEn: '07 · Setup 1 of 3 — Configure Name & Threshold (2-of-2 / 2-of-3)',
    titleZh: '07 · 建库第 1/3 步：设置金库名称与 t-of-n 门限策略',
    summaryEn: 'One DKG automatically creates all curve keys (All EVM + Bitcoin Taproot + Solana + Sui). Set Total devices (n) and Needed to sign (t).',
    summaryZh: '一次创建覆盖全曲线生态！设置金库名称（如 Treasury）、总设备数（Total devices）和每次签名所需设备数（Needed to sign）。',
    callouts: [
      {
        id: 1, x: 6, y: 31, w: 82, h: 6.5, anchor: 'tl', tone: 'neon',
        labelEn: 'Multi-Curve Keys Generated Automatically', labelZh: '全曲线自动同步生成',
      },
      {
        id: 2, x: 5, y: 56, w: 90, h: 11, anchor: 'tr', tone: 'accent',
        labelEn: 'Threshold Policy (e.g. 2-of-2 / 2-of-3)', labelZh: '门限规则（大额推荐 2-of-3）',
      },
      {
        id: 3, x: 28, y: 86, w: 66, h: 7.5, anchor: 'tl', tone: 'accent',
        labelEn: 'Click “Invite devices”', labelZh: '点击广播 DKG 邀请',
      },
    ],
  },
  {
    id: 'ext-08',
    src: '/wallet-guide/ext-share-room.webp',
    alt: 'Expanded Share room with devices panel',
    device: 'extension',
    stepTag: 'EXT 08 · 复制房号',
    titleEn: '08 · Copy Room ID Directly to Other Devices',
    titleZh: '08 · 展开「Share room with devices」一键复制房间号',
    summaryEn: 'Expand “Share room with devices” to copy your Room ID into Starlab Desktop, TUI, or CLI before broadcasting the invite.',
    summaryZh: '建库前可展开此处一键「Copy room」发给自己的桌面端或第二台电脑，确保所有设备都在同一房间内。',
    callouts: [
      {
        id: 1, x: 6, y: 65, w: 88, h: 11, anchor: 'tl', tone: 'neon',
        labelEn: 'One-Click Copy Room ID', labelZh: '一键复制共享房间号',
      },
    ],
  },
  {
    id: 'ext-09',
    src: '/wallet-guide/ext-invite.webp',
    alt: 'Invite Devices Waiting Room in Extension',
    device: 'extension',
    stepTag: 'EXT 09 · 等待入组',
    titleEn: '09 · Setup 2 of 3 — Broadcast Invite & Wait for Peers',
    titleZh: '09 · 建库第 2/3 步：等待协签设备加入并自动启动 DKG',
    summaryEn: 'Shows “1 of 2 devices joined” in real time. Once Desktop/TUI/CLI joins, WebRTC P2P connects and 2-round DKG starts automatically.',
    summaryZh: '实时显示已加入设备数，也可点「Copy invite」手动粘贴邀请 ID；当所有设备入组后自动开始 2 轮 DKG！',
    callouts: [
      {
        id: 1, x: 6, y: 39, w: 88, h: 19, anchor: 'tl', tone: 'neon',
        labelEn: 'Live Peer Counter & Copy Invite', labelZh: '实时入组计数与复制邀请码',
      },
    ],
  },
  {
    id: 'ext-10',
    src: '/wallet-guide/ext-dkg-progress.webp',
    alt: 'Setup 3 of 3 Live DKG Key Generation in Extension',
    device: 'extension',
    stepTag: 'EXT 10 · 2轮DKG计算',
    titleEn: '10 · Setup 3 of 3 — Live 2-Round DKG Ceremony Running',
    titleZh: '10 · 建库第 3/3 步：多设备正在实时跑 2 轮 DKG 协议',
    summaryEn: 'Both devices execute Round 1 (commitments) + Round 2 (encrypted shares) + CGGMP24 ECDSA over WebRTC. Keep both apps open.',
    summaryZh: '此时插件 WASM 沙箱与桌面端正通过 WebRTC 直连交互完成 Round 1 公开承诺与 Round 2 点对点加密分片验证，保持页面不关闭即可。',
    callouts: [
      {
        id: 1, x: 6, y: 36, w: 88, h: 19, anchor: 'tl', tone: 'neon',
        labelEn: 'Joint Keygen (No Full Private Key)', labelZh: '分布式协同生成密钥（绝无完整私钥）',
      },
    ],
  },
  {
    id: 'ext-11',
    src: '/wallet-guide/ext-dkg-finish.webp',
    alt: 'Finish wallet setup Encrypt and Save',
    device: 'extension',
    stepTag: 'EXT 11 · 加密落盘',
    titleEn: '11 · Finish Wallet Setup — Encrypt & Save Local Share',
    titleZh: '11 · DKG 完成：用本地密码加密保存浏览器端分片',
    summaryEn: 'DKG succeeded! Enter your local password and click “Encrypt & save” so this device’s encrypted share persists across restarts.',
    summaryZh: '2 轮 DKG 算完后进入最后一步：输入本机密码并点击绿色「Encrypt & save」，将本机分片用 AES-256-GCM 加密写入本地存储。',
    callouts: [
      {
        id: 1, x: 6, y: 37, w: 88, h: 27, anchor: 'tl', tone: 'violet',
        labelEn: 'Encrypt Local Share Keystore', labelZh: '加密锁定当前浏览器分片',
      },
      {
        id: 2, x: 6, y: 67, w: 88, h: 11, anchor: 'tl', tone: 'accent',
        labelEn: 'Click “Encrypt & save”', labelZh: '点击完成保存并进入主面板',
      },
    ],
  },
  {
    id: 'ext-12',
    src: '/wallet-guide/ext-home.webp',
    alt: 'Starlab Extension Multi-Chain Dashboard',
    device: 'extension',
    stepTag: 'EXT 12 · 全链主页',
    titleEn: '12 · Multi-Chain Dashboard — Receive, Switch Networks & Sign',
    titleZh: '12 · 多链金库主面板：一键切网、HD 子账户收款与发起签名',
    summaryEn: 'Switch between Ethereum, Arbitrum, Optimism, Base, Polygon, Bitcoin, Solana, Sui, derive HD accounts, copy deposit address, or launch Co-Signing.',
    summaryZh: '主界面清晰展示金库名、地址、网络切换（ETH/ARB/OP/Base/Polygon/BTC/SOL/SUI）、在线绿点、2-of-2 标识与一键发起门限签名。',
    callouts: [
      {
        id: 1, x: 3, y: 11, w: 94, h: 9, anchor: 'tl', tone: 'neon',
        labelEn: 'Active Vault & Universal EVM Address', labelZh: '当前金库与全 EVM 通用地址',
      },
      {
        id: 2, x: 54, y: 22, w: 43, h: 5, anchor: 'tr', tone: 'violet',
        labelEn: 'Network Switcher & Online Peer Status', labelZh: '多链切换与协签在线状态',
      },
      {
        id: 3, x: 3, y: 28, w: 94, h: 24, anchor: 'tl', tone: 'accent',
        labelEn: 'HD Accounts, 2-of-2 Badge & Copy Address', labelZh: 'HD 多账户、2-of-2 标识与收款按钮',
      },
      {
        id: 4, x: 51, y: 58, w: 46, h: 14, anchor: 'tl', tone: 'neon',
        labelEn: 'Sign Message / dApp Co-Sign', labelZh: '发起门限协同签名',
      },
    ],
  },
  {
    id: 'ext-13',
    src: '/wallet-guide/ext-wallets.webp',
    alt: 'Select Wallet Multi-Vault Switcher',
    device: 'extension',
    stepTag: 'EXT 13 · 多金库',
    titleEn: '13 · Multi-Vault Switcher & Wallet Settings',
    titleZh: '13 · 多金库切换器：同时管理个人日常库与团队大额金库',
    summaryEn: 'Click the top vault bar to switch between multiple MPC vaults, add a new wallet, or open wallet-specific settings.',
    summaryZh: '点击顶部金库栏即可展开切换列表，随时新增多个不同门限（如 2-of-2 日常库 + 2-of-3 长期冷库）的独立金库。',
    callouts: [
      {
        id: 1, x: 4, y: 22, w: 92, h: 34, anchor: 'tl', tone: 'violet',
        labelEn: 'Switch Vaults or Add New Wallet', labelZh: '多金库一键切换与新增金库',
      },
    ],
  },
  {
    id: 'ext-14',
    src: '/wallet-guide/ext-settings-policy.webp',
    alt: 'Extension Settings Room, Connected dApps, Address Book, Spending Policy',
    device: 'extension',
    stepTag: 'EXT 14 · 风控设置',
    titleEn: '14 · Settings — Room ID, Connected dApps, Address Book & Policy',
    titleZh: '14 · 设置面板：房间号管理、已连 dApp、地址簿与风控策略',
    summaryEn: 'Manage light/dark theme, change your Signal Server Room, revoke connected dApps, maintain a trusted Address Book, and set spending policies.',
    summaryZh: '在右上角齿轮中可随时修改配对房间号、断开已授权 dApp、维护白名单地址簿，并进入下方企业级限额风控面板。',
    callouts: [
      {
        id: 1, x: 3, y: 34, w: 94, h: 22, anchor: 'tl', tone: 'neon',
        labelEn: 'Signal Server Room Management', labelZh: '信令房间号查看与更换',
      },
      {
        id: 2, x: 3, y: 58, w: 94, h: 24, anchor: 'tl', tone: 'violet',
        labelEn: 'Connected dApps & Address Book', labelZh: '已连 dApp 权限与常用地址簿',
      },
    ],
  },
  {
    id: 'ext-15',
    src: '/wallet-guide/ext-settings-backup.webp',
    alt: 'Extension Spending Policy and 3-File Encrypted Share Backup',
    device: 'extension',
    stepTag: 'EXT 15 · 限额与备份',
    titleEn: '15 · Spending Policy Limits & 3-File Encrypted Share Backup',
    titleZh: '15 · 单笔/日限额风控 + 3 曲线加密分片一键导出与恢复',
    summaryEn: 'Enforce per-tx and daily ETH spending limits BEFORE signing even begins, and export this device’s complete multi-chain encrypted backup.',
    summaryZh: '签名前强制拦截超额转账（Max per tx / Daily limit）；下方可勾选确认并导出本机的 3 份加密分片文件用于换机恢复。',
    callouts: [
      {
        id: 1, x: 3, y: 8, w: 94, h: 30, anchor: 'tl', tone: 'accent',
        labelEn: 'Pre-Sign Spending Policy Guardrails', labelZh: '签名前置限额拦截（单笔/每日/自动锁定）',
      },
      {
        id: 2, x: 3, y: 40, w: 94, h: 53, anchor: 'tl', tone: 'neon',
        labelEn: 'Export 3 Encrypted Share Files / Restore', labelZh: '导出 3 曲线加密分片备份 / 一键恢复',
      },
    ],
  },
];

// ============================================================================
// 2. STARLAB DESKTOP (starlab-desktop, Iced GUI) — 11 REAL ANNOTATED SCREENSHOTS
// ============================================================================
export const desktopShots: GuideShot[] = [
  {
    id: 'desk-01',
    src: '/wallet-guide/desktop-connection.webp',
    alt: 'Starlab Desktop Connection and Room Settings',
    device: 'desktop',
    stepTag: 'DESK 01 · 连接配对',
    titleEn: '01 · Connection & Devices — Signal Server, Room ID & Safe Primes',
    titleZh: '01 · 信令连接与安全素数预热（Connection & devices）',
    summaryEn: 'Enter the exact same Signal Server & Room ID as your Extension. Wait until “Secure setup: ready” confirms safe primes finished pre-generating.',
    summaryZh: '填写与 Chrome 插件完全一致的信令地址与 Room ID，等待左下提示 “Secure setup: ready” 表示门限 ECDSA 安全素数已预热完毕。',
    callouts: [
      { id: 1, x: 86, y: 2, w: 13.5, h: 8, anchor: 'bl', tone: 'neon', labelEn: 'Connected Status', labelZh: '信令在线状态' },
      { id: 2, x: 24, y: 18.5, w: 73.5, h: 21, anchor: 'tr', tone: 'accent', labelEn: 'Signal Server & Shared Room ID', labelZh: '信令地址与共享房间号' },
      { id: 3, x: 24, y: 50.8, w: 13.5, h: 4.2, anchor: 'br', tone: 'violet', labelEn: 'Safe Primes Ready', labelZh: '安全素数预计算就绪' },
    ],
  },
  {
    id: 'desk-02',
    src: '/wallet-guide/desktop-setup.webp',
    alt: 'Starlab Desktop Initial Set up wallet view',
    device: 'desktop',
    stepTag: 'DESK 02 · 建库入口',
    titleEn: '02 · Set Up Wallet — Create a New Wallet or Join an Invite',
    titleZh: '02 · 钱包初始化双面板：主动创建（2-of-3）或加入他人邀请',
    summaryEn: 'Left card starts a brand-new 2-of-3 vault from Desktop; right card listens automatically for invites announced by Extension, TUI, or CLI.',
    summaryZh: '左侧卡片可直接从桌面端发起新 2-of-3 钱包；右侧卡片实时监听同房间内的插件/TUI/CLI 建库邀请。',
    callouts: [
      { id: 1, x: 23, y: 11, w: 37, h: 49, anchor: 'tl', tone: 'violet', labelEn: 'Create New Wallet Panel', labelZh: '桌面端主动发起新金库' },
      { id: 2, x: 61, y: 11, w: 37, h: 56, anchor: 'tl', tone: 'neon', labelEn: 'Join a Wallet Panel', labelZh: '实时监听房间邀请加入' },
    ],
  },
  {
    id: 'desk-03',
    src: '/wallet-guide/desktop-invite-seen.webp',
    alt: 'Starlab Desktop live incoming invite detected',
    device: 'desktop',
    stepTag: 'DESK 03 · 发现邀请',
    titleEn: '03 · Incoming DKG Invite Discovered Automatically',
    titleZh: '03 · 自动捕获浏览器插件发出的实时邀请（无需手抄长 ID）',
    summaryEn: 'As soon as Chrome Extension clicks “Invite devices”, Desktop displays “Invitation from ext-… · 1 of 2 joined” automatically.',
    summaryZh: '插件端一点「Invite devices」，桌面端右侧立即弹出邀请卡，直接单击即可自动填入 Invite ID。',
    callouts: [
      { id: 1, x: 62.5, y: 25.5, w: 35, h: 8, anchor: 'tl', tone: 'neon', labelEn: 'Click Incoming Invite Card', labelZh: '单击即可选中实时邀请' },
    ],
  },
  {
    id: 'desk-04',
    src: '/wallet-guide/desktop-join.webp',
    alt: 'Starlab Desktop Join a wallet with password filled',
    device: 'desktop',
    stepTag: 'DESK 04 · 设密加入',
    titleEn: '04 · Set Independent Local Share Password & Click “Join wallet”',
    titleZh: '04 · 填写桌面端独立密码，点击「Join wallet」加入 DKG',
    summaryEn: 'Invite ID fills automatically; enter your Desktop-only local encryption password (PBKDF2 + AES-256-GCM) and click “Join wallet”.',
    summaryZh: '确认 Invite ID 已填充、输入 8 位以上独立密码后，「Join wallet」亮起紫色，点击立即与插件建立 WebRTC 直连。',
    callouts: [
      { id: 1, x: 62.5, y: 25.5, w: 35, h: 8, anchor: 'tl', tone: 'neon', labelEn: 'Selected Invite', labelZh: '已选中的建库邀请' },
      { id: 2, x: 62.5, y: 47.5, w: 35, h: 7.5, anchor: 'tl', tone: 'violet', labelEn: 'Desktop-Only Password', labelZh: '桌面端独立分片密码' },
      { id: 3, x: 88, y: 58.5, w: 9.5, h: 7, anchor: 'tl', tone: 'accent', labelEn: 'Click “Join wallet”', labelZh: '点击启动 2 轮 DKG' },
    ],
  },
  {
    id: 'desk-05',
    src: '/wallet-guide/desktop-dkg.webp',
    alt: 'Starlab Desktop DKG Round 1 of 2 progress',
    device: 'desktop',
    stepTag: 'DESK 05 · DKG 进度',
    titleEn: '05 · Generating Keys — Round 1 of 2 Live Stepper (2-of-2)',
    titleZh: '05 · 实时 2 轮 DKG 进度条：设备直连 → 安全设置 → 创建钱包 → 就绪',
    summaryEn: 'Displays live stage progress (“Round 1 of 2 — keep every device online”) and confirms 2 of 2 devices joined.',
    summaryZh: '清晰展示四阶段进度（Connect devices → Secure setup → Create wallet → Ready），以及 2/2 协同设备核验状态。',
    callouts: [
      { id: 1, x: 24, y: 24.5, w: 62, h: 7.5, anchor: 'tr', tone: 'neon', labelEn: 'Live 4-Stage DKG Stepper', labelZh: '实时四阶段 DKG 进度' },
      { id: 2, x: 24, y: 46, w: 73, h: 18, anchor: 'tr', tone: 'accent', labelEn: 'Verified 2-of-2 Peer Roster', labelZh: '已核验的协同设备名单' },
    ],
  },
  {
    id: 'desk-06',
    src: '/wallet-guide/desktop-dkg-3peers.webp',
    alt: 'Starlab Desktop multi-client 3-device roster (Desktop + TUI + Extension)',
    device: 'desktop',
    stepTag: 'DESK 06 · 跨端混编',
    titleEn: '06 · Cross-Client Interop — Desktop + TUI + Extension Together!',
    titleZh: '06 · 真正跨端混编：桌面端 + 终端 TUI + Chrome 插件同房协同',
    summaryEn: 'Notice three distinct client types (starlab-desktop, cold-tui-node, ext-37e6513d) seamlessly speaking the exact same wire protocol.',
    summaryZh: '桌面端、终端 TUI 与 Chrome 浏览器插件使用完全统一的底层协议与加密格式，可任意自由组合 2-of-3 / 3-of-5 门限！',
    callouts: [
      { id: 1, x: 24, y: 52, w: 73, h: 16, anchor: 'tr', tone: 'neon', labelEn: 'Desktop + TUI + Extension Interop', labelZh: '三类不同客户端原生互通协同' },
    ],
  },
  {
    id: 'desk-07',
    src: '/wallet-guide/desktop-sign.webp',
    alt: 'Starlab Desktop Ethereum CGGMP24 Signing Form',
    device: 'desktop',
    stepTag: 'DESK 07 · 以太坊多签',
    titleEn: '07 · Sign a Message — Ethereum / EVM (CGGMP24 ECDSA)',
    titleZh: '07 · 发起以太坊/全 EVM 门限签名（核对地址并广播请求）',
    summaryEn: 'Pick your vault & Account 0 on the left, select Ethereum, verify the exact signing address, paste the hex payload, enter your password, and click “Request signature”.',
    summaryZh: '左侧选中金库与账户，选择 Ethereum，核对与插件端一致的 0x 地址，填入十六进制摘要与本机密码后点击「Request signature」。',
    callouts: [
      { id: 1, x: 2, y: 18, w: 20, h: 35, anchor: 'tl', tone: 'neon', labelEn: 'All Derived Chain Addresses', labelZh: '全曲线地址与 HD 账户' },
      { id: 2, x: 24, y: 29, w: 22, h: 8, anchor: 'tr', tone: 'violet', labelEn: 'Select Signing Chain', labelZh: '切换 EVM / Bitcoin Taproot' },
      { id: 3, x: 24, y: 40, w: 30, h: 5, anchor: 'tr', tone: 'accent', labelEn: 'Verify Signing Address', labelZh: '核对发件地址一致性' },
      { id: 4, x: 83.5, y: 71, w: 14, h: 7, anchor: 'tr', tone: 'accent', labelEn: 'Broadcast Signing Request', labelZh: '广播协同签名审批请求' },
    ],
  },
  {
    id: 'desk-08',
    src: '/wallet-guide/desktop-signing-waiting.webp',
    alt: 'Starlab Desktop waiting for second device approval',
    device: 'desktop',
    stepTag: 'DESK 08 · 等待协签',
    titleEn: '08 · Live Co-Sign State — Waiting for Second Device Approval',
    titleZh: '08 · 实时等待协签：必须另一台设备批准才能产出签名',
    summaryEn: 'After clicking “Request signature”, Desktop locks into “Signing… Waiting for another device of this wallet to approve…” until quorum approves.',
    summaryZh: '发起后按钮变为「Signing…」，底部绿字提示「Waiting for another device of this wallet to approve…」，单台设备永远无法越权签发。',
    callouts: [
      { id: 1, x: 86, y: 70, w: 11.5, h: 7, anchor: 'tr', tone: 'violet', labelEn: 'Signing Session Active', labelZh: '签名会话进行中' },
      { id: 2, x: 24, y: 82, w: 46, h: 5, anchor: 'tr', tone: 'neon', labelEn: 'Awaiting Co-Signer Approval', labelZh: '等待第二台设备独立审核批准' },
    ],
  },
  {
    id: 'desk-09',
    src: '/wallet-guide/desktop-sign-btc.webp',
    alt: 'Starlab Desktop Bitcoin Taproot Signing and Single-Device Security Enforcement',
    device: 'desktop',
    stepTag: 'DESK 09 · BTC Taproot',
    titleEn: '09 · Bitcoin Taproot (bc1p…) Signing & Single-Device Block Proof',
    titleZh: '09 · 比特币 Taproot 签名界面 + 单设备超时拦截安全实证',
    summaryEn: 'Switching to Bitcoin displays your native BIP-86 bc1p… Taproot address. Notice the red notice at bottom: if only 1 of 2 signers is ready, signing is cryptographically blocked!',
    summaryZh: '切换到 Bitcoin 立即显示 BIP-86 原生 Taproot 地址（bc1p…）；底部红字真实演示了“仅 1/2 设备就绪时签发自动失败拦截”的安全保障！',
    callouts: [
      { id: 1, x: 24, y: 40, w: 54, h: 5.5, anchor: 'tr', tone: 'neon', labelEn: 'Native Bitcoin P2TR Taproot Address', labelZh: '原生比特币 Taproot 地址（BIP-340）' },
      { id: 2, x: 24, y: 82, w: 68, h: 5, anchor: 'tr', tone: 'accent', labelEn: 'Quorum Enforcement (1 of 2 Blocked)', labelZh: '门限强制校验（不足 2 台直接拒签）' },
    ],
  },
  {
    id: 'desk-10',
    src: '/wallet-guide/desktop-hd-account3.webp',
    alt: 'Starlab Desktop HD Multi-Account Derivation Account 3',
    device: 'desktop',
    stepTag: 'DESK 10 · HD 多账户',
    titleEn: '10 · Public-Only HD Accounts — Click “+” to Derive Account 1, 2, 3…',
    titleZh: '10 · 零交互 HD 多账户派生：点「+」秒生全新四链子账户',
    summaryEn: 'Clicking “+” next to Account 0 instantly derives Account 1, 2, 3… with fresh Solana, Sui, Bitcoin, and EVM addresses — NO extra DKG rounds needed!',
    summaryZh: '点击左侧 Account 旁的「+」，无需重跑 DKG、无需其他设备在线，瞬间派生出 Account 3 的全新全链收款地址，隔离资金用途超方便。',
    callouts: [
      { id: 1, x: 2, y: 43, w: 20, h: 12, anchor: 'tl', tone: 'neon', labelEn: 'Account Switcher & “+” Derive', labelZh: '一键新增/切换 HD 子账户（免 DKG）' },
      { id: 2, x: 24, y: 21, w: 28, h: 5, anchor: 'tr', tone: 'violet', labelEn: 'Signing with Account 3 Child Key', labelZh: '自动切换为 Account 3 子密钥签名' },
    ],
  },
  {
    id: 'desk-11',
    src: '/wallet-guide/desktop-backup.webp',
    alt: 'Starlab Desktop Backup and Restore Encrypted Key Share',
    device: 'desktop',
    stepTag: 'DESK 11 · 加密备份',
    titleEn: '11 · Backup & Restore — Export or Import Encrypted Share JSON',
    titleZh: '11 · 分片加密备份与换机恢复（永不包含完整私钥）',
    summaryEn: 'Export this device’s encrypted key share JSON to offline storage, or import it onto a replacement laptop with the original password.',
    summaryZh: '输入本机分片密码后即可导出离线加密 JSON，或在更换电脑时点击「Import key share…」原地恢复。',
    callouts: [
      { id: 1, x: 24, y: 18.5, w: 54, h: 4.5, anchor: 'tr', tone: 'neon', labelEn: 'Share-Only Guarantee', labelZh: '不含完整私钥，单份泄露也安全' },
      { id: 2, x: 24, y: 31, w: 73, h: 7.5, anchor: 'tr', tone: 'violet', labelEn: 'Key Share Password', labelZh: '验证本机 AES-256-GCM 口令' },
      { id: 3, x: 24, y: 39.8, w: 28, h: 7.5, anchor: 'br', tone: 'accent', labelEn: 'Import / Export Share', labelZh: '导出离线备份 / 新设备导入' },
    ],
  },
];

// ============================================================================
// 3. STARLAB TUI (starlab-tui, Ratatui Terminal UI) — 6 REAL SCREENSHOTS
// ============================================================================
export const tuiShots: GuideShot[] = [
  {
    id: 'tui-01',
    src: '/wallet-guide/tui-home.webp',
    alt: 'Starlab TUI Main Menu with Live 2-of-2 Wallet Loaded',
    device: 'tui',
    stepTag: 'TUI 01 · 主菜单',
    titleEn: '01 · Terminal UI Dashboard — Lightweight, SSH-Friendly & Zero GUI Bloat',
    titleZh: '01 · 终端 TUI 主界面：极简轻量、支持 SSH 远程与老电脑冷备',
    summaryEn: 'Run starlab-tui over SSH, Linux console, or macOS terminal. Shows live wallet count, network connection, and background ECDSA safe-prime status.',
    summaryZh: '一条命令即可在 Linux / macOS 终端或树莓派冷机运行，键盘方向键操作，状态栏实时显示网络连通性与已加载金库数。',
    callouts: [
      { id: 1, x: 2, y: 26, w: 74, h: 24, anchor: 'tr', tone: 'neon', labelEn: 'Full MPC Menu (Create / Join / Manage / Sign)', labelZh: '完整功能菜单：建库、入组、管理、签名' },
      { id: 2, x: 2, y: 92, w: 24, h: 6, anchor: 'tr', tone: 'accent', labelEn: 'Live Network Connection Badge', labelZh: '信令网络连接状态' },
    ],
  },
  {
    id: 'tui-02',
    src: '/wallet-guide/tui-mode-select.webp',
    alt: 'Starlab TUI Operation Mode Selection Online Hot vs Offline Air-Gap Cold',
    device: 'tui',
    stepTag: 'TUI 02 · 热/冷模式',
    titleEn: '02 · Security Model Selection — Online Mesh vs Offline Air-Gap (SD Card)',
    titleZh: '02 · 安全模型选择（Step 1/3）：在线 WebRTC 热钱包 vs 离线断网冷钱包',
    summaryEn: 'Choose between Online Mode (real-time WebRTC P2P) and Offline Cold Mode (air-gapped hardware exchanging packages via SD card / USB).',
    summaryZh: '明确区分「Online Mode（在线实时 WebRTC）」与「Offline Mode（彻底断网空气隔离 + SD 卡/U 盘交换）」，满足机构级合规冷存需求。',
    callouts: [
      { id: 1, x: 2, y: 31, w: 36, h: 46, anchor: 'tl', tone: 'neon', labelEn: 'Online Mode (WebRTC P2P)', labelZh: '在线实时模式（WebRTC 直连）' },
      { id: 2, x: 39, y: 31, w: 36, h: 46, anchor: 'tr', tone: 'accent', labelEn: 'Offline Mode (Air-Gap Cold Vault)', labelZh: '断网冷钱包模式（物理隔离）' },
    ],
  },
  {
    id: 'tui-03',
    src: '/wallet-guide/tui-threshold-config.webp',
    alt: 'Starlab TUI Threshold Configuration 2-of-3 with Security Level Bar',
    device: 'tui',
    stepTag: 'TUI 03 · 门限配置',
    titleEn: '03 · Threshold Configuration — 2-of-3 Policy & Live Security Level Bar',
    titleZh: '03 · 门限参数配置（Step 3/3）：支持 2~10 台设备自由设定 t-of-n',
    summaryEn: 'Adjust Total Participants (2–10) and Signing Threshold with real-time validation (“2 signers required, 1 can be offline”) and security score.',
    summaryZh: '支持 2 到 10 台设备任意组合门限，实时校验容错能力（例如 2-of-3：需要 2 人签字，允许任意 1 台设备离线或丢失）。',
    callouts: [
      { id: 1, x: 2, y: 20, w: 72, h: 36, anchor: 'tr', tone: 'neon', labelEn: 'Participants (n) & Threshold (t)', labelZh: '总人数 n 与签名门限 t 实时调节' },
      { id: 2, x: 2, y: 66, w: 72, h: 14, anchor: 'tr', tone: 'violet', labelEn: 'Live Security Level & Fault Tolerance', labelZh: '安全等级与离线容错提示' },
    ],
  },
  {
    id: 'tui-04',
    src: '/wallet-guide/tui-manage-wallets.webp',
    alt: 'Starlab TUI Manage Wallets Multi-Chain Addresses',
    device: 'tui',
    stepTag: 'TUI 04 · 钱包详情',
    titleEn: '04 · Manage Wallets — Inspect All Derived Addresses & Keystore Metadata',
    titleZh: '04 · 钱包管理视图：一眼核验 ETH / BTC Taproot / SOL / SUI 全地址',
    summaryEn: 'Reads the exact same encrypted keystore directory as Starlab Desktop — press Enter to Sign, e to Export encrypted backup, or i to Import.',
    summaryZh: '与桌面端共享完全一致的本地加密密钥库格式！底部清晰列出四条曲线派生地址，按 Enter 直接签名、按 e 导出加密备份、按 i 导入恢复。',
    callouts: [
      { id: 1, x: 2, y: 11, w: 73, h: 6, anchor: 'tr', tone: 'neon', labelEn: 'Vault Row (2/2 · ETH BTC SOL SUI)', labelZh: '金库摘要（2/2 门限与支持链）' },
      { id: 2, x: 2, y: 74, w: 73, h: 19, anchor: 'tr', tone: 'accent', labelEn: 'Full Multi-Chain Addresses & Shortcuts', labelZh: '完整四链地址与快捷操作键' },
    ],
  },
  {
    id: 'tui-05',
    src: '/wallet-guide/tui-sign-form.webp',
    alt: 'Starlab TUI Sign Transaction Screen',
    device: 'tui',
    stepTag: 'TUI 05 · 终端签发',
    titleEn: '05 · Terminal Co-Signing — Press Tab to Switch EVM ECDSA / BTC Taproot',
    titleZh: '05 · 终端门限签发界面：按 Tab 切换以太坊 ECDSA 与比特币 Taproot',
    summaryEn: 'Verify the group public key and Account 0 address, paste your message or transaction digest, and press Enter to broadcast a co-signing session.',
    summaryZh: '核对 Group key 与账户地址，按 Tab 切换链类型，输入待签交易哈希或消息后回车即可与插件/桌面端协同签发。',
    callouts: [
      { id: 1, x: 2, y: 14, w: 66, h: 13, anchor: 'tr', tone: 'neon', labelEn: 'Group Key, Address & Chain Switch', labelZh: '组公钥、地址与 Tab 切链提示' },
      { id: 2, x: 2, y: 28, w: 73, h: 15, anchor: 'tr', tone: 'violet', labelEn: 'Transaction / Message Input Box', labelZh: '待签消息或交易摘要输入框' },
    ],
  },
  {
    id: 'tui-06',
    src: '/wallet-guide/tui-export-backup.webp',
    alt: 'Starlab TUI Export Encrypted Key Share Backup',
    device: 'tui',
    stepTag: 'TUI 06 · 终端备份',
    titleEn: '06 · Encrypted Share Export to Local Path / Removable SD Card',
    titleZh: '06 · 终端加密分片导出：直写 U 盘 / SD 卡离线保存',
    summaryEn: 'Press e on any wallet to export its encrypted share file to ~/starlab-export/ (or a mounted USB/SD path). Stays encrypted with your wallet password.',
    summaryZh: '按 e 键即可将当前设备的加密分片导出到指定目录或挂载的 U 盘/SD 卡路径，文件全程保持钱包密码加密。',
    callouts: [
      { id: 1, x: 2, y: 12, w: 73, h: 25, anchor: 'tr', tone: 'accent', labelEn: 'Export Destination & Password Unlock', labelZh: '导出路径与本地口令验证' },
    ],
  },
];

// ============================================================================
// 4. STARLAB CLI (starlab-cli, Headless Automation) — 4 REAL SCREENSHOTS
// ============================================================================
export const cliShots: GuideShot[] = [
  {
    id: 'cli-01',
    src: '/wallet-guide/cli-dkg-2rounds.webp',
    alt: 'Starlab CLI Real 2-of-2 DKG Round 1 and Round 2 Output',
    device: 'cli',
    stepTag: 'CLI 01 · 2轮DKG全日志',
    titleEn: '01 · Real 2-of-2 DKG Protocol Trace — Round 1 → Round 2 → Finalize',
    titleZh: '01 · 实机 2 轮 DKG 协议全日志：Round 1 公开承诺 → Round 2 秘密分片 → 成库',
    summaryEn: 'Actual execution of starlab-cli wallet create + session join: shows 135-byte DKG_ROUND1 broadcast, 131-byte point-to-point DKG_ROUND2, and finalized Solana/Sui/Aptos addresses.',
    summaryZh: '两台 CLI 节点实测输出：清楚看到 Round 1 广播 135 字节公开承诺、Round 2 点对点发送 131 字节加密分片，最后零私钥导出组公钥与多链地址！',
    layout: 'wide',
    callouts: [
      { id: 1, x: 1.5, y: 31, w: 78, h: 14, anchor: 'tr', tone: 'neon', labelEn: 'DKG Round 1 — Commitments (135B)', labelZh: 'DKG 第一轮：广播公开多项式承诺（135B）' },
      { id: 2, x: 1.5, y: 47, w: 80, h: 14, anchor: 'tr', tone: 'violet', labelEn: 'DKG Round 2 — P2P Secret Shares (131B)', labelZh: 'DKG 第二轮：点对点秘密分片与零知识验证（131B）' },
      { id: 3, x: 1.5, y: 63, w: 80, h: 26, anchor: 'tr', tone: 'accent', labelEn: 'Finalize — Group Key & Multi-Chain Addresses', labelZh: '本地加密落盘并算出全链地址' },
    ],
  },
  {
    id: 'cli-02',
    src: '/wallet-guide/cli-hd-accounts.webp',
    alt: 'Starlab CLI Public-Only HD Multi-Account Derivation',
    device: 'cli',
    stepTag: 'CLI 02 · HD 多账户',
    titleEn: '02 · Offline Public-Only HD Accounts (wallet list & wallet accounts)',
    titleZh: '02 · 离线免密派生无限 HD 子账户（Account 0 / 1 / 2 全路径对照）',
    summaryEn: 'List every chain and standard BIP-44/86 derivation path (m/44\'/60\'/0\'/0/i, m/86\'/0\'/0\'/0/i, m/44\'/501\'/i\'/0\', m/44\'/784\'/i\'/0\'/0\') with zero password and zero network.',
    summaryZh: '不需要密码、不需要联网！一条命令列出 Account 0/1/2 的全部标准派生路径与对应地址（其中 EVM 地址通用上百条 EVM 链）。',
    layout: 'wide',
    callouts: [
      { id: 1, x: 1.5, y: 12, w: 94, h: 22, anchor: 'tr', tone: 'neon', labelEn: 'wallet list — Vault Summary', labelZh: '查看金库门限与主账户地址' },
      { id: 2, x: 1.5, y: 42, w: 94, h: 51, anchor: 'tr', tone: 'violet', labelEn: 'wallet accounts — Account 0, 1, 2 (No Password!)', labelZh: '纯公钥派生 Account 0 / 1 / 2（免密免联网）' },
    ],
  },
  {
    id: 'cli-03',
    src: '/wallet-guide/cli-sign-2rounds.webp',
    alt: 'Starlab CLI Real 2-of-2 Threshold Signing Round 1 and Round 2',
    device: 'cli',
    stepTag: 'CLI 03 · 2轮多签全日志',
    titleEn: '03 · Real 2-of-2 Threshold Signing — Round 1 Commitments → Round 2 Shares → Aggregate',
    titleZh: '03 · 实机 2 轮门限多签全日志：SIGN_COMMIT → SIGN_SHARE → 标准链上签名',
    summaryEn: 'Actual execution of starlab-cli sign + session join: 69-byte SIGN_COMMIT in Round 1, 32-byte SIGN_SHARE in Round 2, aggregated into a standard 64-byte signature identical on both nodes.',
    summaryZh: '实测两节点门限签名全过程：Round 1 交换 69 字节随机数承诺（SIGN_COMMIT），Round 2 交换 32 字节局部签名分片（SIGN_SHARE），聚合产出 64 字节标准单签签名！',
    layout: 'wide',
    callouts: [
      { id: 1, x: 1.5, y: 29, w: 80, h: 17, anchor: 'tr', tone: 'neon', labelEn: 'Signing Round 1 — SIGN_COMMIT (69B)', labelZh: '签名第一轮：交换一次性随机数承诺（69B）' },
      { id: 2, x: 1.5, y: 48, w: 80, h: 17, anchor: 'tr', tone: 'violet', labelEn: 'Signing Round 2 — SIGN_SHARE (32B)', labelZh: '签名第二轮：计算局部签名分片并聚合（32B）' },
      { id: 3, x: 1.5, y: 68, w: 86, h: 18, anchor: 'tr', tone: 'accent', labelEn: 'Standard On-Chain Signature Output', labelZh: '输出全链通用的标准单签签名' },
    ],
  },
  {
    id: 'cli-04',
    src: '/wallet-guide/cli-reshare-broadcast.webp',
    alt: 'Starlab CLI Reshare Key Rotation and On-Chain Transaction Broadcast',
    device: 'cli',
    stepTag: 'CLI 04 · 刷新分片与广播',
    titleEn: '04 · Proactive Key-Share Reshare (Same Address!) & RPC Transaction Broadcast',
    titleZh: '04 · 不换地址刷新密钥分片（Reshare）+ RPC 广播上链实战命令',
    summaryEn: 'Rotate FROST key shares via starlab-cli reshare without changing your group address, and broadcast any signed raw transaction via eth_sendRawTransaction (or auto-broadcast in Chrome Extension).',
    summaryZh: '支持通过 reshare 定期轮换/淘汰旧分片且保持收款地址 100% 不变；下半部分展示原始交易通过 eth_sendRawTransaction 广播上链并获得 Tx Hash 的标准流程。',
    layout: 'wide',
    callouts: [
      { id: 1, x: 1.5, y: 12, w: 94, h: 30, anchor: 'tr', tone: 'neon', labelEn: 'FROST Reshare — Rotate Shares, Keep Address', labelZh: '2 轮 Reshare：轮换分片且收款地址完全不变' },
      { id: 2, x: 1.5, y: 48, w: 94, h: 30, anchor: 'tr', tone: 'accent', labelEn: 'Broadcast Raw Signed Tx → Live Tx Hash', labelZh: '提交 Raw Signed Tx 到 RPC 广播上链获取 Tx Hash' },
    ],
  },
];

export const comparisons = [
  {
    metricEn: 'Seed Phrase Single-Point Risk',
    metricZh: '助记词单点泄露 / 丢失风险',
    seedEn: 'High — 12 words stolen = 100% drained',
    seedZh: '极高 — 12 个词被拍/被偷即资产归零',
    hwEn: 'Medium — paper seed still a single point',
    hwZh: '中等 — 纸质助记词仍是单点风险',
    mpcEn: 'Eliminated — 2-round DKG never creates a seed phrase',
    mpcZh: '彻底消除 — 2 轮 DKG 从未生成过完整私钥与助记词',
  },
  {
    metricEn: 'Supported Chains & Curves',
    metricZh: '支持公链范围（对标 Ledger）',
    seedEn: 'Often locked to a single ecosystem (EVM-only or SOL-only)',
    seedZh: '常局限于单一生态（仅 EVM 或仅 Solana）',
    hwEn: 'Broad (secp256k1 + Ed25519), requires installing chain apps',
    hwZh: '广（secp256k1 + Ed25519），需反复装卸各链固件 App',
    mpcEn: 'Ledger-level coverage: 100+ EVM + BTC Taproot + SOL + SUI + Aptos + Ledger WebHID',
    mpcZh: '与 Ledger 同级曲线覆盖：100+ EVM 链 + BTC + SOL + SUI + Aptos，且兼容直连 Ledger',
  },
  {
    metricEn: 'Multi-Sig Gas Fee & Privacy',
    metricZh: '多签 Gas 费用与链上隐私',
    seedEn: 'Single-sig only (no native multisig)',
    seedZh: '仅单签，无原生多签保护',
    hwEn: 'Contract multisig costs extra Gas & exposes signers',
    hwZh: '配合 Safe 合约多签 Gas 贵且链上暴露管理员',
    mpcEn: 'Off-chain 2-round threshold signature = lowest single-sig Gas & zero exposure',
    mpcZh: '链下 2 轮门限协同 = 普通单签最低 Gas，链上完全隐藏多签结构',
  },
  {
    metricEn: 'Client Flexibility (4 Clients)',
    metricZh: '多端协同自由度（四大客户端）',
    seedEn: 'Browser or mobile only',
    seedZh: '仅浏览器或手机单端',
    hwEn: 'Proprietary closed hardware device required',
    hwZh: '必须购买专用封闭硬件',
    mpcEn: 'Mix & match Chrome Extension + Desktop + Terminal TUI + Headless CLI',
    mpcZh: 'Chrome 插件 + 桌面端 + 终端 TUI + 命令行 CLI 任意混编协同',
  },
  {
    metricEn: 'Hardware Cost & Setup',
    metricZh: '上手成本与设备门槛',
    seedEn: 'Free',
    seedZh: '免费',
    hwEn: '$80–$250 + shipping wait',
    hwZh: '¥600–¥2000 且需等待邮寄',
    mpcEn: 'Free — use devices you already own (+ optional YubiKey / Ledger)',
    mpcZh: '免费 — 直接用现有电脑/浏览器组建（可选搭配 YubiKey / Ledger）',
  },
];

export const faqs = [
  {
    qEn: 'Why does DKG have TWO rounds (Round 1 and Round 2)? Can I skip Round 2?',
    qZh: '为什么 DKG 必须分两轮（Round 1 和 Round 2）？不能一轮搞定吗？',
    aEn: 'Both rounds are mathematically essential so nobody can cheat or bias the key: in Round 1, every device commits publicly to its secret polynomial (like sealing an envelope on the table before seeing anyone else’s number). Only AFTER every device’s Round 1 commitment is locked in does Round 2 send point-to-point secret shares — and every receiver mathematically verifies the share against Round 1’s commitment. Skipping Round 1 would allow the last participant to manipulate the final wallet address!',
    aZh: '两轮缺一不可，核心是为了防作弊：第一轮（Round 1）每台设备先把自己的秘密多项式做成「公开承诺」摆在桌面上（就像先把信封封口，谁都不能事后反悔）；收齐所有人的第一轮承诺后，第二轮（Round 2）才把点对点秘密分片发给对应设备，收到方用第一轮的承诺做零知识数学验算。如果没有第一轮承诺，最后一个发言的设备就能操纵最终生成的公钥！',
  },
  {
    qEn: 'Why does Threshold Signing also have TWO rounds (Round 1 Commitments → Round 2 Shares)?',
    qZh: '为什么门限多签（Signing）也分两轮？',
    aEn: 'In FROST threshold Schnorr signing, Round 1 exchanges fresh single-use nonce commitments (SIGN_COMMIT, 69 bytes) so all signers lock in the joint randomness R before computing any partial signature. In Round 2, each signer computes its 32-byte partial signature share (SIGN_SHARE) bound to both the message hash and everyone’s Round 1 commitments, then anyone aggregates the shares into a standard 64-byte signature. For EVM ECDSA, CGGMP24 runs interactive signing rounds over the same WebRTC channel to output a standard 65-byte low-s r‖s‖v signature.',
    aZh: '在 FROST 门限签名中，第一轮（SIGN_COMMIT，69 字节）用于所有签发设备先交换并锁定一次性随机数承诺 R；第二轮（SIGN_SHARE，32 字节）才结合消息摘要与所有人的第一轮承诺算出局部签名分片并聚合为标准单签签名。在以太坊 EVM 上，CGGMP24 同样通过端到端 WebRTC 交互轮次产出标准的 65 字节低-s 签名（r‖s‖v），全程从不还原完整私钥。',
  },
  {
    qEn: 'Does Starlab really support as many chains as Ledger?',
    qZh: '真的和 Ledger 支持的链一样多吗？具体支持哪些链？',
    aEn: 'Yes — Ledger secures almost every major asset via two elliptic curves: secp256k1 (all EVM chains + Bitcoin) and Ed25519 (Solana, Sui, Aptos, TON, NEAR, etc.). Starlab MPC implements threshold cryptography across both curves: one vault unlocks Ethereum + Arbitrum + Optimism + Base + Polygon + BNB Chain + Avalanche + ANY custom EVM RPC (100+ chains with one 0x address), Bitcoin Taproot (bc1p…), Solana, Sui, and Aptos. You can also connect a physical Ledger via WebHID inside the Chrome Extension.',
    aZh: '是的！Ledger 支持上百条链的底层基础就是 secp256k1 与 Ed25519 两条椭圆曲线。Starlab MPC 用门限密码学完整覆盖了这两条曲线：一个金库原生覆盖全部 100+ EVM 链（内置 ETH/ARB/OP/Base/Polygon/BSC/Avalanche 并支持自定义任意 EVM RPC）、Bitcoin Taproot（bc1p…）、Solana、Sui、Aptos，而且 Chrome 插件还内置 WebHID 可直接连接你的 Ledger 硬件钱包同屏管理。',
  },
  {
    qEn: 'What is the exact relationship between DKG, Multi-Sig, and Broadcasting?',
    qZh: '小白最后确认一次：DKG、多签、广播三者分别在什么时候用？',
    aEn: '(1) DKG runs ONCE when creating a wallet — devices cooperate across 2 rounds to generate split key shares and public addresses with zero seed phrase. (2) Threshold Multi-Sig runs EVERY TIME you send funds or sign — t devices review the payload and run 2 signing rounds to produce a valid signature. (3) Broadcasting happens RIGHT AFTER signing — submitting the raw signed transaction to an RPC node (eth_sendRawTransaction / mempool) so miners/validators confirm it on-chain. The Chrome Extension broadcasts automatically after approval.',
    aZh: '① DKG 只在【新建钱包时】跑一次，两轮算出各自加密分片与全链收款地址；② 门限多签在【每次转账/授权时】触发，任意 t 台设备核对金额和地址后跑两轮算出标准签名；③ 广播紧跟【签完名之后】，把带签名的原始交易提交给区块链 RPC 节点打包上链。用 Chrome 插件转账或连 dApp 时，签完名插件会自动帮你广播并返回 Tx Hash。',
  },
  {
    qEn: 'What happens if I lose one device or want to rotate key shares?',
    qZh: '丢了一台设备怎么办？可以不换地址刷新分片（Reshare）吗？',
    aEn: 'First, always export each device’s encrypted backup (Extension Settings → Backup, Desktop Backup & restore, or TUI e key) to separate offline drives so you can restore on a new device immediately. Second, for high-value funds create a 2-of-3 vault so losing any single device never freezes your assets. Third, for FROST keys (Bitcoin Taproot, Solana, Sui, Aptos), starlab-cli reshare lets you rotate shares proactively WITHOUT changing your wallet address!',
    aZh: '首先，务必把每台设备的加密分片分别导出到不同离线 U 盘/SD 卡，换机输入原密码即可恢复。其次，大额资产请建 2-of-3 金库，丢任意一台其余两台照常签发。此外，对于 FROST 密钥（Bitcoin Taproot / Solana / Sui / Aptos），还可以用 starlab-cli reshare 定期刷新分片，旧分片立即作废且收款地址 100% 不变！',
  },
];
