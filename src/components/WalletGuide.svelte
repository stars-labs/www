<script lang="ts">
  import { locale } from '../lib/i18n';
  import { navigateTo } from '../lib/router';
  import AnnotatedScreenshot, { type Callout } from './AnnotatedScreenshot.svelte';

  let openFaq: number | null = 0;

  function toggleFaq(index: number) {
    openFaq = openFaq === index ? null : index;
  }

  function scrollToStep(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const stepsNav = [
    { id: 'step-1', num: '01', en: 'Pair Devices', zh: '准备与配对' },
    { id: 'step-2', num: '02', en: 'Create 2-of-2 Vault', zh: '创建多链金库' },
    { id: 'step-3', num: '03', en: '4-Chain Receive', zh: '四链收款管理' },
    { id: 'step-4', num: '04', en: 'Co-Sign Tx', zh: '协同门限签名' },
    { id: 'step-5', num: '05', en: 'Encrypted Backup', zh: '分片加密备份' },
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
      labelEn: 'All 4 Chains Included Automatically',
      labelZh: '一次创建，自动支持 4 大主流链',
      detailEn: 'Ethereum (CGGMP24 ECDSA), Bitcoin Taproot (BIP-340), Solana & Sui (Ed25519 FROST).',
      detailZh: '同步生成以太坊（门限 ECDSA）、比特币 Taproot、Solana 与 Sui 密钥。',
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
      detailEn: 'Here 2 of 2 devices must co-sign; use 2-of-3 to tolerate losing any single device.',
      detailZh: '示例为 2-of-2（双设备同时批准）；大额资产推荐 2-of-3（丢一台仍可签发）。',
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
      detailZh: '在当前房间发布一次性创建邀请，桌面端可直接点选加入。',
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
      labelEn: 'Automatic P2P Ceremony Start',
      labelZh: '全员到齐自动启动分布式计算',
      detailEn: 'As soon as Desktop joins, encrypted WebRTC channels open and DKG begins automatically.',
      detailZh: '桌面端加入后自动建立 WebRTC 端到端直连并开始无助记词密钥生成。',
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
      labelEn: 'Live Cryptographic Ceremony Stepper',
      labelZh: '实时四阶段安全协议进度',
      detailEn: 'Connect devices → Secure setup → Create wallet → Ready. Keep both apps open (~1–2 min).',
      detailZh: '设备互联 → 安全初始化 → 生成四链密钥 → 就绪，保持两台设备在线约 1–2 分钟即可完成。',
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
      detailEn: 'Both devices compute independent shares locally — the full private key is never assembled.',
      detailZh: '两台设备各自独立计算并保存自己的分片，完整私钥在内存中从未出现过。',
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
      detailEn: 'Displays Treasury’s Ethereum address (0xc35f...8961) — byte-for-byte identical on Desktop.',
      detailZh: '展示 Treasury 的以太坊地址 0xc35f...8961，与桌面端派生结果逐字节完全一致。',
    },
    {
      id: 2,
      x: 54,
      y: 22,
      w: 43,
      h: 5,
      anchor: 'tr',
      tone: 'violet',
      labelEn: '4-Chain Switcher & Peer Online Badge',
      labelZh: '四链一键切换与在线状态',
      detailEn: 'Switch seamlessly between Ethereum, Bitcoin Taproot, Solana, and Sui.',
      detailZh: '随时在 Ethereum、Bitcoin、Solana、Sui 之间切换查看地址与余额。',
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
      detailZh: '支持 BIP-44/86 无交互派生多个子账户，点击「Copy address」即可安全收款。',
    },
    {
      id: 4,
      x: 51,
      y: 58,
      w: 46,
      h: 14,
      anchor: 'tl',
      tone: 'neon',
      labelEn: 'Sign Message / Co-Sign Transactions',
      labelZh: '一键发起多设备门限签名',
      detailEn: 'Also responds automatically to dApp signing requests (EIP-1193) with 2-of-2 device approval.',
      detailZh: '既可手动签名消息，也可在连接 Uniswap 等 dApp 时自动拉起多设备协同审批。',
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
      labelEn: 'Unified 4-Chain Vault & HD Accounts',
      labelZh: '同一金库四链地址与 HD 账户选择',
      detailEn: 'Solana, Sui, Bitcoin P2TR (bc1p…), and Ethereum (0xc35f…) all live under one 2-of-2 vault.',
      detailZh: 'Solana、Sui、Bitcoin Taproot（bc1p…）与 Ethereum（0xc35f…）统一管理。',
    },
    {
      id: 2,
      x: 24,
      y: 29,
      w: 22,
      h: 8,
      anchor: 'tr',
      tone: 'violet',
      labelEn: 'Choose Signing Chain',
      labelZh: '选择签名公链（ECDSA / Taproot）',
      detailEn: 'Ethereum runs CGGMP24 threshold ECDSA; Bitcoin runs BIP-340 Taproot FROST Schnorr.',
      detailZh: '以太坊采用 CGGMP24 门限 ECDSA，比特币采用 BIP-340 Taproot FROST 签名。',
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
      detailEn: 'Confirm 0xc35ff126…8961 matches before entering your local share password.',
      detailZh: '签名前核对链上地址，确认无误后再输入本机分片密码。',
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
      labelZh: '点击「Request signature」广播审批',
      detailEn: 'Pushes a live signing prompt to the Chrome Extension; signature completes only after both approve.',
      detailZh: '向浏览器插件推送实时协同审批弹窗，双方确认后交互输出标准链上签名。',
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
      mpcEn: 'Eliminated — no seed phrase ever exists',
      mpcZh: '彻底消除 — 从未生成过完整私钥与助记词',
    },
    {
      metricEn: 'Malware / Phishing Protection',
      metricZh: '防电脑木马 / 浏览器恶意插件',
      seedEn: 'Low — compromised browser signs silently',
      seedZh: '弱 — 电脑中毒可能被直接盗签',
      hwEn: 'High — physical button required',
      hwZh: '高 — 需物理按键确认',
      mpcEn: 'High — requires threshold approval across devices',
      mpcZh: '高 — 单台设备中毒无法凑齐门限签名',
    },
    {
      metricEn: 'Multi-Chain Native Support',
      metricZh: '主流公链原生支持',
      seedEn: 'Often fragmented per ecosystem',
      seedZh: '常需安装多个不同生态钱包',
      hwEn: 'Requires installing separate chain apps',
      hwZh: '需反复安装卸载各链固件 App',
      mpcEn: 'ETH + BTC Taproot + SOL + SUI in 1 vault',
      mpcZh: '一个金库原生覆盖 ETH / BTC / SOL / SUI',
    },
    {
      metricEn: 'Hardware Cost & Setup',
      metricZh: '上手成本与设备门槛',
      seedEn: 'Free',
      seedZh: '免费',
      hwEn: '$80–$250 + shipping wait',
      hwZh: '¥600–¥2000 且需等待邮寄',
      mpcEn: 'Free — use devices you already own (+ optional YubiKey)',
      mpcZh: '免费 — 直接用现有电脑/浏览器即可组建（可选 YubiKey）',
    },
    {
      metricEn: 'Privacy & On-Chain Footprint',
      metricZh: '链上隐私与 Gas 费用',
      seedEn: 'Standard single-sig tx',
      seedZh: '标准单签交易',
      hwEn: 'Standard single-sig tx',
      hwZh: '标准单签交易',
      mpcEn: 'Indistinguishable from single-sig (lowest gas, zero multisig bloat)',
      mpcZh: '链上与普通单签完全一致（最低 Gas，无多签合约开销）',
    },
  ];

  const faqs = [
    {
      qEn: 'What happens if I lose one device or reinstall Chrome?',
      qZh: '如果我的某一台设备坏了，或者不小心重装了浏览器怎么办？',
      aEn: 'First, always export each device’s encrypted key share backup (Step 5) to separate offline storage so you can restore it on a new device immediately. Second, for high-value holdings we strongly recommend creating a 2-of-3 vault (e.g., Chrome Extension + Desktop + Spare Laptop/Air-Gapped Device): even if one device is permanently lost, the remaining two still sign normally.',
      aZh: '首先，完成 Step 5 的「分片加密备份」后，只需在新设备导入对应加密 JSON 文件并输入密码即可原地恢复。其次，对于大额资产强烈建议创建 2-of-3 金库（如插件 + 常用电脑 + 备用设备）：即使永久丢失任意一台设备，其余两台依然可以正常协同签名转移资产。',
    },
    {
      qEn: 'Can StarsLab or the signal server see my private keys or steal my funds?',
      qZh: 'StarsLab 官方或信令服务器能看到我的私钥、或者偷偷转走我的币吗？',
      aEn: 'Never. All FROST and CGGMP24 cryptographic rounds execute strictly inside your local devices (native Rust on Desktop, compiled Rust→WASM in the Extension) over direct WebRTC data channels. The signaling server only relays room membership and WebRTC SDP handshakes — and you can self-host your own signal server in 1 minute from our open-source repo.',
      aZh: '绝无可能。所有 FROST 与 CGGMP24 密码学计算都在你的本地设备内完成（桌面端为原生 Rust，插件端为本地 WASM 沙箱），关键协议消息通过 WebRTC 端到端直连传输。信令服务器只负责房间发现与握手转发，你也可以直接用开源仓库 1 分钟自建私有信令服务器。',
    },
    {
      qEn: 'Which blockchains and cryptographic schemes are supported?',
      qZh: '目前支持哪些公链和底层密码学算法？',
      aEn: 'Every unified vault automatically supports four ecosystems from one setup: Ethereum & EVM chains (CGGMP24 threshold ECDSA at m/44\'/60\'/0\'/0/n), Bitcoin Taproot P2TR bc1p… addresses (FROST BIP-340 Schnorr at m/86\'/0\'/0\'/0/n), Solana (FROST Ed25519), and Sui (FROST Ed25519). Additional accounts (Account 0, 1, 2…) are derived via public-only HD math without re-running DKG.',
      aZh: '一次创建自动支持四大生态：Ethereum 及 EVM 链（CGGMP24 门限 ECDSA，m/44\'/60\'/0\'/0/n）、Bitcoin Taproot bc1p… 原生隔离见证 v1（FROST BIP-340 Schnorr，m/86\'/0\'/0\'/0/n）、Solana（FROST Ed25519）与 Sui（FROST Ed25519）。后续新增子账户采用纯公钥 HD 派生，无需重新跑 DKG。',
    },
    {
      qEn: 'Can I use YubiKey or watch-only / hardware accounts with the browser extension?',
      qZh: '浏览器插件支持 YubiKey 硬件解锁，或者导入观察账户吗？',
      aEn: 'Yes! On first launch the Chrome Extension lets you bind a YubiKey (FIDO2/WebAuthn PRF) or a strong local password to unlock your encrypted share. Inside the dashboard you can also click “+ Add hardware or watch-only account” to track external cold wallets side by side.',
      aZh: '支持！浏览器插件首次初始化即可选择 YubiKey 硬件解锁或强密码保护本地分片；在主界面中也可以点击「+ Add hardware or watch-only account」添加硬件或只读观察账户统一查看资产。',
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
            ? 'STARLAB MPC 钱包 · 开源无助记词门限金库'
            : 'STARLAB MPC WALLET · OPEN-SOURCE THRESHOLD VAULT'}
        </div>

        <h1 class="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-[1.12]">
          {#if $locale === 'zh'}
            告别助记词：<br />
            <span class="gradient-text">私钥从未完整存在</span><br />
            于任何一台设备
          {:else}
            Zero Seed Phrases.<br />
            <span class="gradient-text">Your Key Never Exists</span><br />
            in One Place.
          {/if}
        </h1>

        <p class="text-base sm:text-lg text-white/75 leading-relaxed max-w-xl">
          {#if $locale === 'zh'}
            用你手头的 <strong>桌面客户端 + Chrome 浏览器插件</strong>，5 分钟搭建企业级 <strong>2-of-2 / 2-of-3 多方计算（MPC）金库</strong>。一个金库原生打通 <strong>Ethereum、Bitcoin Taproot、Solana、Sui</strong> 四大公链，真实截图带标注，手把手带你一次上手。
          {:else}
            Pair the <strong>Starlab Desktop App</strong> with the <strong>Chrome Extension</strong> in 5 minutes to build a self-custodial <strong>2-of-2 or 2-of-3 MPC vault</strong>. One setup natively unlocks <strong>Ethereum, Bitcoin Taproot, Solana, and Sui</strong> — follow this real-screenshot annotated walkthrough.
          {/if}
        </p>

        <!-- Primary CTAs -->
        <div class="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            on:click={() => scrollToStep('step-1')}
            class="px-6 py-3.5 rounded-xl bg-brand-accent text-white font-semibold text-sm sm:text-base shadow-[0_10px_30px_rgba(233,69,96,0.35)] hover:brightness-110 transition cursor-pointer"
          >
            {$locale === 'zh' ? '开始 5 分钟图文攻略 ↓' : 'Start 5-Min Visual Guide ↓'}
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
            {$locale === 'zh' ? '100% 实机运行截屏' : '100% Real App Captures'}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="text-emerald-400">✓</span>
            {$locale === 'zh' ? '可点击编号交互高亮' : 'Interactive Numbered Callouts'}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="text-emerald-400">✓</span>
            {$locale === 'zh' ? 'MIT / 开源可审计' : 'Open-Source Rust + WASM'}
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
        <div class="text-xs font-mono uppercase tracking-wider text-brand-neon mb-1">FROST + CGGMP24</div>
        <div class="text-lg font-bold text-white">
          {$locale === 'zh' ? '学术级门限密码学' : 'Audited Threshold Crypto'}
        </div>
        <p class="text-xs text-white/60 mt-1">
          {$locale === 'zh'
            ? 'Schnorr (BIP-340/Ed25519) 与门限 ECDSA 原生协同'
            : 'Native threshold Schnorr & ECDSA with zero single-key reconstruction'}
        </p>
      </div>
      <div class="rounded-2xl p-5 bg-brand-surface/65 border border-white/10">
        <div class="text-xs font-mono uppercase tracking-wider text-brand-accent mb-1">ETH · BTC · SOL · SUI</div>
        <div class="text-lg font-bold text-white">
          {$locale === 'zh' ? '四链合一 · 一次创建' : '4 Chains · 1 Vault'}
        </div>
        <p class="text-xs text-white/60 mt-1">
          {$locale === 'zh'
            ? '支持 BIP-44/86 HD 多账户派生与 Taproot bc1p 地址'
            : 'BIP-44/86 HD accounts & native Bitcoin P2TR Taproot out of the box'}
        </p>
      </div>
      <div class="rounded-2xl p-5 bg-brand-surface/65 border border-white/10">
        <div class="text-xs font-mono uppercase tracking-wider text-violet-300 mb-1">WebRTC P2P</div>
        <div class="text-lg font-bold text-white">
          {$locale === 'zh' ? '零托管 · 端到端直连' : 'Zero Custody · Direct P2P'}
        </div>
        <p class="text-xs text-white/60 mt-1">
          {$locale === 'zh'
            ? '分片永不出本机，不依赖任何中心化云端托管'
            : 'Encrypted shares stay strictly on your own devices — never in the cloud'}
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

  <!-- WHY MPC COMPARISON TABLE -->
  <section class="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-14">
    <div class="text-center max-w-3xl mx-auto mb-10">
      <p class="text-xs font-mono uppercase tracking-widest text-brand-accent mb-2">
        {$locale === 'zh' ? '为什么选择 MPC 门限钱包' : 'WHY THRESHOLD MPC'}
      </p>
      <h2 class="text-2xl sm:text-4xl font-bold">
        {$locale === 'zh'
          ? '告别“抄助记词提心吊胆”的时代'
          : 'Stronger Than Seed Phrases. Simpler Than Hardware.'}
      </h2>
    </div>

    <div class="overflow-x-auto rounded-2xl border border-white/10 bg-[#121826]/85 shadow-2xl">
      <table class="w-full text-left border-collapse min-w-[680px]">
        <thead>
          <tr class="border-b border-white/10 bg-black/30 text-xs uppercase tracking-wider font-mono">
            <th class="p-4 text-white/60">{$locale === 'zh' ? '安全与体验维度' : 'Dimension'}</th>
            <th class="p-4 text-white/60">{$locale === 'zh' ? '传统助记词钱包' : 'Seed Phrase Wallet'}</th>
            <th class="p-4 text-white/60">{$locale === 'zh' ? '单台硬件钱包' : 'Single Hardware Wallet'}</th>
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

  <!-- STICKY 5-STEP NAVIGATOR -->
  <div class="sticky top-16 z-40 backdrop-blur-md bg-[#0f141e]/85 border-y border-white/10">
    <div class="max-w-7xl mx-auto px-4 md:px-10 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
      <span class="text-xs font-mono text-white/45 uppercase tracking-wider mr-2 shrink-0 hidden sm:inline">
        {$locale === 'zh' ? '图文步骤：' : 'GUIDE STEPS:'}
      </span>
      {#each stepsNav as st}
        <button
          type="button"
          on:click={() => scrollToStep(st.id)}
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white/5 hover:bg-brand-accent/20 text-white/80 hover:text-white border border-white/10 hover:border-brand-accent/40 transition shrink-0 cursor-pointer"
        >
          <span class="font-mono text-brand-neon text-xs">{st.num}</span>
          <span>{$locale === 'zh' ? st.zh : st.en}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- 5-STEP ANNOTATED WALKTHROUGH -->
  <main id="guide-steps" class="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-16 space-y-24">
    <!-- ==================== STEP 1 ==================== -->
    <section id="step-1" class="scroll-mt-36 space-y-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-brand-accent/20 text-brand-accent border border-brand-accent/40">
              STEP 01
            </span>
            <span class="text-xs font-mono text-white/50">
              {$locale === 'zh' ? '耗时约 1 分钟 · 双端准备' : '~1 MIN · PREPARE BOTH DEVICES'}
            </span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-bold">
            {$locale === 'zh'
              ? '安装双端并加入同一个配对房间'
              : 'Install Both Clients & Join the Same Pairing Room'}
          </h2>
          <p class="text-white/70 max-w-3xl text-sm sm:text-base leading-relaxed">
            {#if $locale === 'zh'}
              同时打开 <strong>Chrome 浏览器插件（starlab-wallet）</strong> 与 <strong>桌面客户端（starlab-desktop）</strong>。在插件端设置 YubiKey 或密码解锁，并在两端填写相同的 <strong>Room ID（房间号）</strong>，让两台设备通过信令通道互相发现。
            {:else}
              Launch both the <strong>Chrome Extension (starlab-wallet)</strong> and the <strong>Starlab Desktop App</strong>. Pick YubiKey or password unlock in the extension, then enter the exact same <strong>Room ID</strong> on both devices so they can discover each other.
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
              STEP 02
            </span>
            <span class="text-xs font-mono text-white/50">
              {$locale === 'zh' ? '耗时约 2 分钟 · 无助记词 DKG' : '~2 MIN · ZERO-SEED DISTRIBUTED KEYGEN'}
            </span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-bold">
            {$locale === 'zh'
              ? '发起 2-of-2 协同建库，一次生成四链密钥'
              : 'Launch 2-of-2 Distributed Keygen Across All 4 Chains'}
          </h2>
          <p class="text-white/70 max-w-3xl text-sm sm:text-base leading-relaxed">
            {#if $locale === 'zh'}
              在浏览器插件端选择 <strong>Create shared wallet</strong>，设置名称与门限（例如 <strong>2 of 2</strong> 或 <strong>2 of 3</strong>）并发出邀请；在桌面端 <strong>Set up wallet → Join a wallet</strong> 一键选中邀请、输入本地加密密码即可自动完成 FROST + CGGMP24 协同密钥生成。
            {:else}
              Start a shared wallet in the Chrome Extension, configure the threshold (e.g., <strong>2 of 2</strong> or <strong>2 of 3</strong>), and click <strong>Invite devices</strong>. On Desktop, click the live invite card, set an independent local encryption password, and watch the P2P DKG ceremony finish automatically.
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
          titleEn="2A · Extension — Configure 4-Chain Vault & Threshold"
          titleZh="2A · 插件端 — 配置金库名称与门限规则（Setup 1/3）"
          callouts={extConfigureCallouts}
        />
        <AnnotatedScreenshot
          src="/wallet-guide/ext-invite.webp"
          alt="Invite Devices Waiting Room in Extension"
          device="extension"
          titleEn="2B · Extension — Broadcast Invite & Wait for Peers"
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
          titleEn="2D · Desktop — Live Zero-Seed Keygen Progress"
          titleZh="2D · 桌面端 — 实时无助记词分布式密钥生成进度"
          callouts={desktopDkgCallouts}
        />
      </div>

      <!-- Pro tip callout -->
      <div class="rounded-2xl p-5 bg-violet-500/10 border border-violet-400/30 flex items-start gap-4">
        <span class="text-xl shrink-0">💡</span>
        <div class="text-sm text-white/80 leading-relaxed">
          <strong class="text-white">
            {$locale === 'zh' ? '为什么没有任何 12/24 个助记词弹窗？' : 'Why didn’t it show 12 or 24 recovery words?'}
          </strong>
          <span class="ml-1">
            {$locale === 'zh'
              ? '在分布式密钥生成（DKG）协议中，每台设备只生成并保存自己的加密数学分片，完整私钥在任何时刻、任何内存中都从未被拼装出来，从数学根源杜绝助记词抄写与截屏泄露。'
              : 'During Distributed Key Generation (DKG), each device independently derives only its own encrypted share. The complete private key never exists anywhere in RAM or on disk — eliminating seed-phrase theft at the cryptographic layer.'}
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
              {$locale === 'zh' ? '随时随地 · 四链收款与多账户' : 'INSTANT · RECEIVE ACROSS 4 CHAINS'}
            </span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-bold">
            {$locale === 'zh'
              ? '四链资产统一收款，免费派生无限子账户'
              : 'Receive Across ETH, BTC, SOL & SUI with Public-Only HD Accounts'}
          </h2>
          <p class="text-white/70 max-w-3xl text-sm sm:text-base leading-relaxed">
            {#if $locale === 'zh'}
              创建完成后，Chrome 插件主界面立即展示你的 <strong>2-of-2</strong> 多链金库。查看余额、切换公链、复制收款地址或新增 <strong>Account 1 / 2 / 3</strong> 全程仅使用公钥派生，<strong>不需要唤醒其他设备，也不需要输入密码</strong>。
            {:else}
              Once keygen completes, the Chrome Extension immediately opens your <strong>2-of-2</strong> multi-chain dashboard. Viewing balances, copying deposit addresses, or deriving extra HD accounts (<strong>Account 0, 1, 2…</strong>) is public-only — <strong>no co-signer needed just to receive funds</strong>.
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
            titleZh="3A · 插件端 — 多链主界面与一键复制收款地址"
            callouts={extHomeCallouts}
          />
        </div>

        <div class="lg:col-span-6 space-y-6">
          <!-- Real 4-chain derived address card from our live run -->
          <div class="rounded-2xl p-6 bg-[#121826]/90 border border-white/10 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-white">
                {$locale === 'zh' ? '一个金库，自动派生四大主网标准地址' : 'One Vault → Four Native Mainnet Standards'}
              </h3>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                BIP-44 / BIP-86
              </span>
            </div>
            <p class="text-xs sm:text-sm text-white/65">
              {$locale === 'zh'
                ? '以下是本次实测 2-of-2 金库（d6481e174d4f · Account 0）在桌面端与插件端同步派生出的真实四链地址：'
                : 'Real addresses deterministically derived by our live 2-of-2 vault (Account 0) on both Desktop and Extension:'}
            </p>
            <div class="space-y-2.5 font-mono text-xs">
              <div class="p-3 rounded-xl bg-black/35 border border-white/8 flex items-center justify-between gap-3">
                <span class="text-indigo-300 font-semibold shrink-0">Ethereum (EVM)</span>
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
              STEP 04
            </span>
            <span class="text-xs font-mono text-white/50">
              {$locale === 'zh' ? '耗时约 5 秒 · 双设备联合批准' : '~5 SEC · THRESHOLD CO-SIGNING'}
            </span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-bold">
            {$locale === 'zh'
              ? '多设备实时协同签名：单端中毒也无法转走一分钱'
              : 'Co-Sign Transactions Across Devices — Malware Can’t Spend Alone'}
          </h2>
          <p class="text-white/70 max-w-3xl text-sm sm:text-base leading-relaxed">
            {#if $locale === 'zh'}
              无论从桌面端发起 <strong>Sign a message</strong>，还是在浏览器连接 dApp 发起转账，系统都会把待签摘要实时推送给其他在线协签设备。<strong>达到门限（如 2-of-2）全部批准后</strong>，双方通过 WebRTC 协同输出标准链上签名（以太坊输出 65 字节低-s <code>r‖s‖v</code>，比特币输出标准 BIP-340 签名）。
            {:else}
              Whether you initiate a signing request from Desktop or approve a dApp transaction in Chrome, Starlab broadcasts the exact digest to your co-signers. Only when the threshold (e.g. <strong>2-of-2</strong>) approves do both devices interactively compute a standard on-chain signature (low-s 65-byte ECDSA for EVM, BIP-340 Schnorr for Bitcoin Taproot).
            {/if}
          </p>
        </div>
      </div>

      <AnnotatedScreenshot
        src="/wallet-guide/desktop-sign.webp"
        alt="Starlab Desktop Threshold Signing Form with Ethereum and Bitcoin"
        device="desktop"
        titleEn="4A · Starlab Desktop — Threshold Signing Workspace"
        titleZh="4A · 桌面端 — 门限协同签名界面（核对地址并广播请求）"
        callouts={desktopSignCallouts}
      />

      <!-- 3-step signing flow visual strip -->
      <div class="grid md:grid-cols-3 gap-4">
        <div class="rounded-2xl p-5 bg-brand-surface/65 border border-white/10">
          <div class="text-xs font-mono text-brand-neon mb-2">01 · PROPOSE</div>
          <h3 class="font-semibold text-white mb-1">
            {$locale === 'zh' ? '发起方广播交易摘要' : 'Proposer Broadcasts Digest'}
          </h3>
          <p class="text-xs text-white/65 leading-relaxed">
            {$locale === 'zh'
              ? '选择链与账户，输入本地分片密码并点击 Request signature，生成一次性签名会话。'
              : 'Choose chain & account, unlock your local share, and broadcast a fresh signing session ID.'}
          </p>
        </div>
        <div class="rounded-2xl p-5 bg-brand-surface/65 border border-white/10">
          <div class="text-xs font-mono text-violet-300 mb-2">02 · VERIFY & CO-SIGN</div>
          <h3 class="font-semibold text-white mb-1">
            {$locale === 'zh' ? '另一端核验后确认批准' : 'Co-Signer Reviews & Approves'}
          </h3>
          <p class="text-xs text-white/65 leading-relaxed">
            {$locale === 'zh'
              ? '浏览器插件（或另一台电脑）弹窗展示目标链与摘要内容；任何一方拒绝都会立即中止签名。'
              : 'The paired device displays the exact chain and payload; declining on either device immediately aborts.'}
          </p>
        </div>
        <div class="rounded-2xl p-5 bg-brand-surface/65 border border-white/10">
          <div class="text-xs font-mono text-brand-accent mb-2">03 · STANDARD SIGNATURE</div>
          <h3 class="font-semibold text-white mb-1">
            {$locale === 'zh' ? '输出零溢价原生链上签名' : 'Native Single-Sig Output'}
          </h3>
          <p class="text-xs text-white/65 leading-relaxed">
            {$locale === 'zh'
              ? '链上看来与普通单签完全一致，不暴露多签结构，享受全网最低 Gas 费与最高隐私性。'
              : 'Indistinguishable from a regular single-key signature on-chain — lowest gas and full privacy.'}
          </p>
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
              {$locale === 'zh' ? '必做安全步骤 · 分离备份' : 'ESSENTIAL · ENCRYPTED SHARE BACKUP'}
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

      <!-- Security Best Practices: 2-of-2 vs 2-of-3 -->
      <div class="grid md:grid-cols-2 gap-6 pt-2">
        <div class="rounded-2xl p-6 bg-brand-surface/70 border border-white/10 space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-md text-xs font-mono bg-brand-neon/15 text-brand-neon">
              {$locale === 'zh' ? '日常轻便方案 · 2-of-2' : 'DAILY DRIVER · 2-OF-2'}
            </span>
            <span class="text-xs text-white/50">{$locale === 'zh' ? '个人常用推荐' : 'Best for Daily DeFi'}</span>
          </div>
          <h3 class="text-xl font-bold text-white">
            {$locale === 'zh' ? 'Chrome 插件 + 桌面客户端' : 'Chrome Extension + Desktop App'}
          </h3>
          <p class="text-sm text-white/70 leading-relaxed">
            {$locale === 'zh'
              ? '两台设备同时在线即可 5 秒完成签发。请务必将两台设备的加密分片备份分别存放在两个不同的离线介质（例如加密 U 盘 A 与 U 盘 B）中。'
              : 'Sign in seconds whenever both apps are open. Store each device’s encrypted backup file on separate offline media so you can always recover from a broken laptop or browser reset.'}
          </p>
        </div>

        <div class="rounded-2xl p-6 bg-gradient-to-br from-brand-accent/15 via-brand-surface/80 to-violet-600/15 border border-brand-accent/35 space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-md text-xs font-mono bg-brand-accent/25 text-brand-accent">
              {$locale === 'zh' ? '大额金库方案 · 2-of-3' : 'HIGH-VALUE VAULT · 2-OF-3'}
            </span>
            <span class="text-xs text-brand-accent font-medium">{$locale === 'zh' ? '★ 容错防丢推荐' : '★ Loss-Tolerant'}</span>
          </div>
          <h3 class="text-xl font-bold text-white">
            {$locale === 'zh' ? 'Chrome 插件 + 常用电脑 + 备用冷设备' : 'Extension + Primary Desktop + Cold Spare'}
          </h3>
          <p class="text-sm text-white/75 leading-relaxed">
            {$locale === 'zh'
              ? '平时只用前两台协同签名；第 3 台（甚至支持 SD 卡离线 Air-Gap 模式的桌面/TUI 设备）锁进保险箱。丢一台不怕，被偷一台也无法盗币！'
              : 'Use your first two devices day to day and keep the third offline (even air-gapped via SD card). Losing any single device never freezes your funds, and stealing one never compromises them.'}
          </p>
        </div>
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
              ? '现在就升级你的加密资产安全等级'
              : 'Ready to Retire Your Paper Seed Phrases?'}
          </h2>
          <p class="text-sm sm:text-base text-white/75">
            {$locale === 'zh'
              ? '完全开源、零托管、支持四大公链。下载桌面端与浏览器插件，5 分钟拥有你自己的分布式 MPC 金库。'
              : '100% open source, zero cloud custody, and native support for ETH, BTC Taproot, SOL & SUI. Download both clients and set up your vault in 5 minutes.'}
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
