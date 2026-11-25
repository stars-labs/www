<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { locale } from '../lib/i18n';
  import {
    computeHdDerivationTrace,
    type HdDerivationTrace,
    type SandboxVault,
  } from '../lib/mpcSandbox';

  export let vault: SandboxVault;
  export let accountCount = 3;
  export let selectedChain: 'ethereum' | 'bitcoin' | 'solana' | 'sui' = 'bitcoin';
  export let selectedAccount = 0;

  let trace: HdDerivationTrace | null = null;
  let stageIdx = 0; // 0..4
  let stageProgress = 0;
  let playing = true;
  let finished = false;
  let speed: 0.5 | 1 | 2 = 1;
  let showMathTable = true;

  let rafId = 0;
  let lastTs = 0;
  let ambientTime = 0;
  let lastKey = '';

  $: effectiveChain =
    selectedChain === 'ethereum' && !vault.ecdsaGroupPubkey ? 'bitcoin' : selectedChain;

  $: {
    const key = `${vault.secp256k1GroupPubkey}:${vault.ed25519GroupPubkey}:${effectiveChain}:${selectedAccount}`;
    if (key !== lastKey) {
      lastKey = key;
      void refreshTrace(effectiveChain, selectedAccount);
    }
  }

  async function refreshTrace(chain: 'ethereum' | 'bitcoin' | 'solana' | 'sui', acct: number) {
    trace = await computeHdDerivationTrace(vault, chain, acct);
    stageIdx = 0;
    stageProgress = 0;
    playing = true;
    finished = false;
    lastTs = 0;
  }

  interface StageMeta {
    titleZh: string;
    titleEn: string;
    explainZh: string;
    explainEn: string;
    durationMs: number;
  }

  $: chainMeta = (() => {
    if (effectiveChain === 'ethereum') {
      return {
        label: 'Ethereum / 100+ EVM',
        accent: '#818cf8',
        soft: 'rgba(129,140,248,0.16)',
        curve: 'secp256k1-ecdsa (CGGMP24)',
        encTitleZh: '解压 64B (X‖Y) → Keccak-256 → 取后 20 字节 → 0x',
        encTitleEn: 'Uncompress 64B (X‖Y) → Keccak-256 → Last 20B → 0x',
        encStepsZh: ['33B 压缩公钥 P\'', '解压 64B X‖Y', 'Keccak-256', '后 20B → 0x…'],
        encStepsEn: ['33B Compressed P\'', 'Uncompress 64B', 'Keccak-256', 'Last 20B → 0x…'],
      };
    }
    if (effectiveChain === 'bitcoin') {
      return {
        label: 'Bitcoin Taproot (BIP-86)',
        accent: '#fbbf24',
        soft: 'rgba(251,191,36,0.16)',
        curve: 'secp256k1-tr (FROST BIP-340)',
        encTitleZh: 'BIP-86 TapTweak (Q = P\' + H_TapTweak(P\'_x)·G) → Bech32m → bc1p',
        encTitleEn: 'BIP-86 TapTweak (Q = P\' + H_TapTweak(P\'_x)·G) → Bech32m → bc1p',
        encStepsZh: ['内部公钥 P\'', 'TapTweak 微调 Q', '32B x-only', 'Bech32m → bc1p…'],
        encStepsEn: ['Internal Key P\'', 'TapTweak Q', '32B x-only', 'Bech32m → bc1p…'],
      };
    }
    if (effectiveChain === 'solana') {
      return {
        label: 'Solana (Ed25519)',
        accent: '#2dd4bf',
        soft: 'rgba(45,212,191,0.16)',
        curve: 'ed25519 (FROST Ed25519)',
        encTitleZh: '32 字节 Ed25519 子群公钥 P\' → 直接 Base58 编码',
        encTitleEn: '32-Byte Ed25519 Child Group Key P\' → Direct Base58 Encoding',
        encStepsZh: ['32B Ed25519 P\'', '零额外哈希', 'Base58 编码', 'Solana 原生地址'],
        encStepsEn: ['32B Ed25519 P\'', 'No Extra Hash', 'Base58 Encode', 'Solana Address'],
      };
    }
    return {
      label: 'Sui (Ed25519)',
      accent: '#22d3ee',
      soft: 'rgba(34,211,238,0.16)',
      curve: 'ed25519 (FROST Ed25519)',
      encTitleZh: '拼入方案标志位 0x00 ‖ 32B Ed25519 公钥 → SHA3-256 → 0x',
      encTitleEn: 'Prefix Flag 0x00 ‖ 32B Ed25519 Key → SHA3-256 → 0x',
      encStepsZh: ['0x00 ‖ 32B P\'', '33B 编码载荷', 'SHA3-256 哈希', '32B → 0x…'],
      encStepsEn: ['0x00 ‖ 32B P\'', '33B Payload', 'SHA3-256 Hash', '32B → 0x…'],
    };
  })();

  $: stages = [
    {
      titleZh: '第 1 步 · 从根群公钥导出 Root ChainCode（仅用公钥，0 私钥介入！）',
      titleEn: 'Step 1 · Derive Root ChainCode from Group Pubkey (Public-Only!)',
      explainZh:
        '完全不需要解锁密码或私钥分片！把 DKG 产出的根群公钥丢进 HMAC-SHA512("frost-hd-root", P_root)，取后 32 字节作为根链码 ChainCode。这就是“观察钱包也能无限派新地址”的原因。',
      explainEn:
        'Zero password or key share needed! Feeding the DKG root group public key into HMAC-SHA512("frost-hd-root", P_root)[32..64] yields the 32-byte Root ChainCode.',
      durationMs: 2500,
    },
    {
      titleZh: `第 2 步 · 沿 BIP-44/86 路径 ${trace?.path || ''} 逐层做 HMAC-SHA512 迭代`,
      titleEn: `Step 2 · Walk Path ${trace?.path || ''} via Iterative HMAC-SHA512`,
      explainZh:
        '每经过路径中的一层索引（比如币种 60\'、账户 #0），就做一次 HMAC-SHA512(chaincode, parent_key ‖ index)：前 32 字节变成公开标量偏移 δ，后 32 字节变成下一层的 ChainCode！',
      explainEn:
        'At every path segment, HMAC-SHA512(chaincode, parent_key ‖ index) outputs a 32-byte public scalar offset δ and the next 32-byte ChainCode.',
      durationMs: 3200,
    },
    {
      titleZh: '第 3 步 · 同态加法平移：为什么「不需要重跑 DKG」也能派生无限子账户？',
      titleEn: 'Step 3 · Homomorphic Additive Shift: Why Zero Extra DKG Is Needed!',
      explainZh:
        '最核心的密码学魔法：公钥侧算 P\' = P + (Σδ)·G；签名时每台设备只需在本地把自己的分片加上同一个公开偏移 s_i\' = s_i + Σδ。因为拉格朗日权重之和 Σλ_i = 1，合起来的秘密恰好变成 s + Σδ，0 字节通信、安全等级丝毫不变！',
      explainEn:
        'Homomorphic magic: public side computes P\' = P + (Σδ)·G; when signing, each device locally adds the same public shift s_i\' = s_i + Σδ. Since Lagrange weights sum to Σλ_i = 1, the joint secret becomes s + Σδ with 0 bytes on the wire!',
      durationMs: 3400,
    },
    {
      titleZh: `第 4 步 · 公链专属地址编码：${chainMeta.encTitleZh}`,
      titleEn: `Step 4 · Chain Address Encoding: ${chainMeta.encTitleEn}`,
      explainZh:
        effectiveChain === 'ethereum'
          ? '把派生出的 33B 压缩 secp256k1 公钥解压成 64B (X‖Y)，计算 Keccak-256 哈希并截取最后 20 字节，即得到原生 0x 地址——在以太坊主网、Arbitrum、Base、Optimism、BNB 等 100+ EVM 链完全通用！'
          : effectiveChain === 'bitcoin'
            ? '按 BIP-86 标准对内部公钥 P\' 做一次 TapTweak 微调（Q = P\' + H_TapTweak(P\'_x)·G），取 32B x-only 输出公钥做 Bech32m (SegWit v1) 编码，生成原生 Taproot bc1p… 地址！'
            : effectiveChain === 'solana'
              ? 'Solana 直接把 32 字节 Ed25519 子群公钥做 Base58 编码作为收款地址，无需额外哈希，与 Phantom 等标准钱包 100% 一致！'
              : 'Sui 先在 32 字节 Ed25519 子群公钥前拼上 1 字节曲线标志位 0x00（共 33B），再做 SHA3-256 哈希输出 32 字节 0x… 地址！',
      explainEn:
        effectiveChain === 'ethereum'
          ? 'Decompress the 33B child secp256k1 key to 64B (X‖Y), compute Keccak-256, and take the last 20 bytes → native 0x address shared across 100+ EVM chains!'
          : effectiveChain === 'bitcoin'
            ? 'Apply the BIP-86 TapTweak (Q = P\' + H_TapTweak(P\'_x)·G) and encode the 32B x-only output key with Bech32m SegWit v1 → native bc1p… Taproot address!'
            : effectiveChain === 'solana'
              ? 'Solana encodes the raw 32-byte Ed25519 child public key directly in Base58 with no extra hash step!'
              : 'Sui prefixes the 32-byte Ed25519 key with 0x00 (Ed25519 scheme flag) and hashes with SHA3-256 → 32-byte 0x… address!',
      durationMs: 3000,
    },
    {
      titleZh: `第 5 步 · 派生完成！Account #${selectedAccount} 的 ${chainMeta.label} 地址与各机子分片 100% 对齐`,
      titleEn: `Step 5 · Derived! Account #${selectedAccount} ${chainMeta.label} Address & Child Shares Aligned`,
      explainZh:
        '看看每台设备的根分片指纹如何无交互地映射为该账户的子分片指纹，且全程未动用 1 字节网络流量。点击下方任意其他账户或切换公链可随时重演！',
      explainEn:
        'Each device independently derives its child share fingerprint with 0 bytes of network traffic, staying 100% aligned with the derived public address!',
      durationMs: 2600,
    },
  ] as StageMeta[];

  $: currentStage = stages[stageIdx] ?? stages[0];

  function tick(ts: number) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(80, ts - lastTs);
    lastTs = ts;
    ambientTime += dt;

    if (playing && currentStage) {
      const dur = Math.max(1200, currentStage.durationMs) / speed;
      stageProgress += dt / dur;
      if (stageProgress >= 1) {
        if (stageIdx < stages.length - 1) {
          stageIdx += 1;
          stageProgress = 0;
        } else {
          stageProgress = 1;
          playing = false;
          finished = true;
        }
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  onMount(() => {
    rafId = requestAnimationFrame(tick);
  });

  onDestroy(() => {
    if (rafId) cancelAnimationFrame(rafId);
  });

  function jumpStage(idx: number) {
    stageIdx = Math.max(0, Math.min(stages.length - 1, idx));
    stageProgress = 0;
    playing = true;
    finished = false;
    lastTs = 0;
  }

  function togglePlay() {
    if (finished) {
      jumpStage(0);
      return;
    }
    playing = !playing;
    lastTs = 0;
  }

  $: pulse = (ambientTime % 1800) / 1800;
  $: easeP = stageProgress < 0.5 ? 4 * Math.pow(stageProgress, 3) : 1 - Math.pow(-2 * stageProgress + 2, 3) / 2;
</script>

{#if trace}
  <div class="rounded-2xl border border-indigo-400/35 bg-[#090f1d] shadow-[0_18px_50px_rgba(0,0,0,0.55)] overflow-hidden">
    <!-- Header + Chain/Account Pickers + Playback Controls -->
    <div class="px-4 sm:px-5 py-3 border-b border-white/10 bg-white/[0.025] flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full {playing ? 'bg-indigo-400 animate-ping' : 'bg-emerald-400'}"></span>
        <span class="text-xs sm:text-sm font-bold text-white">
          {$locale === 'zh' ? '🌳 实时 HD 派生算法可视化（真实 HMAC-SHA512 + WASM）' : '🌳 Live HD Derivation Visualizer (Real HMAC-SHA512 + WASM)'}
        </span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/8 text-white/75 border border-white/15">
          {trace.path} · {trace.elapsedMs.toFixed(1)} ms
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          on:click={() => jumpStage(Math.max(0, stageIdx - 1))}
          disabled={stageIdx === 0}
          class="px-2.5 py-1 rounded-lg bg-white/8 hover:bg-white/15 disabled:opacity-35 text-[11px] font-mono text-white cursor-pointer"
        >
          ⏮ {$locale === 'zh' ? '上一步' : 'Prev'}
        </button>
        <button
          type="button"
          on:click={togglePlay}
          class="px-3 py-1 rounded-lg bg-indigo-500/25 hover:bg-indigo-500/35 border border-indigo-400/45 text-[11px] font-mono font-bold text-indigo-200 cursor-pointer"
        >
          {playing ? ($locale === 'zh' ? '⏸ 暂停' : '⏸ Pause') : finished ? ($locale === 'zh' ? '🔄 重播' : '🔄 Replay') : ($locale === 'zh' ? '▶ 继续' : '▶ Play')}
        </button>
        <button
          type="button"
          on:click={() => jumpStage(stageIdx < stages.length - 1 ? stageIdx + 1 : 0)}
          class="px-2.5 py-1 rounded-lg bg-white/8 hover:bg-white/15 text-[11px] font-mono text-white cursor-pointer"
        >
          {stageIdx < stages.length - 1 ? ($locale === 'zh' ? '下一步 ⏭' : 'Next ⏭') : ($locale === 'zh' ? '重头看 🔄' : 'Restart 🔄')}
        </button>
        <div class="flex items-center rounded-lg bg-black/50 border border-white/10 p-0.5 ml-1">
          {#each [0.5, 1, 2] as sp}
            <button
              type="button"
              on:click={() => (speed = sp as 0.5 | 1 | 2)}
              class="px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer {speed === sp
                ? 'bg-indigo-500/45 text-white font-bold'
                : 'text-white/55 hover:text-white'}"
            >
              {sp}×
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Interactive Chain & Account Selector Strip -->
    <div class="px-4 sm:px-5 py-2.5 border-b border-white/10 bg-black/35 flex flex-wrap items-center justify-between gap-2.5">
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="text-[11px] font-mono text-white/50 mr-1">{$locale === 'zh' ? '选择算法链路:' : 'Chain Algorithm:'}</span>
        {#if vault.ecdsaGroupPubkey}
          <button
            type="button"
            on:click={() => (selectedChain = 'ethereum')}
            class="px-2.5 py-1 rounded-lg text-[11px] font-mono border cursor-pointer transition {effectiveChain === 'ethereum'
              ? 'bg-indigo-500/25 border-indigo-400 text-indigo-200 font-bold'
              : 'bg-white/[0.03] border-white/10 text-white/65 hover:text-white'}"
          >
            Ethereum (Keccak256)
          </button>
        {/if}
        <button
          type="button"
          on:click={() => (selectedChain = 'bitcoin')}
          class="px-2.5 py-1 rounded-lg text-[11px] font-mono border cursor-pointer transition {effectiveChain === 'bitcoin'
            ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-bold'
            : 'bg-white/[0.03] border-white/10 text-white/65 hover:text-white'}"
        >
          Bitcoin Taproot (BIP-86)
        </button>
        <button
          type="button"
          on:click={() => (selectedChain = 'solana')}
          class="px-2.5 py-1 rounded-lg text-[11px] font-mono border cursor-pointer transition {effectiveChain === 'solana'
            ? 'bg-teal-500/25 border-teal-400 text-teal-200 font-bold'
            : 'bg-white/[0.03] border-white/10 text-white/65 hover:text-white'}"
        >
          Solana (Base58)
        </button>
        <button
          type="button"
          on:click={() => (selectedChain = 'sui')}
          class="px-2.5 py-1 rounded-lg text-[11px] font-mono border cursor-pointer transition {effectiveChain === 'sui'
            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-bold'
            : 'bg-white/[0.03] border-white/10 text-white/65 hover:text-white'}"
        >
          Sui (SHA3-256)
        </button>
      </div>

      <div class="flex items-center gap-1.5">
        <span class="text-[11px] font-mono text-white/50">{$locale === 'zh' ? '子账户:' : 'Account:'}</span>
        {#each Array.from({ length: Math.min(accountCount, 6) }, (_, i) => i) as idx}
          <button
            type="button"
            on:click={() => (selectedAccount = idx)}
            class="px-2 py-0.5 rounded text-[11px] font-mono border cursor-pointer {selectedAccount === idx
              ? 'bg-brand-neon/20 border-brand-neon text-brand-neon font-bold'
              : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white'}"
          >
            #{idx}
          </button>
        {/each}
      </div>
    </div>

    <!-- Clickable 5-Stage Timeline -->
    <div class="px-4 sm:px-5 py-2 border-b border-white/10 bg-black/25 flex items-center gap-2 overflow-x-auto">
      {#each [
        { zh: '1 · 根链码', en: '1 · ChainCode' },
        { zh: '2 · 路径迭代', en: '2 · Path Walk' },
        { zh: '3 · 同态平移', en: '3 · Homomorphic' },
        { zh: '4 · 地址编码', en: '4 · Encoding' },
        { zh: '5 · 对齐验算', en: '5 · Verified' },
      ] as pill, idx}
        {@const active = idx === stageIdx}
        {@const done = idx < stageIdx || (idx === stageIdx && finished)}
        <button
          type="button"
          on:click={() => jumpStage(idx)}
          class="relative flex-1 min-w-[110px] text-left px-3 py-1.5 rounded-xl border text-[11px] font-mono transition cursor-pointer overflow-hidden {active
            ? 'border-indigo-400/70 bg-indigo-500/15 text-white font-bold'
            : done
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
              : 'border-white/10 bg-white/[0.02] text-white/55 hover:text-white'}"
        >
          {#if active}
            <div class="absolute inset-y-0 left-0 bg-indigo-400/20 pointer-events-none" style="width: {Math.round(stageProgress * 100)}%"></div>
          {/if}
          <span class="relative">{done && !active ? '✓ ' : ''}{$locale === 'zh' ? pill.zh : pill.en}</span>
        </button>
      {/each}
    </div>

    <!-- Plain-Language Narration -->
    <div class="px-4 sm:px-6 py-3 border-b border-white/10 bg-gradient-to-r from-indigo-500/[0.09] via-cyan-500/[0.05] to-transparent space-y-1">
      <div class="text-xs sm:text-sm font-bold text-white">
        {$locale === 'zh' ? currentStage.titleZh : currentStage.titleEn}
      </div>
      <p class="text-xs sm:text-[13px] text-white/80 leading-relaxed">
        {$locale === 'zh' ? currentStage.explainZh : currentStage.explainEn}
      </p>
    </div>

    <!-- Interactive SVG Algorithm Diagram -->
    <div class="bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.10),rgba(9,15,29,0.98)_74%)] px-2 sm:px-4 py-3">
      <svg viewBox="0 0 880 355" class="w-full h-auto max-h-[370px] select-none" role="img" aria-label="HD derivation algorithm visualization">
        <defs>
          <pattern id="hd-dots" width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.85" fill="rgba(255,255,255,0.07)" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="880" height="355" fill="url(#hd-dots)" />

        {#if stageIdx === 0}
          <!-- STAGE 0: Root Group Pubkey -> HMAC-SHA512("frost-hd-root") -> Root ChainCode -->
          <g transform="translate(150, 175)">
            <rect x="-112" y="-58" width="224" height="116" rx="16" fill="#111a30" stroke={chainMeta.accent} stroke-width="2.2" />
            <text y="-26" text-anchor="middle" fill={chainMeta.accent} font-size="11" font-weight="700" font-family="ui-monospace,monospace">
              ROOT GROUP PUBKEY (P)
            </text>
            <text y="-4" text-anchor="middle" fill="#fff" font-size="11.5" font-weight="700">{chainMeta.curve}</text>
            <rect x="-98" y="10" width="196" height="28" rx="8" fill="rgba(255,255,255,0.06)" />
            <text y="28" text-anchor="middle" fill="#67e8f9" font-size="10" font-family="ui-monospace,monospace">
              {trace.rootGroupPubkeyHex.slice(0, 22)}…
            </text>
          </g>

          <!-- Animated flow arrow 1 -->
          <line x1="262" y1="175" x2="348" y2="175" stroke="#22d3ee" stroke-width="2.4" stroke-dasharray="6 5" />
          <circle cx={262 + 86 * easeP} cy="175" r="6" fill="#22d3ee" stroke="#fff" stroke-width="1.5" />

          <!-- HMAC Box -->
          <g transform="translate(445, 175)">
            <rect
              x={-98 - pulse * 5}
              y={-64 - pulse * 4}
              width={196 + pulse * 10}
              height={128 + pulse * 8}
              rx="20"
              fill="none"
              stroke="#22d3ee"
              stroke-opacity={(1 - pulse) * 0.45}
              stroke-width="1.6"
            />
            <rect x="-95" y="-60" width="190" height="120" rx="18" fill="#0d172c" stroke="#22d3ee" stroke-width="2.4" />
            <text y="-26" text-anchor="middle" fill="#67e8f9" font-size="12" font-weight="800" font-family="ui-monospace,monospace">
              HMAC-SHA512
            </text>
            <text y="-4" text-anchor="middle" fill="#e2e8f0" font-size="10.5" font-family="ui-monospace,monospace">
              key = "frost-hd-root"
            </text>
            <text y="16" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="ui-monospace,monospace">
              data = P_root ({trace.rootGroupPubkeyHex.length / 2} B)
            </text>
            <rect x="-78" y="28" width="156" height="22" rx="7" fill="rgba(52,211,153,0.16)" stroke="#34d399" stroke-opacity="0.5" />
            <text y="42.5" text-anchor="middle" fill="#a7f3d0" font-size="9.5" font-weight="700">
              🔒 {$locale === 'zh' ? '0 私钥参与 · 纯公钥计算' : '0 Private Key · Public Only'}
            </text>
          </g>

          <!-- Animated flow arrow 2 -->
          <line x1="540" y1="175" x2="624" y2="175" stroke="#a78bfa" stroke-width="2.4" stroke-dasharray="6 5" />
          <circle cx={540 + 84 * easeP} cy="175" r="6" fill="#a78bfa" stroke="#fff" stroke-width="1.5" />

          <!-- Output Root ChainCode -->
          <g transform="translate(736, 175)">
            <rect x="-112" y="-58" width="224" height="116" rx="16" fill="#131630" stroke="#a78bfa" stroke-width="2.2" />
            <text y="-24" text-anchor="middle" fill="#ddd6fe" font-size="11" font-weight="700" font-family="ui-monospace,monospace">
              ROOT CHAINCODE (32B)
            </text>
            <text y="-3" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="ui-monospace,monospace">
              result[32..64]
            </text>
            <rect x="-98" y="10" width="196" height="28" rx="8" fill="rgba(167,139,250,0.14)" />
            <text y="28" text-anchor="middle" fill="#e9d5ff" font-size="10" font-family="ui-monospace,monospace">
              {trace.rootChainCodeHex.slice(0, 22)}…
            </text>
          </g>

        {:else if stageIdx === 1}
          <!-- STAGE 1: Hop-by-hop BIP-44/86 Path Walk -->
          {@const hopCount = trace.hops.length}
          {@const activeHopFloat = easeP * hopCount}
          <text x="440" y="36" text-anchor="middle" fill="#e2e8f0" font-size="12.5" font-weight="700" font-family="ui-monospace,monospace">
            {$locale === 'zh' ? '逐层路径迭代公式：' : 'Per-Level Formula: '}
            (δ_k ‖ CC_k) = HMAC-SHA512(CC_k-1, Pub_k-1 ‖ index_be32)
          </text>

          {#each trace.hops as hop, idx (hop.depth)}
            {@const spacing = Math.min(156, 740 / hopCount)}
            {@const startX = 440 - ((hopCount - 1) * spacing) / 2}
            {@const x = startX + idx * spacing}
            {@const reached = activeHopFloat >= idx}
            {@const current = activeHopFloat >= idx && activeHopFloat < idx + 1}

            {#if idx > 0}
              <line
                x1={x - spacing + 58}
                y1="158"
                x2={x - 58}
                y2="158"
                stroke={reached ? '#22d3ee' : 'rgba(148,163,184,0.22)'}
                stroke-width="2.4"
                stroke-dasharray="5 4"
              />
            {/if}

            <g transform="translate({x}, 158)">
              <rect
                x="-64"
                y="-64"
                width="128"
                height="128"
                rx="15"
                fill={current ? '#162544' : '#111a30'}
                stroke={current ? '#22d3ee' : reached ? chainMeta.accent : 'rgba(255,255,255,0.16)'}
                stroke-width={current ? '2.6' : '1.8'}
              />
              <text y="-38" text-anchor="middle" fill="#94a3b8" font-size="9.5" font-family="ui-monospace,monospace">
                LEVEL #{hop.depth}
              </text>
              <text y="-14" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="800" font-family="ui-monospace,monospace">
                /{hop.segmentLabel}
              </text>
              <text y="8" text-anchor="middle" fill={hop.hardened ? '#fbbf24' : '#67e8f9'} font-size="9" font-family="ui-monospace,monospace">
                {hop.hardened ? '0x80000000 | i' : `index = ${hop.indexU32}`}
              </text>
              <rect x="-54" y="20" width="108" height="32" rx="7" fill="rgba(34,211,238,0.12)" />
              <text y="33" text-anchor="middle" fill="#67e8f9" font-size="8.5" font-weight="700" font-family="ui-monospace,monospace">
                δ_{hop.depth}: {hop.offsetSeedHex.slice(0, 10)}…
              </text>
              <text y="46" text-anchor="middle" fill="#c4b5fd" font-size="8.2" font-family="ui-monospace,monospace">
                CC: {hop.chainCodeHex.slice(0, 10)}…
              </text>
            </g>
          {/each}

          <!-- Summed Offset Summary Pill -->
          <g transform="translate(440, 296)">
            <rect x="-295" y="-26" width="590" height="52" rx="14" fill="#0d172c" stroke="#34d399" stroke-width="1.8" />
            <text y="-4" text-anchor="middle" fill="#a7f3d0" font-size="11.5" font-weight="700" font-family="ui-monospace,monospace">
              Σδ = δ₁ + δ₂ + … + δ_{hopCount} (mod n)  →  {$locale === 'zh' ? '所有设备独立算出完全相同的公开偏移量 Σδ！' : 'Every device computes the EXACT same public shift Σδ!'}
            </text>
            <text y="15" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="ui-monospace,monospace">
              Final Hop ChainCode: {trace.hops[trace.hops.length - 1]?.chainCodeHex.slice(0, 32)}…
            </text>
          </g>

        {:else if stageIdx === 2}
          <!-- STAGE 2: Homomorphic Additive Shift (Public Side vs 3 Devices Share Side) -->
          <!-- Top Track: Public Only -->
          <g transform="translate(440, 74)">
            <rect x="-392" y="-48" width="784" height="96" rx="16" fill="rgba(34,211,238,0.07)" stroke="#22d3ee" stroke-width="1.8" />
            <text x="-370" y="-22" fill="#67e8f9" font-size="11" font-weight="800" font-family="ui-monospace,monospace">
              🌐 {$locale === 'zh' ? '公钥侧（查收款地址 · 0 私钥 / 0 密码）' : 'PUBLIC SIDE (Address Listing · 0 Private Key)'}
            </text>
            <text x="-370" y="10" fill="#ffffff" font-size="14" font-weight="800" font-family="ui-monospace,monospace">
              P_child = P_root + (Σδ) · G
            </text>
            <text x="-370" y="32" fill="#94a3b8" font-size="10.5" font-family="ui-monospace,monospace">
              P_root: {trace.rootGroupPubkeyHex.slice(0, 26)}…  +  Σδ·G  →  Account #{trace.account}
            </text>
            <circle cx={-120 + 460 * easeP} cy="6" r="6" fill="#22d3ee" stroke="#fff" stroke-width="1.5" />
          </g>

          <!-- Center Lagrange Proof Banner -->
          <g transform="translate(440, 168)">
            <rect x="-320" y="-26" width="640" height="52" rx="14" fill="#171232" stroke="#a78bfa" stroke-width="2" />
            <text y="-3" text-anchor="middle" fill="#e9d5ff" font-size="12" font-weight="800" font-family="ui-monospace,monospace">
              ✨ {$locale === 'zh' ? '拉格朗日同态守恒：' : 'Lagrange Conservation: '} Σλ_i = 1  ⇒  Σλ_i(s_i + Σδ) = s + Σδ
            </text>
            <text y="16" text-anchor="middle" fill="#a7f3d0" font-size="10" font-family="ui-monospace,monospace">
              {$locale === 'zh' ? '无需额外 DKG · 网络流量 = 0 bytes · 任意 t 台设备的子分片依然严格匹配 P_child！' : 'Zero Extra DKG · 0 Bytes on Wire · Any t Child Shares Still Sign for P_child!'}
            </text>
          </g>

          <!-- Bottom Track: 3 Isolated Devices Shifting Locally -->
          {#each trace.childShareSamples as dev, idx (dev.devIndex)}
            {@const x = 160 + idx * 280}
            <g transform="translate({x}, 276)">
              <rect x="-118" y="-54" width="236" height="108" rx="15" fill="#111a30" stroke="#34d399" stroke-width="1.8" />
              <text y="-28" text-anchor="middle" fill="#ffffff" font-size="11.5" font-weight="700">
                #{dev.devIndex} {$locale === 'zh' ? dev.labelZh : dev.labelEn}
              </text>
              <text y="-6" text-anchor="middle" fill="#a7f3d0" font-size="12" font-weight="800" font-family="ui-monospace,monospace">
                s_{dev.devIndex}' = s_{dev.devIndex} + Σδ
              </text>
              <text y="16" text-anchor="middle" fill="#94a3b8" font-size="9.5" font-family="ui-monospace,monospace">
                Root FP: {dev.rootFp}
              </text>
              <rect x="-102" y="24" width="204" height="22" rx="7" fill="rgba(52,211,153,0.16)" />
              <text y="38.5" text-anchor="middle" fill="#6ee7b7" font-size="9.5" font-weight="700" font-family="ui-monospace,monospace">
                → Child FP: {dev.childFp}
              </text>
            </g>
          {/each}

        {:else if stageIdx === 3}
          <!-- STAGE 3: Chain-Specific 4-Box Address Encoding Pipeline -->
          {@const encSteps = $locale === 'zh' ? chainMeta.encStepsZh : chainMeta.encStepsEn}
          <text x="440" y="42" text-anchor="middle" fill={chainMeta.accent} font-size="13" font-weight="800" font-family="ui-monospace,monospace">
            {chainMeta.label} · {$locale === 'zh' ? '公链专属地址编码流水线' : 'Chain Address Encoding Pipeline'}
          </text>

          {#each encSteps as stepLabel, idx}
            {@const x = 122 + idx * 212}
            {@const reached = easeP * 4 >= idx}
            {@const activeBox = easeP * 4 >= idx && easeP * 4 < idx + 1}

            {#if idx > 0}
              <line x1={x - 130} y1="162" x2={x - 82} y2="162" stroke={reached ? chainMeta.accent : 'rgba(255,255,255,0.18)'} stroke-width="2.5" stroke-dasharray="5 4" />
              {#if activeBox}
                <circle cx={x - 130 + 48 * ((easeP * 4) % 1)} cy="162" r="5.5" fill={chainMeta.accent} stroke="#fff" stroke-width="1.5" />
              {/if}
            {/if}

            <g transform="translate({x}, 162)">
              <rect
                x="-82"
                y="-56"
                width="164"
                height="112"
                rx="16"
                fill={activeBox ? '#18223d' : '#111a30'}
                stroke={reached ? chainMeta.accent : 'rgba(255,255,255,0.16)'}
                stroke-width={activeBox ? '2.6' : '1.8'}
              />
              <text y="-26" text-anchor="middle" fill="#94a3b8" font-size="9.5" font-family="ui-monospace,monospace">
                STAGE {idx + 1}/4
              </text>
              <text y="6" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="800">
                {stepLabel}
              </text>
              <text y="32" text-anchor="middle" fill={reached ? '#34d399' : '#64748b'} font-size="9.5" font-family="ui-monospace,monospace">
                {reached ? '✓ executed' : 'pending'}
              </text>
            </g>
          {/each}

          <!-- Real Encoded Output Preview -->
          <g transform="translate(440, 294)">
            <rect x="-360" y="-30" width="720" height="60" rx="14" fill="#0b1d1c" stroke="#34d399" stroke-width="2" />
            <text y="-8" text-anchor="middle" fill="#6ee7b7" font-size="10.5" font-weight="700" font-family="ui-monospace,monospace">
              REAL WASM OUTPUT · {trace.path}
            </text>
            <text y="15" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="800" font-family="ui-monospace,monospace">
              {trace.finalAddress}
            </text>
          </g>

        {:else}
          <!-- STAGE 4: Final Verification Convergence -->
          <g transform="translate(440, 174)">
            <rect
              x={-375 - pulse * 6}
              y={-124 - pulse * 5}
              width={750 + pulse * 12}
              height={248 + pulse * 10}
              rx="22"
              fill="none"
              stroke="#34d399"
              stroke-opacity={(1 - pulse) * 0.45}
              stroke-width="1.8"
            />
            <rect x="-370" y="-118" width="740" height="236" rx="20" fill="#0b1a1f" stroke="#34d399" stroke-width="2.2" />
            <text y="-78" text-anchor="middle" fill="#34d399" font-size="12" font-weight="800" font-family="ui-monospace,monospace">
              ✓ {$locale === 'zh' ? '全客户端字节级一致 · ZERO-DKG HD 派生完成' : 'BYTE-FOR-BYTE IDENTICAL ACROSS ALL CLIENTS · ZERO-DKG HD READY'}
            </text>
            <text y="-48" text-anchor="middle" fill="#ffffff" font-size="15" font-weight="800">
              Account #{trace.account} · {chainMeta.label} ({trace.path})
            </text>
            <rect x="-335" y="-26" width="670" height="44" rx="12" fill="rgba(0,0,0,0.45)" stroke={chainMeta.accent} stroke-width="1.4" />
            <text y="1" text-anchor="middle" fill={chainMeta.accent} font-size="12.5" font-weight="800" font-family="ui-monospace,monospace">
              {trace.finalAddress}
            </text>

            {#each trace.childShareSamples as dev, idx}
              <g transform="translate({-220 + idx * 220}, 66)">
                <rect x="-98" y="-28" width="196" height="56" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(52,211,153,0.45)" />
                <text y="-7" text-anchor="middle" fill="#fff" font-size="10.5" font-weight="700">
                  #{dev.devIndex} {$locale === 'zh' ? dev.labelZh : dev.labelEn}
                </text>
                <text y="14" text-anchor="middle" fill="#a7f3d0" font-size="9.5" font-family="ui-monospace,monospace">
                  Child FP: {dev.childFp}
                </text>
              </g>
            {/each}
          </g>
        {/if}
      </svg>

      <div class="flex items-center justify-between px-2 pt-2 border-t border-white/8 text-[11px] font-mono text-white/55">
        <span>
          {$locale === 'zh'
            ? '💡 提示：点击下方任意账户的地址卡片，可一键把该链与账户载入上方动画实时拆解！'
            : '💡 Tip: Click any address card below to trace that exact chain & account live above!'}
        </span>
        <button
          type="button"
          on:click={() => (showMathTable = !showMathTable)}
          class="text-indigo-300 hover:underline cursor-pointer shrink-0 ml-2"
        >
          {showMathTable
            ? $locale === 'zh'
              ? '收起逐层 HMAC 中间值 ▲'
              : 'Hide HMAC Trace ▲'
            : $locale === 'zh'
              ? '展开逐层 HMAC-SHA512 中间值 ▼'
              : 'Show HMAC-SHA512 Trace ▼'}
        </button>
      </div>
    </div>

    <!-- Real Per-Hop HMAC-SHA512 Trace Table -->
    {#if showMathTable}
      <div class="px-4 sm:px-5 py-3 border-t border-white/10 bg-black/45 space-y-1.5 text-[11px] font-mono">
        <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-400/25">
          <span class="text-indigo-200 font-bold">ROOT · HMAC-SHA512("frost-hd-root", P_root)</span>
          <span class="text-white/75">ChainCode: {trace.rootChainCodeHex.slice(0, 32)}…</span>
        </div>
        {#each trace.hops as hop}
          <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-white/[0.025] border border-white/8">
            <div class="flex items-center gap-2">
              <span class="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 font-bold">
                /{hop.segmentLabel}
              </span>
              <span class="text-white/60">u32=0x{hop.indexU32.toString(16).padStart(8, '0')}</span>
            </div>
            <div class="flex flex-wrap items-center gap-3 text-[10.5px]">
              <span class="text-emerald-300">δ_{hop.depth}={hop.offsetSeedHex.slice(0, 18)}…</span>
              <span class="text-violet-300">CC_{hop.depth}={hop.chainCodeHex.slice(0, 18)}…</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
