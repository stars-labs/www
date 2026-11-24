<script lang="ts">
  import { locale } from '../lib/i18n';
  import { navigateTo } from '../lib/router';
  import AnnotatedScreenshot, { type Callout } from './AnnotatedScreenshot.svelte';

  let openFaq: number | null = 0;
  let activeLesson: 'dkg' | 'multisig' | 'broadcast' = 'dkg';

  function toggleFaq(index: number) {
    openFaq = openFaq === index ? null : index;
  }

  function scrollToStep(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const stepsNav = [
    { id: 'chains', num: '链', en: 'All Chains', zh: '全链支持' },
    { id: 'concepts', num: '00', en: 'DKG · Multi-Sig · Broadcast', zh: '小白课：DKG/多签/广播' },
    { id: 'step-1', num: '01', en: 'Pair Devices', zh: '准备与配对' },
    { id: 'step-2', num: '02', en: 'Run DKG', zh: '创建金库(DKG)' },
    { id: 'step-3', num: '03', en: 'Multi-Chain Receive', zh: '全链收款' },
    { id: 'step-4', num: '04', en: 'Co-Sign & Broadcast', zh: '多签与广播' },
    { id: 'step-5', num: '05', en: 'Encrypted Backup', zh: '分片备份' },
  ];

  // --- Chain ecosystem matrix (matching Ledger's secp256k1 + Ed25519 curve coverage) ---
  const chainFamilies = [
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
      pills: ['Bitcoin Mainnet (bc1p…)', 'BIP-86 HD Accounts', 'BIP-340 Schnorr', 'Low-Fee Single-Sig Footprint'],
    },
    {
      badge: 'ED25519 · FROST SCHNORR',
      accentClass: 'text-teal-300 border-teal-400/30 bg-teal-500/10',
      titleEn: 'Solana, Sui & Ed25519 Ecosystem',
      titleZh: 'Solana、Sui 与 Ed25519 高性能链生态',
      descEn:
        'Native Ed25519 threshold signing powers Solana and Sui out of the box — the exact same elliptic curve Ledger uses across high-throughput Ed25519 chains (Aptos, TON, NEAR, Stellar, Polkadot).',
      descZh:
        '原生支持 Solana 与 Sui 门限签名；底层采用与 Ledger 相同的 Ed25519 椭圆曲线体系，覆盖主流高性能公链生态并支持统一 HD 多账户派生。',
      pills: ['Solana Mainnet / Devnet', 'Sui', 'Ed25519 Curve Compatible (Aptos / TON / NEAR / Stellar)'],
    },
    {
      badge: 'HARDWARE + WATCH-ONLY',
      accentClass: 'text-violet-300 border-violet-400/30 bg-violet-500/10',
      titleEn: 'Direct Ledger WebHID + YubiKey + Watch-Only',
      titleZh: '原生兼容 Ledger 硬件钱包、YubiKey 与观察账户',
      descEn:
        'Already own a Ledger? Plug it in via WebHID inside Starlab Extension to manage your Ledger accounts alongside your MPC vaults, plus YubiKey hardware unlock and watch-only tracking.',
      descZh:
        '手里已经有 Ledger？插件内置 WebHID 支持直接连接 Ledger 账户与 MPC 金库同屏管理；同时支持 YubiKey 硬件解锁与任意地址的只读观察账户。',
      pills: ['Ledger WebHID Signer', 'YubiKey Unlock', 'Watch-Only Cold Wallets', 'Air-Gap SD Card Mode'],
    },
  ];

  // --- Callout definitions measured directly on final cropped WebP screenshots ---

  const extWelcomeCallouts: Callout[] = [
    {
      id: 1,
      x: 11,
      y: 47,
      w: 78,
      h: 25,
      anchor: 'tl',
      tone: 'violet',
      labelEn: 'YubiKey or Local Password Protection',
      labelZh: '支持 YubiKey 硬件解锁或本地密码',
      detailEn: 'Protects only this browser’s encrypted key share — never the full private key.',
      detailZh: '仅保护当前浏览器内的加密分片，任何单台设备都无法单独动用资产。',
    },
    {
      id: 2,
      x: 6,
      y: 74,
      w: 88,
      h: 12,
      anchor: 'tl',
      tone: 'accent',
      labelEn: 'Click “Get started”',
      labelZh: '点击「Get started」开始初始化',
      detailEn: 'Set your unlock method and enter the MPC wallet setup wizard.',
      detailZh: '设置解锁方式后即可发起或加入多设备钱包。',
    },
  ];

  const desktopConnectionCallouts: Callout[] = [
    {
      id: 1,
      x: 86,
      y: 2,
      w: 13.5,
      h: 8,
      anchor: 'bl',
      tone: 'neon',
      labelEn: 'Online & Ready Indicator',
      labelZh: '在线状态与设备标识',
      detailEn: 'Green dot confirms WebSocket reachability to the signaling relay.',
      detailZh: '绿点表示已连通中继房间，仅用于交换加密握手的信令消息。',
    },
    {
      id: 2,
      x: 24,
      y: 18.5,
      w: 73.5,
      h: 21,
      anchor: 'tr',
      tone: 'accent',
      labelEn: 'Signal Server & Shared Room ID',
      labelZh: '信令地址与共享房间号（Room ID）',
      detailEn: 'Enter the exact same Room ID on both Desktop and Chrome Extension so they discover each other.',
      detailZh: '在桌面端与浏览器插件中填写相同房间号（支持自建信令服务器），双方自动发现。',
    },
    {
      id: 3,
      x: 24,
      y: 50.8,
      w: 13.5,
      h: 4.2,
      anchor: 'br',
      tone: 'violet',
      labelEn: 'Secure Setup Ready (Safe Primes)',
      labelZh: '安全素数预计算完成',
      detailEn: 'ECDSA safe primes are pre-generated locally in the background for fast keygen.',
      detailZh: '后台自动完成门限 ECDSA 所需安全素数预生成，创建钱包无需漫长等待。',
    },
  ];

  const extConfigureCallouts: Callout[] = [
    {
      id: 1,
      x: 6,
      y: 31,
      w: 82,
      h: 6.5,
      anchor: 'tl',
      tone: 'neon',
      labelEn: 'Multi-Curve Keys Generated Together',
      labelZh: '一次 DKG 自动覆盖全部主流公链曲线',
      detailEn: 'Generates secp256k1 ECDSA (All EVM chains), secp256k1 Taproot (Bitcoin), and Ed25519 (Solana / Sui) in one go.',
      detailZh: '一次建库同步生成全 EVM 链（ETH/ARB/OP/Base/Polygon/BSC 等）、Bitcoin Taproot、Solana 与 Sui 密钥。',
    },
    {
      id: 2,
      x: 6,
      y: 43,
      w: 88,
      h: 8.5,
      anchor: 'tl',
      tone: 'violet',
      labelEn: 'Name Your Shared Vault',
      labelZh: '为金库命名（例如 Treasury）',
      detailEn: 'Helps distinguish personal vaults, team treasuries, or DeFi accounts.',
      detailZh: '方便区分个人日常钱包、团队金库或长期冷存储账户。',
    },
    {
      id: 3,
      x: 5,
      y: 56,
      w: 90,
      h: 11,
      anchor: 'tr',
      tone: 'accent',
      labelEn: 'Set Threshold Policy (t-of-n)',
      labelZh: '自定义门限规则（如 2-of-2 或 2-of-3）',
      detailEn: 'Total devices = n, Needed to sign = t. Use 2-of-3 if you want to tolerate losing any 1 device.',
      detailZh: 'Total devices 为总设备数 n，Needed to sign 为签名门限 t；大额资产推荐 2-of-3（丢一台仍可签发）。',
    },
    {
      id: 4,
      x: 28,
      y: 86,
      w: 66,
      h: 7.5,
      anchor: 'tl',
      tone: 'accent',
      labelEn: 'Click “Invite devices”',
      labelZh: '点击「Invite devices」广播邀请',
      detailEn: 'Publishes a temporary DKG invite inside your room so Desktop can join in one click.',
      detailZh: '在当前房间发布一次性 DKG 邀请，桌面端可直接点选加入。',
    },
  ];

  const extInviteCallouts: Callout[] = [
    {
      id: 1,
      x: 6,
      y: 39,
      w: 88,
      h: 19,
      anchor: 'tl',
      tone: 'neon',
      labelEn: 'Live Join Counter & Invite Code',
      labelZh: '实时入组进度与邀请码复制',
      detailEn: 'Shows joined peers in real time; click “Copy invite” if pairing across separate networks.',
      detailZh: '实时显示已加入设备数，也可一键复制邀请 ID 手动粘贴给其他设备。',
    },
    {
      id: 2,
      x: 6,
      y: 69,
      w: 88,
      h: 10,
      anchor: 'tl',
      tone: 'violet',
      labelEn: 'Automatic P2P DKG Start',
      labelZh: '全员到齐自动启动 DKG 计算',
      detailEn: 'As soon as every device joins, encrypted WebRTC channels open and DKG rounds begin automatically.',
      detailZh: '所有参与设备加入后，自动建立 WebRTC 端到端直连并跑完 Round 1 / Round 2 协议。',
    },
  ];

  const desktopJoinCallouts: Callout[] = [
    {
      id: 1,
      x: 62.5,
      y: 25.5,
      w: 35,
      h: 8,
      anchor: 'tl',
      tone: 'neon',
      labelEn: 'One-Click Incoming Invite',
      labelZh: '一键选中房间内的创建邀请',
      detailEn: 'Desktop automatically detects the extension’s invite and fills in the Invite ID.',
      detailZh: '桌面端自动捕获浏览器插件发出的邀请，点击即可自动填充 Invite ID。',
    },
    {
      id: 2,
      x: 62.5,
      y: 47.5,
      w: 35,
      h: 7.5,
      anchor: 'tl',
      tone: 'violet',
      labelEn: 'Set Independent Local Password',
      labelZh: '设置桌面端独立的本地加密口令',
      detailEn: 'Encrypts only this device’s key share with PBKDF2 + AES-256-GCM.',
      detailZh: '使用 PBKDF2 + AES-256-GCM 独立加密本机分片，建议与插件端使用不同密码。',
    },
    {
      id: 3,
      x: 88,
      y: 58.5,
      w: 9.5,
      h: 7,
      anchor: 'tl',
      tone: 'accent',
      labelEn: 'Click “Join wallet”',
      labelZh: '点击「Join wallet」加入协同建库',
      detailEn: 'Starts the multi-round FROST + CGGMP24 distributed key generation ceremony.',
      detailZh: '立即开始多轮 FROST + CGGMP24 分布式密钥生成协议。',
    },
  ];

  const desktopDkgCallouts: Callout[] = [
    {
      id: 1,
      x: 24,
      y: 24.5,
      w: 62,
      h: 7.5,
      anchor: 'tr',
      tone: 'neon',
      labelEn: 'Live Cryptographic DKG Stepper',
      labelZh: '实时四阶段 DKG 安全协议进度',
      detailEn: 'Connect devices → Secure setup → Create wallet → Ready. Keep all devices online (~1–2 min).',
      detailZh: '设备互联 → 安全初始化 → 协同计算分片 → 就绪，保持参与设备在线约 1–2 分钟即可完成。',
    },
    {
      id: 2,
      x: 24,
      y: 46,
      w: 73,
      h: 18,
      anchor: 'tr',
      tone: 'accent',
      labelEn: 'Verified 2-of-2 Peer Roster',
      labelZh: '已核验的 2-of-2 协同设备清单',
      detailEn: 'Each device derives its own secret share locally — the full private key is never assembled.',
      detailZh: '每台设备各自独立计算并保存自己的分片，完整私钥在内存中从未出现过。',
    },
  ];

  const extHomeCallouts: Callout[] = [
    {
      id: 1,
      x: 3,
      y: 11,
      w: 94,
      h: 9,
      anchor: 'tl',
      tone: 'neon',
      labelEn: 'Active Vault & Verified On-Chain Address',
      labelZh: '当前激活金库与链上地址',
      detailEn: 'Displays Treasury’s EVM address (0xc35f...8961) — identical across Ethereum, Arbitrum, Base, Polygon, Optimism, BSC & Desktop.',
      detailZh: '展示 Treasury 的 EVM 地址 0xc35f...8961——在以太坊、Arbitrum、Base、Polygon、BSC 等所有 EVM 链以及桌面端完全一致。',
    },
    {
      id: 2,
      x: 54,
      y: 22,
      w: 43,
      h: 5,
      anchor: 'tr',
      tone: 'violet',
      labelEn: 'Network Switcher & Peer Online Badge',
      labelZh: '全链网络切换与协签在线状态',
      detailEn: 'Switch networks (Ethereum, Arbitrum, Base, Optimism, Polygon, Bitcoin, Solana, Sui + custom RPCs) and see live peer status.',
      detailZh: '一键切换 Ethereum / Arbitrum / Base / Optimism / Polygon / Bitcoin / Solana / Sui 及自定义 RPC，绿点表示协签通道在线。',
    },
    {
      id: 3,
      x: 3,
      y: 28,
      w: 94,
      h: 24,
      anchor: 'tl',
      tone: 'accent',
      labelEn: 'HD Multi-Account & 1-Click Copy Address',
      labelZh: 'HD 多账户派生、2-of-2 标识与一键收款',
      detailEn: 'Derive Account 0, 1, 2… without new DKG rounds (public-only HD math); click Copy address to receive.',
      detailZh: '支持 BIP-44/86 无交互派生多个子账户，点击「Copy address」即可安全收款（收款无需第二台设备在线）。',
    },
    {
      id: 4,
      x: 51,
      y: 58,
      w: 46,
      h: 14,
      anchor: 'tl',
      tone: 'neon',
      labelEn: 'Launch Co-Signing or Connect Ledger',
      labelZh: '发起门限多签 / 添加 Ledger 与观察账户',
      detailEn: 'Manually co-sign messages here, auto-sign dApp transactions (auto-broadcast), or click below to plug in a Ledger.',
      detailZh: '支持手动签名、dApp 交易自动协同签名+广播，下方还支持接入 Ledger 硬件或只读观察账户。',
    },
  ];

  const desktopSignCallouts: Callout[] = [
    {
      id: 1,
      x: 2,
      y: 18,
      w: 20,
      h: 35,
      anchor: 'tl',
      tone: 'neon',
      labelEn: 'Unified Multi-Chain Vault & HD Accounts',
      labelZh: '同一金库全链地址与 HD 账户选择',
      detailEn: 'Solana, Sui, Bitcoin P2TR (bc1p…), and EVM (0xc35f…) all derive from one threshold vault.',
      detailZh: 'Solana、Sui、Bitcoin Taproot（bc1p…）与全 EVM 地址（0xc35f…）统一管理。',
    },
    {
      id: 2,
      x: 24,
      y: 29,
      w: 22,
      h: 8,
      anchor: 'tr',
      tone: 'violet',
      labelEn: 'Choose Signing Curve / Chain',
      labelZh: '选择签名公链（EVM ECDSA / BTC Taproot）',
      detailEn: 'EVM chains use CGGMP24 threshold ECDSA; Bitcoin uses BIP-340 Taproot FROST Schnorr.',
      detailZh: '所有 EVM 链均使用 CGGMP24 门限 ECDSA，比特币使用 BIP-340 Taproot FROST 签名。',
    },
    {
      id: 3,
      x: 24,
      y: 40,
      w: 30,
      h: 5,
      anchor: 'tr',
      tone: 'accent',
      labelEn: 'Verify Identical Signing Address',
      labelZh: '核对与插件端一致的签名地址',
      detailEn: 'Always verify 0xc35ff126…8961 matches the target account before entering your local share password.',
      detailZh: '签名前务必核对发件地址与待签十六进制摘要，确认无误后再输入本机分片密码。',
    },
    {
      id: 4,
      x: 83.5,
      y: 71,
      w: 14,
      h: 7,
      anchor: 'tr',
      tone: 'accent',
      labelEn: 'Click “Request signature”',
      labelZh: '点击「Request signature」广播审批请求',
      detailEn: 'Pushes a live signing prompt to paired co-signers; outputs standard on-chain signature once threshold approves.',
      detailZh: '向协签设备推送实时审批弹窗，凑齐门限后产出标准签名，随后即可广播上链。',
    },
  ];

  const desktopBackupCallouts: Callout[] = [
    {
      id: 1,
      x: 24,
      y: 18.5,
      w: 54,
      h: 4.5,
      anchor: 'tr',
      tone: 'neon',
      labelEn: 'Share-Only Security Guarantee',
      labelZh: '分片备份机制：不含完整私钥',
      detailEn: 'Even if an attacker copies this encrypted backup file, a single share cannot spend funds.',
      detailZh: '即使备份文件不慎泄露，单份分片既加密又未达门限，攻击者依然无法盗币。',
    },
    {
      id: 2,
      x: 24,
      y: 31,
      w: 73,
      h: 7.5,
      anchor: 'tr',
      tone: 'violet',
      labelEn: 'Unlock with Key Share Password',
      labelZh: '输入本机分片加密密码',
      detailEn: 'Authenticates the local encrypted keystore (v2 PBKDF2 + AES-256-GCM) before export or restore.',
      detailZh: '导出前验证本机密钥库口令，或在换机时输入原密码一键恢复。',
    },
    {
      id: 3,
      x: 24,
      y: 39.8,
      w: 28,
      h: 7.5,
      anchor: 'br',
      tone: 'accent',
      labelEn: 'Export or Restore Key Share',
      labelZh: '导出离线备份 / 在新设备导入恢复',
      detailEn: 'Save each device’s encrypted JSON on separate offline USB/SD storage for disaster recovery.',
      detailZh: '建议将不同设备的加密分片分别存于离线 U 盘或 SD 卡，物理隔离更安心。',
    },
  ];

  const comparisons = [
    {
      metricEn: 'Seed Phrase Single-Point Risk',
      metricZh: '助记词单点泄露 / 丢失风险',
      seedEn: 'High — 12 words stolen = 100% drained',
      seedZh: '极高 — 12 个词被拍/被偷即资产归零',
      hwEn: 'Medium — paper seed still a single point',
      hwZh: '中等 — 纸质助记词仍是单点风险',
      mpcEn: 'Eliminated — DKG never creates a seed phrase',
      mpcZh: '彻底消除 — DKG 从未生成过完整私钥与助记词',
    },
    {
      metricEn: 'Supported Chains & Curves',
      metricZh: '支持公链范围（对标 Ledger）',
      seedEn: 'Often locked to a single ecosystem (EVM-only or SOL-only)',
      seedZh: '常局限于单一生态（仅 EVM 或仅 Solana）',
      hwEn: 'Broad (secp256k1 + Ed25519), requires installing chain apps',
      hwZh: '广（secp256k1 + Ed25519），需反复装卸各链固件 App',
      mpcEn: 'Ledger-level coverage: 100+ EVM + BTC Taproot + SOL + SUI + Ledger WebHID',
      mpcZh: '与 Ledger 同级曲线覆盖：100+ EVM 链 + BTC + SOL + SUI，且兼容接入 Ledger',
    },
    {
      metricEn: 'Multi-Sig Gas Fee & Privacy',
      metricZh: '多签 Gas 费用与链上隐私',
      seedEn: 'Single-sig only (no native multisig)',
      seedZh: '仅单签，无原生多签保护',
      hwEn: 'Contract multisig costs extra Gas & exposes signers',
      hwZh: '配合 Safe 合约多签 Gas 贵且链上暴露管理员',
      mpcEn: 'Off-chain threshold signature = lowest single-sig Gas & zero exposure',
      mpcZh: '链下门限协同 = 普通单签最低 Gas，链上完全隐藏多签结构',
    },
    {
      metricEn: 'Malware / Phishing Protection',
      metricZh: '防电脑木马 / 浏览器恶意插件',
      seedEn: 'Low — compromised browser drains silently',
      seedZh: '弱 — 电脑中毒可能被直接盗签',
      hwEn: 'High — physical button required',
      hwZh: '高 — 需物理按键确认',
      mpcEn: 'High — requires threshold approval across separate devices',
      mpcZh: '高 — 单台设备中毒无法凑齐门限签名，另一端可直接拒绝',
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

  const faqs = [
    {
      qEn: 'Does Starlab really support as many chains as Ledger?',
      qZh: '真的和 Ledger 支持的链一样多吗？具体支持哪些链？',
      aEn: 'Yes — at the cryptographic layer, Ledger secures the vast majority of crypto assets using two curves: secp256k1 (all EVM chains + Bitcoin) and Ed25519 (Solana, Sui, Aptos, TON, NEAR, etc.). Starlab MPC implements threshold cryptography across the exact same curves: one vault unlocks Ethereum + Arbitrum + Optimism + Base + Polygon + BNB Chain + Avalanche + ANY custom EVM RPC (100+ chains with the same 0x address), Bitcoin Taproot (bc1p…), Solana, and Sui. Plus, you can even connect a physical Ledger via WebHID inside the extension.',
      aZh: '是的！硬件钱包（如 Ledger）能支持上百条公链的核心原因，是底层支持 secp256k1 和 Ed25519 两条椭圆曲线。Starlab MPC 用门限密码学完整覆盖了这两条曲线：一次创建即可同时使用所有 EVM 链（内置 Ethereum、Arbitrum、Optimism、Base、Polygon、BNB Chain、Avalanche 并支持任意自定义 EVM RPC，上百条链共用同一个 0x 地址）、Bitcoin Taproot（bc1p…）、Solana 与 Sui；并且插件原生支持 WebHID 直连 Ledger 硬件钱包统一管理。',
    },
    {
      qEn: 'What is the difference between DKG, Multi-Sig, and Broadcasting?',
      qZh: '小白还是有点晕：DKG、多签、广播三者到底分别在什么时候发生？',
      aEn: 'Think of it like opening and using a joint bank vault: (1) DKG happens ONCE when you create the wallet — devices cooperatively generate split key shares and your public addresses, with zero seed phrase. (2) Threshold Multi-Sig happens EVERY TIME you spend or sign — at least t devices review the transaction and jointly calculate a cryptographic signature. (3) Broadcasting happens RIGHT AFTER signing — the signed raw transaction is submitted to the blockchain’s RPC node (eth_sendRawTransaction / mempool) so miners/validators include it in a block. In the Chrome Extension, signing and broadcasting happen seamlessly in one flow.',
      aZh: '可以类比「开联名保险柜」的三件事：① DKG 只在【创建钱包时】跑一次，多台设备隔空算出各自加密分片和所有链的收款地址（没有助记词）；② 门限多签在【每次转账/授权时】发生，至少 t 台设备核对金额和收款人后联合算出合法签名；③ 广播紧跟在【签完名之后】，把带签名的原始交易发给区块链节点（RPC）打包上链。日常在 Chrome 插件转账或用 dApp 时，签完名插件会自动帮你广播上链，无需手动操作。',
    },
    {
      qEn: 'What happens if I lose one device or reinstall Chrome?',
      qZh: '如果我的某一台设备坏了，或者不小心重装了浏览器怎么办？',
      aEn: 'First, always export each device’s encrypted key share backup (Step 5) to separate offline storage so you can restore it on a new device immediately. Second, for high-value holdings we strongly recommend creating a 2-of-3 vault (e.g., Chrome Extension + Desktop + Spare Laptop/Air-Gapped Device): even if one device is permanently lost, the remaining two still sign normally.',
      aZh: '首先，完成 Step 5 的「分片加密备份」后，只需在新设备导入对应加密 JSON 文件并输入密码即可原地恢复。其次，对于大额资产强烈建议创建 2-of-3 金库（如插件 + 常用电脑 + 备用设备）：即使永久丢失任意一台设备，其余两台依然可以正常协同签名转移资产。',
    },
    {
      qEn: 'Can StarsLab or the signal server see my private keys or broadcast unauthorized transactions?',
      qZh: 'StarsLab 官方或信令服务器能看到我的私钥、或者偷偷帮我广播交易吗？',
      aEn: 'Never. All FROST and CGGMP24 cryptographic rounds execute strictly inside your local devices (native Rust on Desktop, compiled Rust→WASM in the Extension) over direct WebRTC data channels. The signaling server only relays room membership and WebRTC SDP handshakes — it never receives key shares and cannot forge a signature. You can also self-host your own signal server in 1 minute from our open-source repo.',
      aZh: '绝无可能。所有 FROST 与 CGGMP24 密码学计算都在你的本地设备内完成（桌面端为原生 Rust，插件端为本地 WASM 沙箱），关键协议消息通过 WebRTC 端到端直连传输。信令服务器只负责房间发现与握手转发，拿不到任何分片，更无法伪造签名或擅自广播交易；你也可以 1 分钟自建私有信令服务器。',
    },
    {
      qEn: 'Is Starlab MPC 100% open source and verifiable?',
      qZh: '代码完全开源吗？我可以自己编译审计吗？',
      aEn: 'Yes. The Rust MPC core (stars-labs/starlab-mpc), Iced Desktop app (stars-labs/starlab-desktop), and Chrome Extension (stars-labs/starlab-wallet) are all publicly open source on GitHub, built on ZCash’s frost-core 3.0 and audited CGGMP24 primitives, with full CLI conformance tests.',
      aZh: '100% 开源可审计。核心密码学库（stars-labs/starlab-mpc）、跨平台桌面端（stars-labs/starlab-desktop）及浏览器插件（stars-labs/starlab-wallet）全部托管于 GitHub，底层基于 ZCash frost-core 3.0 与 CGGMP24 实现，支持本地自行编译与验证。',
    },
  ];
</script>

<div class="relative min-h-screen bg-brand-bg text-white pt-16 overflow-x-clip">
  <!-- Ambient radial glow backdrop -->
  <div
    class="pointer-events-none fixed inset-0 opacity-40"
    style="background: radial-gradient(circle at 18% 12%, rgba(233, 69, 96, 0.22), transparent 42%), radial-gradient(circle at 82% 24%, rgba(0, 255, 255, 0.16), transparent 40%), radial-gradient(circle at 50% 80%, rgba(124, 58, 237, 0.16), transparent 45%);"
  ></div>

  <!-- HERO SECTION -->
  <section class="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-14 md:pt-20 pb-16">
    <div class="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
      <!-- Hero copy -->
      <div class="lg:col-span-6 space-y-6">
        <div
          class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-brand-neon/30 text-xs font-mono text-brand-neon tracking-wide"
        >
          <span class="w-2 h-2 rounded-full bg-brand-neon animate-pulse"></span>
          {$locale === 'zh'
            ? 'STARLAB MPC 钱包 · 与 Ledger 同级全链覆盖 · 零助记词'
            : 'STARLAB MPC WALLET · LEDGER-SCALE MULTI-CHAIN · ZERO SEED'}
        </div>

        <h1 class="text-4xl sm:text-5xl lg:text-[3.35rem] font-extrabold tracking-tight leading-[1.12]">
          {#if $locale === 'zh'}
            告别助记词：<br />
            <span class="gradient-text">私钥从未完整存在</span><br />
            全链金库一网打尽
          {:else}
            Zero Seed Phrases.<br />
            <span class="gradient-text">Ledger-Scale Multi-Chain</span><br />
            Threshold Custody.
          {/if}
        </h1>

        <p class="text-base sm:text-lg text-white/75 leading-relaxed max-w-xl">
          {#if $locale === 'zh'}
            用你手头的 <strong>桌面端 + Chrome 插件</strong>，5 分钟搭建企业级 <strong>2-of-2 / 2-of-3 MPC 金库</strong>。底层覆盖与 <strong>Ledger 硬件钱包同级</strong> 的 <code>secp256k1 + Ed25519</code> 曲线体系——<strong>100+ EVM 链（ETH/ARB/OP/Base/Polygon/BSC/自定义 RPC）+ Bitcoin Taproot + Solana + Sui</strong> 全支持，更附<strong>零基础小白完整教材</strong>（DKG · 门限多签 · 广播上链全讲透）。
          {:else}
            Turn your existing <strong>Desktop + Chrome Extension</strong> into a self-custodial <strong>2-of-2 or 2-of-3 MPC vault</strong> in 5 minutes. Powered by the exact same <code>secp256k1 + Ed25519</code> curve foundation as <strong>Ledger</strong> — covering <strong>100+ EVM chains + Bitcoin Taproot + Solana + Sui</strong> — with a complete beginner-friendly visual guide to <strong>DKG, Multi-Sig, and Broadcasting</strong>.
          {/if}
        </p>

        <!-- Primary CTAs -->
        <div class="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            on:click={() => scrollToStep('concepts')}
            class="px-6 py-3.5 rounded-xl bg-brand-accent text-white font-semibold text-sm sm:text-base shadow-[0_10px_30px_rgba(233,69,96,0.35)] hover:brightness-110 transition cursor-pointer"
          >
            {$locale === 'zh' ? '从零开始学：小白完整教材 ↓' : 'Start Beginner Guide (DKG → Broadcast) ↓'}
          </button>
          <a
            href="https://github.com/stars-labs/starlab-desktop/releases"
            target="_blank"
            rel="noopener noreferrer"
            class="px-5 py-3.5 rounded-xl bg-white/8 hover:bg-white/14 border border-white/15 text-white font-medium text-sm sm:text-base transition"
          >
            {$locale === 'zh' ? '下载桌面端' : 'Get Desktop App'} &nearr;
          </a>
          <a
            href="https://github.com/stars-labs/starlab-wallet/releases"
            target="_blank"
            rel="noopener noreferrer"
            class="px-5 py-3.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-400/35 text-violet-200 font-medium text-sm sm:text-base transition"
          >
            {$locale === 'zh' ? '安装 Chrome 插件' : 'Chrome Extension'} &nearr;
          </a>
        </div>

        <!-- Live verified address pill -->
        <div class="pt-1 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/60 font-mono">
          <span class="flex items-center gap-1.5">
            <span class="text-emerald-400">✓</span>
            {$locale === 'zh' ? '100+ EVM + BTC + SOL + SUI' : '100+ EVM + BTC + SOL + SUI'}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="text-emerald-400">✓</span>
            {$locale === 'zh' ? 'DKG / 多签 / 广播全图解' : 'DKG · Multi-Sig · Broadcast Explained'}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="text-emerald-400">✓</span>
            {$locale === 'zh' ? '兼容 Ledger WebHID & YubiKey' : 'Ledger WebHID & YubiKey Ready'}
          </span>
        </div>
      </div>

      <!-- Hero visual showcase: live Desktop + Extension pair -->
      <div class="lg:col-span-6">
        <div class="relative">
          <!-- Main Desktop frame -->
          <div class="rounded-2xl border border-white/15 bg-[#101626] shadow-[0_30px_90px_rgba(0,0,0,0.65)] overflow-hidden">
            <div class="flex items-center justify-between px-4 py-2.5 bg-black/40 border-b border-white/10">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></span>
                <span class="ml-2 text-xs font-mono text-white/60">Starlab Desktop · 2-of-2 Co-Signer</span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                ● 0xc35f...8961
              </span>
            </div>
            <img
              src="/wallet-guide/desktop-sign.webp"
              alt="Starlab Desktop 2-of-2 multi-chain vault"
              class="w-full h-auto block"
            />
          </div>

          <!-- Floating Chrome Extension overlay card on desktop widths -->
          <div
            class="hidden sm:block sm:w-[210px] md:w-[235px] lg:w-[215px] xl:w-[240px] sm:absolute -bottom-8 -right-4 rounded-2xl border border-violet-400/40 bg-[#14182a] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden ring-1 ring-white/10"
          >
            <div class="px-3 py-1.5 bg-violet-600/25 border-b border-white/10 flex items-center justify-between">
              <span class="text-[10px] font-mono text-violet-200">Chrome Extension</span>
              <span class="text-[10px] font-mono text-emerald-300">● 2-of-2</span>
            </div>
            <img
              src="/wallet-guide/ext-home.webp"
              alt="Starlab Chrome Extension synced 2-of-2 wallet"
              class="w-full h-auto block"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 4 Trust Stat Badges -->
    <div class="mt-16 sm:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="rounded-2xl p-5 bg-brand-surface/65 border border-white/10">
        <div class="text-xs font-mono uppercase tracking-wider text-brand-neon mb-1">SECP256K1 + ED25519</div>
        <div class="text-lg font-bold text-white">
          {$locale === 'zh' ? '与 Ledger 同级全链覆盖' : 'Ledger-Level Chain Coverage'}
        </div>
        <p class="text-xs text-white/60 mt-1">
          {$locale === 'zh'
            ? '100+ EVM 链 + Bitcoin Taproot + Solana + Sui，一库全通'
            : '100+ EVM networks + Bitcoin Taproot + Solana + Sui from one vault'}
        </p>
      </div>
      <div class="rounded-2xl p-5 bg-brand-surface/65 border border-white/10">
        <div class="text-xs font-mono uppercase tracking-wider text-brand-accent mb-1">FROST + CGGMP24</div>
        <div class="text-lg font-bold text-white">
          {$locale === 'zh' ? '无助记词分布式密钥' : 'Zero-Seed DKG + Multi-Sig'}
        </div>
        <p class="text-xs text-white/60 mt-1">
          {$locale === 'zh'
            ? '链下门限协同签名，链上普通单签最低 Gas'
            : 'Off-chain threshold signing with lowest single-sig gas fees'}
        </p>
      </div>
      <div class="rounded-2xl p-5 bg-brand-surface/65 border border-white/10">
        <div class="text-xs font-mono uppercase tracking-wider text-violet-300 mb-1">AUTO + OFFLINE BROADCAST</div>
        <div class="text-lg font-bold text-white">
          {$locale === 'zh' ? '一键自动广播 + 离线冷签' : 'Auto RPC + Air-Gap Broadcast'}
        </div>
        <p class="text-xs text-white/60 mt-1">
          {$locale === 'zh'
            ? 'dApp / 插件签完自动广播上链，也支持 SD 卡离线签名'
            : 'Instant RPC broadcast after co-signing, plus offline SD-card signing'}
        </p>
      </div>
      <div class="rounded-2xl p-5 bg-brand-surface/65 border border-white/10">
        <div class="text-xs font-mono uppercase tracking-wider text-emerald-300 mb-1">100% OPEN SOURCE</div>
        <div class="text-lg font-bold text-white">
          {$locale === 'zh' ? '全栈 Rust + WASM 开源' : 'Verifiable Rust + WASM'}
        </div>
        <p class="text-xs text-white/60 mt-1">
          {$locale === 'zh'
            ? '核心库、桌面端、插件端与信令服务代码全部公开可审'
            : 'Core engine, Desktop, Extension & Signal Server fully public on GitHub'}
        </p>
      </div>
    </div>
  </section>

  <!-- STICKY NAVIGATOR -->
  <div class="sticky top-16 z-40 backdrop-blur-md bg-[#0f141e]/88 border-y border-white/10">
    <div class="max-w-7xl mx-auto px-4 md:px-10 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
      <span class="text-xs font-mono text-white/45 uppercase tracking-wider mr-1 shrink-0 hidden md:inline">
        {$locale === 'zh' ? '目录：' : 'SECTIONS:'}
      </span>
      {#each stepsNav as st}
        <button
          type="button"
          on:click={() => scrollToStep(st.id)}
          class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white/5 hover:bg-brand-accent/20 text-white/80 hover:text-white border border-white/10 hover:border-brand-accent/40 transition shrink-0 cursor-pointer"
        >
          <span class="font-mono text-brand-neon text-xs">{st.num}</span>
          <span>{$locale === 'zh' ? st.zh : st.en}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- FULL CHAIN COVERAGE SECTION (LEDGER-SCALE) -->
  <section id="chains" class="relative z-10 scroll-mt-36 max-w-7xl mx-auto px-6 md:px-10 pt-16 pb-10 space-y-8">
    <div class="max-w-3xl space-y-3">
      <p class="text-xs font-mono uppercase tracking-widest text-brand-neon">
        {$locale === 'zh' ? '不止 4 条链 · 与 LEDGER 同级多链覆盖' : 'FAR MORE THAN 4 CHAINS · LEDGER-SCALE ECOSYSTEM'}
      </p>
      <h2 class="text-2xl sm:text-4xl font-bold leading-tight">
        {$locale === 'zh'
          ? '一套 MPC 密钥体系，覆盖 Ledger 同级全主流公链'
          : 'One Threshold Curve Stack — Every Major Chain Ledger Supports'}
      </h2>
      <p class="text-sm sm:text-base text-white/70 leading-relaxed">
        {#if $locale === 'zh'}
          Ledger 之所以能支持上百条公链，本质上是底层支持了 <strong>secp256k1</strong> 与 <strong>Ed25519</strong> 两条密码学曲线。Starlab MPC 用<strong>门限密码学</strong>完整覆盖了同样的曲线底座——<strong>一次创建，全 EVM 生态上百条链（含自定义 RPC）、Bitcoin Taproot、Solana、Sui 全部打通</strong>，并且插件还支持直接接入你现有的 Ledger 硬件钱包！
        {:else}
          Ledger supports hundreds of networks because virtually all major blockchains run on two elliptic curves: <strong>secp256k1</strong> and <strong>Ed25519</strong>. Starlab MPC implements threshold signing across the exact same curves — unlocking <strong>100+ EVM networks (plus any custom RPC), Bitcoin Taproot, Solana, and Sui</strong> from a single vault, while also letting you plug in your existing Ledger via WebHID.
        {/if}
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      {#each chainFamilies as fam}
        <div class="rounded-2xl p-6 bg-[#121826]/90 border border-white/10 hover:border-white/20 transition space-y-4">
          <span class="inline-block px-2.5 py-1 rounded-md text-[11px] font-mono border {fam.accentClass}">
            {fam.badge}
          </span>
          <h3 class="text-xl font-bold text-white">
            {$locale === 'zh' ? fam.titleZh : fam.titleEn}
          </h3>
          <p class="text-sm text-white/70 leading-relaxed">
            {$locale === 'zh' ? fam.descZh : fam.descEn}
          </p>
          <div class="flex flex-wrap gap-2 pt-1">
            {#each fam.pills as pill}
              <span class="px-2.5 py-1 rounded-lg text-xs font-mono bg-black/40 border border-white/10 text-white/80">
                {pill}
              </span>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- BEGINNER FUNDAMENTALS ACADEMY: DKG · MULTI-SIG · BROADCAST -->
  <section id="concepts" class="relative z-10 scroll-mt-36 max-w-7xl mx-auto px-6 md:px-10 py-14 space-y-8">
    <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      <div class="max-w-3xl space-y-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-brand-accent/20 text-brand-accent border border-brand-accent/40">
          {$locale === 'zh' ? 'STEP 00 · 零基础小白必修课' : 'STEP 00 · BEGINNER MASTERCLASS'}
        </div>
        <h2 class="text-2xl sm:text-4xl font-bold">
          {$locale === 'zh'
            ? '3 分钟彻底讲透：DKG、门限多签、交易广播'
            : 'Master the 3 Core Concepts in 3 Minutes: DKG, Multi-Sig & Broadcast'}
        </h2>
        <p class="text-sm sm:text-base text-white/70 leading-relaxed">
          {$locale === 'zh'
            ? '哪怕你是第一次听说 MPC 钱包，下面这三张白话卡片也能让你彻底搞明白「钱包怎么生出来的 → 转账怎么多设备签字 → 签完名怎么真正广播上链」。'
            : 'New to MPC wallets? These three plain-English lessons explain exactly how keys are born without a seed phrase (DKG), how devices co-sign (Multi-Sig), and how signed transactions land on-chain (Broadcast).'}
        </p>
      </div>

      <!-- Interactive lesson tabs -->
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          on:click={() => (activeLesson = 'dkg')}
          class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition cursor-pointer {activeLesson === 'dkg'
            ? 'bg-brand-neon/15 text-brand-neon border-brand-neon/50 shadow-[0_0_20px_rgba(0,255,255,0.15)]'
            : 'bg-white/5 text-white/70 border-white/10 hover:text-white'}"
        >
          1. {$locale === 'zh' ? '什么是 DKG（建库）' : 'What is DKG?'}
        </button>
        <button
          type="button"
          on:click={() => (activeLesson = 'multisig')}
          class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition cursor-pointer {activeLesson === 'multisig'
            ? 'bg-violet-500/20 text-violet-200 border-violet-400/50 shadow-[0_0_20px_rgba(167,139,250,0.2)]'
            : 'bg-white/5 text-white/70 border-white/10 hover:text-white'}"
        >
          2. {$locale === 'zh' ? '什么是门限多签' : 'Threshold Multi-Sig'}
        </button>
        <button
          type="button"
          on:click={() => (activeLesson = 'broadcast')}
          class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition cursor-pointer {activeLesson === 'broadcast'
            ? 'bg-brand-accent/20 text-brand-accent border-brand-accent/50 shadow-[0_0_20px_rgba(233,69,96,0.2)]'
            : 'bg-white/5 text-white/70 border-white/10 hover:text-white'}"
        >
          3. {$locale === 'zh' ? '什么是交易广播上链' : 'Transaction Broadcast'}
        </button>
      </div>
    </div>

    <!-- Lesson 1: DKG -->
    {#if activeLesson === 'dkg'}
      <div class="rounded-3xl p-6 sm:p-8 bg-[#121826]/95 border border-brand-neon/30 shadow-2xl space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span class="text-xs font-mono text-brand-neon uppercase tracking-wider">LESSON 01 · DISTRIBUTED KEY GENERATION</span>
            <h3 class="text-xl sm:text-2xl font-bold mt-1">
              {$locale === 'zh'
                ? '什么是 DKG（分布式密钥生成）？为什么压根没有 12 个助记词？'
                : 'What is DKG (Distributed Key Generation)? Why No Seed Phrase?'}
            </h3>
          </div>
          <span class="px-3 py-1.5 rounded-lg text-xs font-mono bg-brand-neon/10 text-brand-neon border border-brand-neon/30 shrink-0">
            {$locale === 'zh' ? '仅在创建钱包时运行 1 次' : 'Runs ONCE at Wallet Creation'}
          </span>
        </div>

        <!-- Plain-English Analogy -->
        <div class="rounded-2xl p-5 bg-black/35 border border-white/10 text-sm text-white/85 leading-relaxed">
          <strong class="text-brand-neon">
            {$locale === 'zh' ? '🎯 一句话白话类比：' : '🎯 Plain-English Analogy:'}
          </strong>
          {#if $locale === 'zh'}
            传统钱包（MetaMask 等）就像<strong>先造出一把完整金库钥匙（12 个助记词）</strong>，谁抄走谁就能把钱搬空；而 <strong>DKG</strong> 是让你的电脑和浏览器插件<strong>隔空做一场密码学协作</strong>——每台设备各自独立算出一块<strong>专属加密分片（Key Share）</strong>，并共同推导出全网公开的收款地址（公钥）。<strong>从始至终，完整私钥从未在任何一台设备的内存、硬盘或网络中存在过！</strong>
          {:else}
            Traditional wallets mint one master key (12 seed words)—anyone who snaps a photo steals everything. <strong>DKG</strong> lets your Desktop and Chrome Extension run an encrypted math ceremony where each device computes only its own private <strong>Key Share</strong> while deriving the exact same public addresses. <strong>The complete private key never exists anywhere—not in RAM, not on disk, not over the network.</strong>
          {/if}
        </div>

        <!-- 4-stage visual diagram -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="rounded-xl p-4 bg-white/[0.03] border border-white/10 space-y-2">
            <div class="text-xs font-mono text-brand-neon">STAGE 1 · SAFE PRIMES</div>
            <h4 class="font-semibold text-white text-sm">{$locale === 'zh' ? '后台预计算安全素数' : 'Pre-Generate Safe Primes'}</h4>
            <p class="text-xs text-white/65 leading-relaxed">
              {$locale === 'zh'
                ? '应用启动后后台自动算好 CGGMP24 门限 ECDSA 所需的安全素数（桌面端约 1.5 分钟），完成后显示 “Secure setup: ready”。'
                : 'Clients pre-compute safe primes in the background (~1.5 min native) for threshold ECDSA, showing “Secure setup: ready”.'}
            </p>
          </div>
          <div class="rounded-xl p-4 bg-white/[0.03] border border-white/10 space-y-2">
            <div class="text-xs font-mono text-brand-neon">STAGE 2 · ROOM & WEBRTC</div>
            <h4 class="font-semibold text-white text-sm">{$locale === 'zh' ? '同房号建立 P2P 直连' : 'Pair via Room → WebRTC P2P'}</h4>
            <p class="text-xs text-white/65 leading-relaxed">
              {$locale === 'zh'
                ? '所有参与设备加入同一个 Room ID 并点选邀请，建立端到端 WebRTC 数据通道（信令服只帮握手，不接触密钥）。'
                : 'All n devices join the same Room ID, accept the invite, and open encrypted direct WebRTC data channels.'}
            </p>
          </div>
          <div class="rounded-xl p-4 bg-white/[0.03] border border-white/10 space-y-2">
            <div class="text-xs font-mono text-brand-neon">STAGE 3 · ROUND 1 & 2</div>
            <h4 class="font-semibold text-white text-sm">{$locale === 'zh' ? '交换加密承诺与多项式' : 'Round 1 & 2 Math Exchange'}</h4>
            <p class="text-xs text-white/65 leading-relaxed">
              {$locale === 'zh'
                ? '同步跑完 FROST（Ed25519 + BTC Taproot）和 CGGMP24（全 EVM 链）协议，互相验证零知识证明防作弊。'
                : 'Runs FROST (Ed25519 + BTC Taproot) and CGGMP24 (All EVM) with zero-knowledge proofs verifying every participant.'}
            </p>
          </div>
          <div class="rounded-xl p-4 bg-white/[0.03] border border-white/10 space-y-2">
            <div class="text-xs font-mono text-brand-neon">STAGE 4 · ENCRYPT SHARE</div>
            <h4 class="font-semibold text-white text-sm">{$locale === 'zh' ? '各自加密保存本机分片' : 'Encrypt Local Share Only'}</h4>
            <p class="text-xs text-white/65 leading-relaxed">
              {$locale === 'zh'
                ? '每台设备用各自独立口令（PBKDF2 + AES-256-GCM）把自己的分片锁进本地 Keystore，所有公链地址立即生效！'
                : 'Each device encrypts only its own share with an independent password (PBKDF2 + AES-256-GCM). Your vault is live!'}
            </p>
          </div>
        </div>

        <!-- Beginner rules for t-of-n -->
        <div class="grid md:grid-cols-2 gap-4 pt-1 text-xs sm:text-sm">
          <div class="rounded-xl p-4 bg-emerald-500/10 border border-emerald-400/25">
            <strong class="text-emerald-300">{$locale === 'zh' ? '✓ 2-of-2 怎么理解？' : '✓ How 2-of-2 works:'}</strong>
            <span class="text-white/75 ml-1">
              {$locale === 'zh'
                ? '共 2 台设备（如插件 + 桌面端），每次转币必须 2 台同时同意。单台电脑中毒无法转币，但务必把两台加密分片分别备份防设备损坏。'
                : '2 devices total, both must approve every spend. Stops single-device hacks; always back up both encrypted shares separately.'}
            </span>
          </div>
          <div class="rounded-xl p-4 bg-amber-500/10 border border-amber-400/25">
            <strong class="text-amber-300">{$locale === 'zh' ? '★ 2-of-3 为什么最适合大额？' : '★ Why 2-of-3 is gold standard:'}</strong>
            <span class="text-white/75 ml-1">
              {$locale === 'zh'
                ? '建库时 3 台设备一起参与 DKG；以后转币任意 2 台同意即可！丢了 1 台不怕冻死资产，被偷 1 台也无法盗币。'
                : '3 devices run DKG together; later ANY 2 can sign. Losing 1 device never freezes funds, and stealing 1 never drains them.'}
            </span>
          </div>
        </div>
      </div>

    <!-- Lesson 2: Threshold Multi-Sig -->
    {:else if activeLesson === 'multisig'}
      <div class="rounded-3xl p-6 sm:p-8 bg-[#121826]/95 border border-violet-400/35 shadow-2xl space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span class="text-xs font-mono text-violet-300 uppercase tracking-wider">LESSON 02 · THRESHOLD MULTI-SIG (CO-SIGNING)</span>
            <h3 class="text-xl sm:text-2xl font-bold mt-1">
              {$locale === 'zh'
                ? '什么是门限多签？为什么比 Safe 合约多签更省钱、更隐私？'
                : 'What is Threshold Multi-Sig? Why Cheaper & More Private Than Safe?'}
            </h3>
          </div>
          <span class="px-3 py-1.5 rounded-lg text-xs font-mono bg-violet-500/15 text-violet-200 border border-violet-400/35 shrink-0">
            {$locale === 'zh' ? '每次转账/授权时触发（约 3~5 秒）' : 'Runs on Every Spend (~3–5 sec)'}
          </span>
        </div>

        <div class="rounded-2xl p-5 bg-black/35 border border-white/10 text-sm text-white/85 leading-relaxed">
          <strong class="text-violet-300">
            {$locale === 'zh' ? '🎯 一句话看懂两种“多签”的区别：' : '🎯 MPC Threshold vs Smart-Contract Multisig:'}
          </strong>
          {#if $locale === 'zh'}
            传统 <strong>Safe 合约多签</strong>是在链上写个智能合约来数“几个人签了字”，所以每条链都要单独花钱部署、每笔转账 Gas 更贵，还不支持比特币原生转账；而 <strong>Starlab MPC 门限多签</strong>是让 <code>t</code> 台设备在<strong>链下</strong>互相配合，<strong>直接算出一个标准单签签名</strong>！链上节点看来跟普通钱包一模一样：<strong>0 合约部署费、全网最低 Gas、全链通用、链上不暴露你的多签人数和设备地址。</strong>
          {:else}
            Smart-contract multisigs (like Safe) deploy a contract per chain, pay higher gas on every tx, expose signer addresses publicly, and don’t work natively on Bitcoin/Solana. <strong>Starlab MPC Threshold Signing</strong> coordinates <code>t</code> devices <strong>off-chain</strong> to produce one standard single-key signature: <strong>$0 deployment cost, lowest single-sig gas, works across EVM/BTC/SOL/SUI, and completely hides your signing policy on-chain.</strong>
          {/if}
        </div>

        <!-- 4-step co-signing sequence -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="rounded-xl p-4 bg-white/[0.03] border border-white/10 space-y-2">
            <div class="text-xs font-mono text-violet-300">STEP 1 · PROPOSE</div>
            <h4 class="font-semibold text-white text-sm">{$locale === 'zh' ? '发起签名会话' : 'Create Signing Session'}</h4>
            <p class="text-xs text-white/65 leading-relaxed">
              {$locale === 'zh'
                ? '在插件点转账、dApp 点确认，或在桌面端填好摘要后，发起方创建一个全新一次性会话（sign_...）并发送给房间。'
                : 'Clicking Send, approving a dApp, or requesting a signature on Desktop opens a fresh one-time signing session (sign_...).'}
            </p>
          </div>
          <div class="rounded-xl p-4 bg-white/[0.03] border border-white/10 space-y-2">
            <div class="text-xs font-mono text-violet-300">STEP 2 · REVIEW</div>
            <h4 class="font-semibold text-white text-sm">{$locale === 'zh' ? '协签设备独立核验' : 'Co-Signers Independently Review'}</h4>
            <p class="text-xs text-white/65 leading-relaxed">
              {$locale === 'zh'
                ? '第二台设备弹窗展示：公链、发件地址、收款/摘要内容。如果发现异常（比如网页被劫持），点「拒绝」直接中止！'
                : 'Your second device displays the chain, account, and exact digest. Spot anything fishy? Hit Decline to abort immediately.'}
            </p>
          </div>
          <div class="rounded-xl p-4 bg-white/[0.03] border border-white/10 space-y-2">
            <div class="text-xs font-mono text-violet-300">STEP 3 · LOCK SIGNER SET</div>
            <h4 class="font-semibold text-white text-sm">{$locale === 'zh' ? '锁定 t 台在线签发者' : 'Select Quorum (t Signers)'}</h4>
            <p class="text-xs text-white/65 leading-relaxed">
              {$locale === 'zh'
                ? '例如 2-of-3 时，只要有任意 2 台设备确认 READY，发起方就锁定签名小组，未参与的第 3 台完全不用开机！'
                : 'In a 2-of-3 vault, once any 2 devices send READY, the quorum locks in—the 3rd device can stay completely offline!'}
            </p>
          </div>
          <div class="rounded-xl p-4 bg-white/[0.03] border border-white/10 space-y-2">
            <div class="text-xs font-mono text-violet-300">STEP 4 · JOINT SIGNATURE</div>
            <h4 class="font-semibold text-white text-sm">{$locale === 'zh' ? '交互产出标准签名' : 'Output Standard Signature'}</h4>
            <p class="text-xs text-white/65 leading-relaxed">
              {$locale === 'zh'
                ? '双方用各自的密钥分片交互算出完整签名（EVM 输出 65 字节低-s r‖s‖v，BTC 输出 BIP-340 签名），全程不拼接私钥。'
                : 'Signers jointly compute the final signature (65-byte low-s ECDSA for EVM, BIP-340 for BTC, Ed25519 for SOL/SUI) without ever reconstructing the key.'}
            </p>
          </div>
        </div>
      </div>

    <!-- Lesson 3: Transaction Broadcast -->
    {:else}
      <div class="rounded-3xl p-6 sm:p-8 bg-[#121826]/95 border border-brand-accent/35 shadow-2xl space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span class="text-xs font-mono text-brand-accent uppercase tracking-wider">LESSON 03 · TRANSACTION LIFECYCLE & BROADCAST</span>
            <h3 class="text-xl sm:text-2xl font-bold mt-1">
              {$locale === 'zh'
                ? '什么是交易广播（Broadcast）？签完名怎么真正把币转上链？'
                : 'What is Transaction Broadcasting? How Signed Txs Land On-Chain'}
            </h3>
          </div>
          <span class="px-3 py-1.5 rounded-lg text-xs font-mono bg-brand-accent/15 text-brand-accent border border-brand-accent/35 shrink-0">
            {$locale === 'zh' ? '签名 ≠ 上链 · 广播后才写入区块' : 'Signing ≠ On-Chain · Broadcast Publishes It'}
          </span>
        </div>

        <div class="rounded-2xl p-5 bg-black/35 border border-white/10 text-sm text-white/85 leading-relaxed">
          <strong class="text-brand-accent">
            {$locale === 'zh' ? '🎯 一句话白话类比：' : '🎯 Plain-English Analogy:'}
          </strong>
          {#if $locale === 'zh'}
            <strong>「签名（Sign）」</strong>就像你在支票上盖好两个人的印章；此时钱还没扣，因为银行还没收到这张支票。<strong>「广播（Broadcast）」</strong>就是把这张盖好章的支票（Raw Signed Tx）递交给区块链的 <strong>RPC 节点</strong>，节点验证签名合法后全网同步并打包进区块，你的转账才算真正完成！
          {:else}
            <strong>Signing</strong> is like stamping a check with two required signatures—no money moves yet because the bank hasn’t received it. <strong>Broadcasting</strong> submits that stamped raw transaction to a blockchain <strong>RPC node</strong>, which verifies the signature and includes it in the next block!
          {/if}
        </div>

        <!-- 5-stage pipeline -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div class="rounded-xl p-4 bg-white/[0.03] border border-white/10 space-y-1.5">
            <div class="text-[11px] font-mono text-brand-neon">① BUILD 构造</div>
            <h4 class="font-semibold text-white text-sm">{$locale === 'zh' ? '自动补全参数' : 'Fill Nonce & Gas'}</h4>
            <p class="text-xs text-white/65 leading-relaxed">
              {$locale === 'zh'
                ? '自动查询链上 pending nonce、估算 Gas（+20% 防失败余量）与 EIP-1559 费率，封装原生币或 ERC-20 转账数据。'
                : 'Fetches pending nonce, estimates gas (+20% safety buffer) & EIP-1559 fees for native or ERC-20 transfers.'}
            </p>
          </div>
          <div class="rounded-xl p-4 bg-white/[0.03] border border-white/10 space-y-1.5">
            <div class="text-[11px] font-mono text-violet-300">② SIGN 多签</div>
            <h4 class="font-semibold text-white text-sm">{$locale === 'zh' ? '双端协同盖章' : 'Threshold Co-Sign'}</h4>
            <p class="text-xs text-white/65 leading-relaxed">
              {$locale === 'zh'
                ? '对交易哈希执行 2-of-2 / 2-of-3 门限签名，产出标准 (r, s, yParity) 签名。'
                : 'Runs 2-of-2 / 2-of-3 threshold signing over the tx sighash to get (r, s, yParity).'}
            </p>
          </div>
          <div class="rounded-xl p-4 bg-white/[0.03] border border-white/10 space-y-1.5">
            <div class="text-[11px] font-mono text-amber-300">③ ASSEMBLE 打包</div>
            <h4 class="font-semibold text-white text-sm">{$locale === 'zh' ? '序列化原始交易' : 'Serialize Raw Hex'}</h4>
            <p class="text-xs text-white/65 leading-relaxed">
              {$locale === 'zh'
                ? '将未签名交易与门限签名按 EIP-1559 / Legacy 规则拼装成 0x02f8... 原始交易十六进制串。'
                : 'Encodes tx fields + signature into broadcast-ready 0x02f8... raw transaction bytes.'}
            </p>
          </div>
          <div class="rounded-xl p-4 bg-white/[0.03] border border-white/10 space-y-1.5">
            <div class="text-[11px] font-mono text-brand-accent">④ BROADCAST 广播</div>
            <h4 class="font-semibold text-white text-sm">{$locale === 'zh' ? '发往 RPC 节点' : 'Push to RPC Node'}</h4>
            <p class="text-xs text-white/65 leading-relaxed">
              {$locale === 'zh'
                ? '调用 eth_sendRawTransaction（或对应链广播接口）把原始交易推送到矿工/验证者内存池。'
                : 'Submits via eth_sendRawTransaction (or chain equivalent) into the public mempool.'}
            </p>
          </div>
          <div class="rounded-xl p-4 bg-white/[0.03] border border-white/10 space-y-1.5">
            <div class="text-[11px] font-mono text-emerald-300">⑤ CONFIRM 上链</div>
            <h4 class="font-semibold text-white text-sm">{$locale === 'zh' ? '浏览器查哈希' : 'Verify Tx Hash'}</h4>
            <p class="text-xs text-white/65 leading-relaxed">
              {$locale === 'zh'
                ? '获得 Tx Hash，到 Etherscan / Arbiscan / Basescan / mempool.space / Solscan 查到 Success 即到账！'
                : 'Check the returned Tx Hash on Etherscan / Basescan / mempool.space / Solscan until Confirmed!'}
            </p>
          </div>
        </div>

        <!-- Two Broadcast Modes explained clearly for beginners -->
        <div class="grid md:grid-cols-2 gap-4 pt-1">
          <div class="rounded-2xl p-5 bg-emerald-500/10 border border-emerald-400/30 space-y-2">
            <div class="text-xs font-mono text-emerald-300 font-semibold">
              {$locale === 'zh' ? '方式 A · 日常最省心（插件自动广播）' : 'MODE A · EVERYDAY (AUTO-BROADCAST IN EXTENSION)'}
            </div>
            <p class="text-xs sm:text-sm text-white/80 leading-relaxed">
              {$locale === 'zh'
                ? '在 Chrome 插件内发起转账，或连接 Uniswap / OpenSea / Aave 等 dApp 发起交易时：只要桌面端和插件都点「批准」，插件会自动完成【打包 + 调用当前网络 RPC 广播】并返回交易哈希，小白零手动操作！'
                : 'When sending inside the Chrome Extension or using any dApp (Uniswap, Aave, OpenSea): once your co-signers approve, the extension automatically assembles and broadcasts via eth_sendRawTransaction and returns the live Tx Hash.'}
            </p>
          </div>
          <div class="rounded-2xl p-5 bg-sky-500/10 border border-sky-400/30 space-y-2">
            <div class="text-xs font-mono text-sky-300 font-semibold">
              {$locale === 'zh' ? '方式 B · 高级冷签（手动 / 离线广播）' : 'MODE B · AIR-GAP / MANUAL BROADCAST'}
            </div>
            <p class="text-xs sm:text-sm text-white/80 leading-relaxed">
              {$locale === 'zh'
                ? '如果使用桌面端 / SD 卡离线模式对原始交易哈希签名：拿到最终签名拼好原始交易后，可粘贴到任意公开广播页（如 Etherscan PushTx、mempool.space/tx/push）或自建节点发出——广播只包含公开签名结果，不含任何私钥分片，绝对安全！'
                : 'When signing raw digests via Desktop or Air-Gap SD card mode, paste the signed raw tx hex into any public broadcaster (Etherscan PushTx, mempool.space/tx/push) or your own RPC node. A signed tx reveals zero secret share info.'}
            </p>
          </div>
        </div>
      </div>
    {/if}
  </section>

  <!-- 5-STEP ANNOTATED WALKTHROUGH -->
  <main id="guide-steps" class="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-10 space-y-24">
    <!-- ==================== STEP 1 ==================== -->
    <section id="step-1" class="scroll-mt-36 space-y-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-brand-accent/20 text-brand-accent border border-brand-accent/40">
              STEP 01
            </span>
            <span class="text-xs font-mono text-white/50">
              {$locale === 'zh' ? '耗时约 1 分钟 · 双端准备与房间配对' : '~1 MIN · PREPARE & PAIR DEVICES'}
            </span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-bold">
            {$locale === 'zh'
              ? '安装双端并加入同一个配对房间（Room ID）'
              : 'Install Both Clients & Join the Same Pairing Room'}
          </h2>
          <p class="text-white/70 max-w-3xl text-sm sm:text-base leading-relaxed">
            {#if $locale === 'zh'}
              同时打开 <strong>Chrome 浏览器插件（starlab-wallet）</strong> 与 <strong>桌面客户端（starlab-desktop）</strong>。在插件端选择 YubiKey 或密码解锁，并在两端填写相同的 <strong>Room ID（例如 <code>my-vault-2026</code>）</strong>。房间号就像你们设备之间的“暗号”，只有填了同一房间号的设备才能互相看到邀请。
            {:else}
              Launch both the <strong>Chrome Extension (starlab-wallet)</strong> and the <strong>Starlab Desktop App</strong>. Pick YubiKey or password unlock in the extension, then enter the exact same <strong>Room ID</strong> on both devices so they discover each other automatically.
            {/if}
          </p>
        </div>
      </div>

      <div class="grid lg:grid-cols-12 gap-8 items-start">
        <div class="lg:col-span-5">
          <AnnotatedScreenshot
            src="/wallet-guide/ext-welcome.webp"
            alt="Starlab Chrome Extension Welcome Screen"
            device="extension"
            titleEn="1A · Chrome Extension — First Launch & Unlock"
            titleZh="1A · Chrome 插件 — 初始化与解锁方式"
            callouts={extWelcomeCallouts}
          />
        </div>
        <div class="lg:col-span-7">
          <AnnotatedScreenshot
            src="/wallet-guide/desktop-connection.webp"
            alt="Starlab Desktop Connection and Room ID Settings"
            device="desktop"
            titleEn="1B · Starlab Desktop — Connection & Shared Room ID"
            titleZh="1B · 桌面端 — 信令连接与共享房间号（Room ID）"
            callouts={desktopConnectionCallouts}
          />
        </div>
      </div>
    </section>

    <!-- ==================== STEP 2 ==================== -->
    <section id="step-2" class="scroll-mt-36 space-y-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-brand-neon/15 text-brand-neon border border-brand-neon/40">
              STEP 02 · DKG 实操
            </span>
            <span class="text-xs font-mono text-white/50">
              {$locale === 'zh' ? '耗时约 2 分钟 · 无助记词分布式建库' : '~2 MIN · RUN ZERO-SEED DKG'}
            </span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-bold">
            {$locale === 'zh'
              ? '动手跑一次 DKG：2-of-2 协同生成全链密钥分片'
              : 'Run DKG Hands-On: Generate Multi-Chain Shares Together'}
          </h2>
          <p class="text-white/70 max-w-3xl text-sm sm:text-base leading-relaxed">
            {#if $locale === 'zh'}
              在插件端点击 <strong>Create shared wallet</strong>，填好金库名称与门限（新手先用 <strong>2 of 2</strong> 练手，大额强烈推荐 <strong>2 of 3</strong>）并发出邀请；切到桌面端 <strong>Set up wallet → Join a wallet</strong>，点击紫色邀请卡、设置桌面端独立密码、点 <strong>Join wallet</strong>，两台设备会自动跑完 DKG 并各自加密落盘！
            {:else}
              Click <strong>Create shared wallet</strong> in the Chrome Extension, set the vault name and threshold (try <strong>2 of 2</strong> first, or <strong>2 of 3</strong> for loss tolerance), and click <strong>Invite devices</strong>. On Desktop, select the live invite card, set an independent local password, and click <strong>Join wallet</strong> to run the P2P DKG ceremony.
            {/if}
          </p>
        </div>
      </div>

      <!-- Row 2A: Extension Configure + Invite -->
      <div class="grid md:grid-cols-2 gap-8 items-start">
        <AnnotatedScreenshot
          src="/wallet-guide/ext-configure.webp"
          alt="Configure 2-of-2 Multi-Chain MPC Wallet in Extension"
          device="extension"
          titleEn="2A · Extension — Configure Vault & Threshold (Setup 1/3)"
          titleZh="2A · 插件端 — 配置金库名称与门限规则（Setup 1/3）"
          callouts={extConfigureCallouts}
        />
        <AnnotatedScreenshot
          src="/wallet-guide/ext-invite.webp"
          alt="Invite Devices Waiting Room in Extension"
          device="extension"
          titleEn="2B · Extension — Broadcast DKG Invite (Setup 2/3)"
          titleZh="2B · 插件端 — 发出邀请等待桌面端入组（Setup 2/3）"
          callouts={extInviteCallouts}
        />
      </div>

      <!-- Row 2B: Desktop Join + Live DKG Progress -->
      <div class="grid xl:grid-cols-2 gap-8 items-start">
        <AnnotatedScreenshot
          src="/wallet-guide/desktop-join.webp"
          alt="Starlab Desktop Join a Wallet with Live Invite"
          device="desktop"
          titleEn="2C · Desktop — Pick Live Invite & Set Local Password"
          titleZh="2C · 桌面端 — 一键选中邀请并设置本机分片密码"
          callouts={desktopJoinCallouts}
        />
        <AnnotatedScreenshot
          src="/wallet-guide/desktop-dkg.webp"
          alt="Starlab Desktop Live 2-of-2 Key Generation Ceremony"
          device="desktop"
          titleEn="2D · Desktop — Live Zero-Seed DKG Ceremony Progress"
          titleZh="2D · 桌面端 — 实时 DKG 分布式密钥生成进度"
          callouts={desktopDkgCallouts}
        />
      </div>

      <!-- Pro tip callout -->
      <div class="rounded-2xl p-5 bg-violet-500/10 border border-violet-400/30 flex items-start gap-4">
        <span class="text-xl shrink-0">💡</span>
        <div class="text-sm text-white/80 leading-relaxed">
          <strong class="text-white">
            {$locale === 'zh' ? '小白自检：怎么确认 DKG 真正成功了？' : 'Quick Check: How do I know DKG succeeded?'}
          </strong>
          <span class="ml-1">
            {#if $locale === 'zh'}
              两台设备都会跳转到主界面，并且你在桌面端左侧看到的 EVM 地址（例如 <code>0xc35f...8961</code>）和 Chrome 插件顶部显示的地址会<strong>逐字完全一模一样</strong>——证明两台设备的加密分片属于同一把数学公钥！
            {:else}
              Both apps return to their main screen and show the <strong>exact same EVM address</strong> (e.g. <code>0xc35f...8961</code>) character for character—proving both independent shares belong to the same group public key!
            {/if}
          </span>
        </div>
      </div>
    </section>

    <!-- ==================== STEP 3 ==================== -->
    <section id="step-3" class="scroll-mt-36 space-y-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-400/40">
              STEP 03
            </span>
            <span class="text-xs font-mono text-white/50">
              {$locale === 'zh' ? '随时随地 · 全链收款、切换网络与 HD 多账户' : 'INSTANT · RECEIVE ACROSS ALL CHAINS'}
            </span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-bold">
            {$locale === 'zh'
              ? '全链统一收款，切换上百条网络 & 免费派生无限子账户'
              : 'Receive Across Every Network & Derive Unlimited HD Accounts'}
          </h2>
          <p class="text-white/70 max-w-3xl text-sm sm:text-base leading-relaxed">
            {#if $locale === 'zh'}
              收款<strong>不需要另一台设备开机</strong>！在插件主界面顶部可随时切换 <strong>Ethereum、Arbitrum、Optimism、Base、Polygon、BNB Chain、Bitcoin、Solana、Sui</strong> 或在设置中新增任意自定义 EVM RPC；点击 <strong>Account 0 ▾</strong> 还能通过纯公钥 BIP-44/86 派生新子账户，完全不用重跑 DKG。
            {:else}
              Receiving funds <strong>never requires your co-signer online</strong>! Switch between <strong>Ethereum, Arbitrum, Optimism, Base, Polygon, Bitcoin, Solana, Sui</strong> (or add any custom EVM RPC in Settings), and derive extra accounts (<strong>Account 0, 1, 2…</strong>) via public-only BIP-44/86 math with zero extra DKG rounds.
            {/if}
          </p>
        </div>
      </div>

      <div class="grid lg:grid-cols-12 gap-8 items-start">
        <div class="lg:col-span-6">
          <AnnotatedScreenshot
            src="/wallet-guide/ext-home.webp"
            alt="Starlab Chrome Extension Home Dashboard"
            device="extension"
            titleEn="3A · Extension — Multi-Chain Vault Dashboard"
            titleZh="3A · 插件端 — 全链主界面、网络切换与一键复制收款"
            callouts={extHomeCallouts}
          />
        </div>

        <div class="lg:col-span-6 space-y-6">
          <!-- Real derived address card from our live run -->
          <div class="rounded-2xl p-6 bg-[#121826]/90 border border-white/10 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-white">
                {$locale === 'zh' ? '一个金库 → 全曲线标准地址（实测输出）' : 'One Vault → Multi-Curve Standard Addresses'}
              </h3>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                BIP-44 / BIP-86
              </span>
            </div>
            <p class="text-xs sm:text-sm text-white/65">
              {$locale === 'zh'
                ? '同一把 2-of-2 金库（Account 0）在桌面端与插件端同步派生出的真实地址——其中 EVM 地址在以太坊、Arbitrum、Base、Optimism、Polygon、BSC 等 100+ 链完全通用：'
                : 'Real addresses derived by our live 2-of-2 vault (Account 0) on both clients—the EVM address works across Ethereum, Arbitrum, Base, Optimism, Polygon, BSC, and 100+ EVM networks:'}
            </p>
            <div class="space-y-2.5 font-mono text-xs">
              <div class="p-3 rounded-xl bg-black/35 border border-white/8 flex items-center justify-between gap-3">
                <span class="text-indigo-300 font-semibold shrink-0">All EVM (100+)</span>
                <span class="text-white/85 truncate">0xc35ff126...cfa226e8961</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-white/8 text-white/60 shrink-0">CGGMP24</span>
              </div>
              <div class="p-3 rounded-xl bg-black/35 border border-white/8 flex items-center justify-between gap-3">
                <span class="text-amber-300 font-semibold shrink-0">Bitcoin Taproot</span>
                <span class="text-white/85 truncate">bc1pt5k5jv...k8rdad</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-white/8 text-white/60 shrink-0">BIP-340</span>
              </div>
              <div class="p-3 rounded-xl bg-black/35 border border-white/8 flex items-center justify-between gap-3">
                <span class="text-teal-300 font-semibold shrink-0">Solana</span>
                <span class="text-white/85 truncate">EQNH2BuY1B...dYxt4c</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-white/8 text-white/60 shrink-0">Ed25519</span>
              </div>
              <div class="p-3 rounded-xl bg-black/35 border border-white/8 flex items-center justify-between gap-3">
                <span class="text-sky-300 font-semibold shrink-0">Sui</span>
                <span class="text-white/85 truncate">0xa77007f0...1d8042</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-white/8 text-white/60 shrink-0">Ed25519</span>
              </div>
            </div>
          </div>

          <!-- Secondary visual: Wallet Switcher -->
          <AnnotatedScreenshot
            src="/wallet-guide/ext-wallets.webp"
            alt="Starlab Extension Wallet Switcher and Multi-Vault Management"
            device="extension"
            titleEn="3B · Extension — Multi-Vault Switcher & Wallet Settings"
            titleZh="3B · 插件端 — 多金库切换与钱包管理菜单"
          />
        </div>
      </div>
    </section>

    <!-- ==================== STEP 4 ==================== -->
    <section id="step-4" class="scroll-mt-36 space-y-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-brand-accent/20 text-brand-accent border border-brand-accent/40">
              STEP 04 · 多签 + 广播实操
            </span>
            <span class="text-xs font-mono text-white/50">
              {$locale === 'zh' ? '耗时约 5 秒 · 协同审批并广播上链' : '~5 SEC · CO-SIGN & BROADCAST ON-CHAIN'}
            </span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-bold">
            {$locale === 'zh'
              ? '多设备门限多签 & 一键广播上链全流程'
              : 'Threshold Co-Signing & Broadcasting Transactions On-Chain'}
          </h2>
          <p class="text-white/70 max-w-3xl text-sm sm:text-base leading-relaxed">
            {#if $locale === 'zh'}
              发起转币或 dApp 交互时，只需保持任意 <code>t</code> 台设备在线（例如 2-of-2 时的浏览器插件 + 桌面端）。<strong>在一方发起签名请求 → 另一方独立核对并批准 → 交互算出原生签名 → 自动（或手动）通过 RPC 广播上链</strong>。
            {:else}
              Whenever you send tokens or interact with a dApp, keep any <code>t</code> devices online. <strong>Propose the transaction → Independently verify & approve on co-signer → Jointly compute standard signature → Automatically (or manually) broadcast to RPC</strong>.
            {/if}
          </p>
        </div>
      </div>

      <AnnotatedScreenshot
        src="/wallet-guide/desktop-sign.webp"
        alt="Starlab Desktop Threshold Signing Form with Ethereum and Bitcoin"
        device="desktop"
        titleEn="4A · Starlab Desktop — Threshold Co-Signing Workspace"
        titleZh="4A · 桌面端 — 门限协同签名界面（选链、核对地址并广播审批请求）"
        callouts={desktopSignCallouts}
      />

      <!-- Concrete step-by-step recipe for BOTH Everyday Auto-Broadcast and Manual/Offline Broadcast -->
      <div class="grid lg:grid-cols-2 gap-6">
        <div class="rounded-2xl p-6 bg-[#121826]/90 border border-emerald-400/30 space-y-4">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-md text-xs font-mono bg-emerald-500/15 text-emerald-300">
              {$locale === 'zh' ? '场景 A · 插件转币 / dApp（自动广播）' : 'FLOW A · EXTENSION SEND / DAPP (AUTO BROADCAST)'}
            </span>
            <span class="text-xs text-white/50">{$locale === 'zh' ? '小白日常推荐' : 'Recommended'}</span>
          </div>
          <ol class="space-y-3 text-sm text-white/80 list-decimal list-inside leading-relaxed">
            {#if $locale === 'zh'}
              <li>在 Chrome 插件选择目标网络（如 Base / Arbitrum / Ethereum），点击 <strong>Send</strong> 输入收款地址与金额，或在 Uniswap 等 dApp 点确认（插件自动估算 Gas +20% 与 EIP-1559 费率）。</li>
              <li>插件发起门限签名会话，桌面端（或第 2 台协签设备）收到实时通知并展示待签摘要。</li>
              <li>在协签设备核对<strong>链名与地址无误</strong>后点击批准，两台设备在 3–5 秒内通过 WebRTC 联合算出 65 字节低-s 签名。</li>
              <li><strong>自动广播上链</strong>：插件将交易与签名打包成 Raw Tx，自动调用当前网络 RPC 的 <code>eth_sendRawTransaction</code> 广播，直接给你返回 <strong>Tx Hash</strong>，点开区块浏览器即可看到到账确认！</li>
            {:else}
              <li>Pick your network in the Chrome Extension (Ethereum, Arbitrum, Base, Polygon, etc.), fill in recipient & amount (or trigger a dApp swap)—the extension auto-fetches nonce, gas (+20% headroom), and EIP-1559 fees.</li>
              <li>A fresh threshold signing session is pushed to your paired Desktop app (or second co-signer).</li>
              <li>Verify the <strong>chain and target digest</strong> on the second device and approve; both devices compute the low-s signature in ~3–5 seconds over WebRTC.</li>
              <li><strong>Automatic Broadcast</strong>: the extension serializes the raw signed tx and posts it via <code>eth_sendRawTransaction</code> to your RPC, returning the live <strong>Tx Hash</strong> immediately!</li>
            {/if}
          </ol>
        </div>

        <div class="rounded-2xl p-6 bg-[#121826]/90 border border-sky-400/30 space-y-4">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-md text-xs font-mono bg-sky-500/15 text-sky-300">
              {$locale === 'zh' ? '场景 B · 桌面端 / 离线签发 + 手动广播' : 'FLOW B · DESKTOP / AIR-GAP SIGN + MANUAL BROADCAST'}
            </span>
            <span class="text-xs text-white/50">{$locale === 'zh' ? '大额冷存储 / 进阶' : 'Cold Vault / Pro'}</span>
          </div>
          <ol class="space-y-3 text-sm text-white/80 list-decimal list-inside leading-relaxed">
            {#if $locale === 'zh'}
              <li>如上图 4A，在桌面端选择金库、<code>Account 0</code> 及目标链（如 Ethereum 或 Bitcoin Taproot）。</li>
              <li>在 <code>Message (hex bytes)</code> 粘贴待签的 32 字节交易哈希（sighash）或 EIP-191 消息十六进制，输入本机密码后点击 <strong>Request signature</strong>。</li>
              <li>在另一台在线设备批准（或在无网环境通过 <strong>SD 卡离线导出/导入</strong> 交换签名轮次），产出标准链上签名（EVM 为 <code>r‖s‖v</code>，BTC 为 BIP-340 签名）。</li>
              <li><strong>手动广播</strong>：将带签名的原始交易 hex 提交至任意区块链广播入口（如 <code>etherscan.io/pushTx</code>、<code>mempool.space/tx/push</code> 或自己的节点 RPC），签名机全程无需暴露私钥！</li>
            {:else}
              <li>As shown in 4A above, pick your vault, <code>Account 0</code>, and target chain (Ethereum ECDSA or Bitcoin Taproot) on Starlab Desktop.</li>
              <li>Paste the 32-byte transaction sighash (or EIP-191 digest) into <code>Message (hex bytes)</code>, unlock your local share password, and click <strong>Request signature</strong>.</li>
              <li>Approve on your co-signer (or exchange rounds offline via the <strong>air-gapped SD card</strong> workflow) to obtain the standard on-chain signature (<code>r‖s‖v</code> for EVM, BIP-340 for BTC).</li>
              <li><strong>Manual Broadcast</strong>: submit the assembled signed raw tx hex via any public pusher (<code>etherscan.io/pushTx</code>, <code>mempool.space/tx/push</code>) or your own RPC node.</li>
            {/if}
          </ol>
        </div>
      </div>
    </section>

    <!-- ==================== STEP 5 ==================== -->
    <section id="step-5" class="scroll-mt-36 space-y-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
              STEP 05
            </span>
            <span class="text-xs font-mono text-white/50">
              {$locale === 'zh' ? '必做安全步骤 · 分离备份与小白避坑' : 'ESSENTIAL · ENCRYPTED SHARE BACKUP'}
            </span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-bold">
            {$locale === 'zh'
              ? '导出加密分片备份，换机与防丢高枕无忧'
              : 'Export Encrypted Key-Share Backups for Bulletproof Recovery'}
          </h2>
          <p class="text-white/70 max-w-3xl text-sm sm:text-base leading-relaxed">
            {#if $locale === 'zh'}
              切到桌面端左下角 <strong>Backup & restore</strong>，输入本机密码后点击 <strong>Export key share…</strong> 导出加密分片文件（每条曲线独立加密存储）。浏览器插件端同样在设置中提供加密导出——将不同设备的备份分开存放，既防硬件损坏，又绝不产生单点泄露。
            {:else}
              Open <strong>Backup & restore</strong> in Starlab Desktop, enter your share password, and click <strong>Export key share…</strong> to save an encrypted backup (PBKDF2 + AES-256-GCM). Store each device’s encrypted share separately so hardware failure never locks you out—and no single backup can ever spend your funds.
            {/if}
          </p>
        </div>
      </div>

      <AnnotatedScreenshot
        src="/wallet-guide/desktop-backup.webp"
        alt="Starlab Desktop Backup and Restore Encrypted Key Share"
        device="desktop"
        titleEn="5A · Starlab Desktop — Encrypted Key-Share Backup & Restore"
        titleZh="5A · 桌面端 — 加密分片导出与跨设备恢复"
        callouts={desktopBackupCallouts}
      />

      <!-- Beginner Do & Don't Security Checklist -->
      <div class="rounded-2xl p-6 bg-gradient-to-br from-[#19162b] via-[#121826] to-[#111e2b] border border-white/15 space-y-4">
        <h3 class="text-lg sm:text-xl font-bold text-white">
          {$locale === 'zh' ? '🛡️ 小白安全实操 Checklist（转大额前花 30 秒核对）' : '🛡️ Beginner Safety Checklist (30-Second Pre-Flight)'}
        </h3>
        <div class="grid md:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div class="space-y-2.5 text-white/80">
            <p><span class="text-emerald-400 font-bold mr-1.5">✓</span>{$locale === 'zh' ? '先用极小金额（例如 $1~$5 等值代币）在测试网或 L2（Base / Arbitrum）完整走通一次「收款 → 多签 → 广播上链」。' : 'Always run one tiny test transfer ($1–$5 on Base/Arbitrum or testnet) end-to-end before moving large funds.'}</p>
            <p><span class="text-emerald-400 font-bold mr-1.5">✓</span>{$locale === 'zh' ? '不同设备使用不同的本地解锁密码，并把各设备的加密分片备份分别存放在不同离线 U 盘/SD 卡。' : 'Use distinct passwords per device and store each encrypted share backup on separate offline media.'}</p>
            <p><span class="text-emerald-400 font-bold mr-1.5">✓</span>{$locale === 'zh' ? '大额长期资金优先创建 2-of-3 金库：第 3 台冷设备断网锁进保险箱，丢任何一台设备都不影响动用资金。' : 'Use a 2-of-3 vault for high-value holdings so losing any single device never locks your assets.'}</p>
          </div>
          <div class="space-y-2.5 text-white/80">
            <p><span class="text-brand-accent font-bold mr-1.5">✗</span>{$locale === 'zh' ? '不要把 2-of-2 两台设备的加密分片备份放进同一个云盘或同一个文件夹（否则等于变回单点风险）。' : 'Never put both devices’ backups in the same cloud folder—keep shares physically separated.'}</p>
            <p><span class="text-brand-accent font-bold mr-1.5">✗</span>{$locale === 'zh' ? '不要在协签弹窗里不看内容就盲点批准——第二台设备的核心价值就是帮你拦截恶意合约或被篡改的地址！' : 'Never blind-approve co-signing prompts—reviewing on your second device is what stops phishing!'}</p>
            <p><span class="text-brand-accent font-bold mr-1.5">✗</span>{$locale === 'zh' ? '忘记本机分片密码无法找回（零托管架构无“找回密码”客服），请用密码管理器（如 Bitwarden / 1Password）妥善记录。' : 'Zero-custody means nobody can reset your share password—save each device password safely in a password manager.'}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- WHY MPC COMPARISON TABLE -->
    <section class="scroll-mt-32 space-y-8">
      <div class="text-center max-w-3xl mx-auto">
        <p class="text-xs font-mono uppercase tracking-widest text-brand-accent mb-2">
          {$locale === 'zh' ? '横向对比' : 'SIDE-BY-SIDE COMPARISON'}
        </p>
        <h2 class="text-2xl sm:text-4xl font-bold">
          {$locale === 'zh'
            ? '传统助记词钱包 vs 单台硬件钱包 vs Starlab MPC'
            : 'Seed Phrase Wallet vs Hardware Wallet vs Starlab MPC'}
        </h2>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-white/10 bg-[#121826]/85 shadow-2xl">
        <table class="w-full text-left border-collapse min-w-[680px]">
          <thead>
            <tr class="border-b border-white/10 bg-black/30 text-xs uppercase tracking-wider font-mono">
              <th class="p-4 text-white/60">{$locale === 'zh' ? '安全与体验维度' : 'Dimension'}</th>
              <th class="p-4 text-white/60">{$locale === 'zh' ? '传统助记词钱包' : 'Seed Phrase Wallet'}</th>
              <th class="p-4 text-white/60">{$locale === 'zh' ? '单台硬件钱包 (Ledger)' : 'Single Hardware (Ledger)'}</th>
              <th class="p-4 text-brand-neon bg-brand-neon/5">
                ★ {$locale === 'zh' ? 'Starlab MPC (2-of-2 / 2-of-3)' : 'Starlab MPC (2-of-2 / 2-of-3)'}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/10 text-sm">
            {#each comparisons as row}
              <tr class="hover:bg-white/[0.02] transition">
                <td class="p-4 font-semibold text-white">
                  {$locale === 'zh' ? row.metricZh : row.metricEn}
                </td>
                <td class="p-4 text-white/60">
                  {$locale === 'zh' ? row.seedZh : row.seedEn}
                </td>
                <td class="p-4 text-white/70">
                  {$locale === 'zh' ? row.hwZh : row.hwEn}
                </td>
                <td class="p-4 text-white font-medium bg-brand-neon/[0.04]">
                  <span class="text-emerald-400 mr-1.5">✓</span>
                  {$locale === 'zh' ? row.mpcZh : row.mpcEn}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>

    <!-- ==================== FAQ ==================== -->
    <section id="faq" class="scroll-mt-32 space-y-8">
      <div class="text-center max-w-2xl mx-auto">
        <p class="text-xs font-mono uppercase tracking-widest text-brand-neon mb-2">FAQ</p>
        <h2 class="text-2xl sm:text-4xl font-bold">
          {$locale === 'zh' ? '常见问题解答' : 'Frequently Asked Questions'}
        </h2>
      </div>

      <div class="max-w-4xl mx-auto space-y-3">
        {#each faqs as item, idx}
          <div class="rounded-2xl border border-white/10 bg-[#121826]/85 overflow-hidden">
            <button
              type="button"
              on:click={() => toggleFaq(idx)}
              class="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-white/[0.03] transition cursor-pointer"
            >
              <span class="font-semibold text-sm sm:text-base text-white">
                {$locale === 'zh' ? item.qZh : item.qEn}
              </span>
              <span class="text-brand-neon font-mono text-lg shrink-0">
                {openFaq === idx ? '−' : '+'}
              </span>
            </button>
            {#if openFaq === idx}
              <div class="px-6 pb-5 text-sm text-white/70 leading-relaxed border-t border-white/8 pt-3.5">
                {$locale === 'zh' ? item.aZh : item.aEn}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </section>

    <!-- ==================== BOTTOM PROMO CTA ==================== -->
    <section class="pb-8">
      <div
        class="relative rounded-3xl p-8 sm:p-12 border border-brand-accent/35 bg-gradient-to-br from-[#1a1630] via-[#121826] to-[#0f1c29] overflow-hidden text-center space-y-6 shadow-2xl"
      >
        <div
          class="pointer-events-none absolute inset-0 opacity-40"
          style="background: radial-gradient(circle at 50% 0%, rgba(233, 69, 96, 0.35), transparent 65%);"
        ></div>
        <div class="relative z-10 max-w-2xl mx-auto space-y-4">
          <h2 class="text-2xl sm:text-4xl font-extrabold">
            {$locale === 'zh'
              ? '现在就升级你的全链资产安全等级'
              : 'Ready to Retire Your Paper Seed Phrases?'}
          </h2>
          <p class="text-sm sm:text-base text-white/75">
            {$locale === 'zh'
              ? '完全开源、零托管、支持与 Ledger 同级的全主流公链生态。下载桌面端与浏览器插件，5 分钟跑通 DKG、多签与广播！'
              : '100% open source, zero cloud custody, and Ledger-level multi-chain coverage. Download both clients and launch your threshold vault in 5 minutes.'}
          </p>
          <div class="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href="https://github.com/stars-labs/starlab-desktop"
              target="_blank"
              rel="noopener noreferrer"
              class="px-6 py-3 rounded-xl bg-brand-accent text-white font-semibold text-sm hover:brightness-110 transition shadow-lg"
            >
              {$locale === 'zh' ? '桌面端 (starlab-desktop)' : 'Starlab Desktop'} &nearr;
            </a>
            <a
              href="https://github.com/stars-labs/starlab-wallet"
              target="_blank"
              rel="noopener noreferrer"
              class="px-6 py-3 rounded-xl bg-violet-600/80 hover:bg-violet-500 text-white font-semibold text-sm transition shadow-lg"
            >
              {$locale === 'zh' ? '浏览器插件 (starlab-wallet)' : 'Chrome Extension'} &nearr;
            </a>
            <a
              href="https://github.com/stars-labs/starlab-mpc"
              target="_blank"
              rel="noopener noreferrer"
              class="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium text-sm transition"
            >
              {$locale === 'zh' ? '核心引擎 (starlab-mpc)' : 'Core MPC Engine'} &nearr;
            </a>
            <button
              type="button"
              on:click={() => navigateTo('home')}
              class="px-5 py-3 rounded-xl border border-white/15 text-white/75 hover:text-white hover:border-white/35 text-sm transition cursor-pointer"
            >
              {$locale === 'zh' ? '← 返回 StarsLab 首页' : '← Back to StarsLab'}
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
</div>
