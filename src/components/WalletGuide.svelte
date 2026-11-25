<script lang="ts">
  import { locale } from '../lib/i18n';
  import { navigateTo } from '../lib/router';
  import AnnotatedScreenshot from './AnnotatedScreenshot.svelte';
  import MpcPlayground from './MpcPlayground.svelte';
  import {
    chainFamilies,
    extensionShots,
    desktopShots,
    tuiShots,
    cliShots,
    comparisons,
    faqs,
  } from '../lib/walletGuideData';

  let openFaq: number | null = 0;
  let activeLesson: 'dkg' | 'multisig' | 'broadcast' = 'dkg';
  let clientFilter: 'all' | 'extension' | 'desktop' | 'tui' | 'cli' = 'all';

  function toggleFaq(index: number) {
    openFaq = openFaq === index ? null : index;
  }

  function scrollToStep(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function selectClientAndScroll(tab: 'all' | 'extension' | 'desktop' | 'tui' | 'cli', anchorId: string) {
    clientFilter = tab;
    setTimeout(() => scrollToStep(anchorId), 40);
  }

  const totalShots = extensionShots.length + desktopShots.length + tuiShots.length + cliShots.length;

  const stepsNav = [
    { id: 'playground', num: '⚡', en: 'Live WASM Sandbox', zh: '在线 WASM 体验' },
    { id: 'chains', num: '链', en: 'All Chains', zh: '全链支持' },
    { id: 'concepts', num: '00', en: '2-Round DKG · Multi-Sig · Broadcast', zh: '2轮DKG/多签/广播原理' },
    { id: 'client-extension', num: '01', en: `Extension (${extensionShots.length} GIFs)`, zh: `Chrome 插件 (${extensionShots.length}动图)` },
    { id: 'client-desktop', num: '02', en: `Desktop (${desktopShots.length} GIFs)`, zh: `桌面端 (${desktopShots.length}动图)` },
    { id: 'client-tui', num: '03', en: `Terminal TUI (${tuiShots.length} GIFs)`, zh: `终端 TUI (${tuiShots.length}动图)` },
    { id: 'client-cli', num: '04', en: `Headless CLI (${cliShots.length} GIFs)`, zh: `命令行 CLI (${cliShots.length}动图)` },
    { id: 'faq', num: 'FAQ', en: 'Checklist & FAQ', zh: '避坑与问答' },
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
    <div class="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
      <!-- Hero copy -->
      <div class="lg:col-span-5 space-y-6">
        <div
          class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-brand-neon/30 text-xs font-mono text-brand-neon tracking-wide"
        >
          <span class="w-2 h-2 rounded-full bg-brand-neon animate-pulse"></span>
          {$locale === 'zh'
            ? `STARLAB MPC 全景实战教程 · 四大客户端 · ${totalShots} 组实机操作 GIF 动图`
            : `STARLAB MPC COMPLETE GUIDE · 4 CLIENTS · ${totalShots} LIVE OPERATION GIFS`}
        </div>

        <h1 class="text-4xl sm:text-5xl lg:text-[3.3rem] font-extrabold tracking-tight leading-[1.12]">
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
            底层采用与 <strong>Ledger 硬件钱包同级</strong> 的 <code>secp256k1 + Ed25519</code> 曲线底座，支持 <strong>100+ EVM 链 + Bitcoin Taproot + Solana + Sui + Aptos</strong>。本页提供 <strong>{totalShots} 组实机动态 GIF 操作演示</strong>，覆盖 <strong>Chrome 插件、Desktop 桌面端、Terminal TUI、Headless CLI</strong> 四大客户端，把 <strong>2 轮 DKG、2 轮门限多签、交易广播上链</strong> 每一步点击动效一次看懂！
          {:else}
            Powered by the same <code>secp256k1 + Ed25519</code> curve foundation as <strong>Ledger</strong> — covering <strong>100+ EVM chains + Bitcoin Taproot + Solana + Sui + Aptos</strong>. Explore <strong>{totalShots} real animated operation GIFs</strong> across <strong>Chrome Extension, Desktop, Terminal TUI, and Headless CLI</strong> showing every click of <strong>2-Round DKG, 2-Round Multi-Sig, and Broadcasting</strong>.
          {/if}
        </p>

        <!-- Primary CTAs -->
        <div class="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            on:click={() => scrollToStep('playground')}
            class="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-accent to-violet-600 text-white font-bold text-sm sm:text-base shadow-[0_10px_30px_rgba(233,69,96,0.4)] hover:brightness-110 transition cursor-pointer"
          >
            {$locale === 'zh' ? '⚡ 立即免安装在线体验 WASM 真机沙盒 ↓' : '⚡ Try Live WASM MPC Sandbox Now ↓'}
          </button>
          <button
            type="button"
            on:click={() => selectClientAndScroll('all', 'client-atlas')}
            class="px-5 py-3.5 rounded-xl bg-brand-neon/15 hover:bg-brand-neon/25 border border-brand-neon/40 text-brand-neon font-semibold text-sm sm:text-base transition cursor-pointer"
          >
            {$locale === 'zh' ? `查看四端 ${totalShots} 组操作 GIF 动图 ↓` : `View All ${totalShots} Operation GIFs ↓`}
          </button>
        </div>

        <!-- Download row -->
        <div class="flex flex-wrap items-center gap-3 pt-1 text-xs sm:text-sm">
          <a
            href="https://github.com/stars-labs/starlab-wallet/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            class="px-3.5 py-2 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 border border-violet-400/35 text-violet-200 font-medium transition"
          >
            {$locale === 'zh' ? '下载浏览器插件 (Chrome / Edge / Firefox)' : 'Download Extension (Chrome / Edge / Firefox)'} &nearr;
          </a>
          <a
            href="https://github.com/stars-labs/starlab-desktop/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            class="px-3.5 py-2 rounded-lg bg-white/8 hover:bg-white/15 border border-white/15 text-white/90 font-medium transition"
          >
            {$locale === 'zh' ? '下载桌面端 (macOS / Linux / Win)' : 'Download Desktop (macOS / Linux / Win)'} &nearr;
          </a>
          <a
            href="https://github.com/stars-labs/starlab-mpc/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            class="px-3.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 text-emerald-200 font-medium transition"
          >
            {$locale === 'zh' ? '下载 TUI / CLI (macOS / Linux / Win)' : 'Download TUI / CLI (macOS / Linux / Win)'} &nearr;
          </a>
        </div>
      </div>

      <!-- Hero visual showcase: side-by-side non-overlapping Desktop + Extension GIFs -->
      <div class="lg:col-span-7">
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div class="sm:col-span-8 rounded-2xl border border-white/15 bg-[#101626] shadow-[0_24px_70px_rgba(0,0,0,0.65)] overflow-hidden">
            <div class="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-black/40 border-b border-white/10">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="w-2.5 h-2.5 rounded-full bg-[#ff5f56] shrink-0"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] shrink-0"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-[#27c93f] shrink-0"></span>
                <span class="ml-1.5 text-xs font-mono text-white/65 truncate">Starlab Desktop</span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                ● LIVE GIF
              </span>
            </div>
            <img
              src="/wallet-guide/hero-desktop-flow.gif"
              alt="Starlab Desktop live MPC DKG and threshold signing animation"
              class="w-full h-auto block"
            />
          </div>

          <div class="sm:col-span-4 max-w-[260px] sm:max-w-none mx-auto w-full rounded-2xl border border-violet-400/35 bg-[#14182a] shadow-[0_24px_70px_rgba(0,0,0,0.75)] overflow-hidden ring-1 ring-white/10">
            <div class="px-3 py-2 bg-violet-600/25 border-b border-white/10 flex items-center justify-between gap-2">
              <span class="text-[11px] font-mono text-violet-200 truncate">Extension</span>
              <span class="text-[10px] font-mono text-emerald-300 shrink-0">● LIVE GIF</span>
            </div>
            <img
              src="/wallet-guide/hero-ext-flow.gif"
              alt="Starlab Chrome Extension live DKG and wallet walkthrough animation"
              class="w-full h-auto block"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 4 Client Overview Strip -->
    <div class="mt-16 sm:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4">
      <button
        type="button"
        on:click={() => selectClientAndScroll('all', 'client-extension')}
        class="text-left rounded-2xl p-5 bg-brand-surface/70 border border-violet-400/25 hover:border-violet-400/60 transition cursor-pointer"
      >
        <div class="text-xs font-mono uppercase tracking-wider text-violet-300 mb-1">01 · CHROME EXTENSION ({extensionShots.length} GIFS)</div>
        <div class="text-lg font-bold text-white">{$locale === 'zh' ? '浏览器插件' : 'Browser Extension'}</div>
        <p class="text-xs text-white/60 mt-1">
          {$locale === 'zh'
            ? '连 dApp、自动广播、YubiKey / Ledger WebHID 与限额风控'
            : 'dApp auto-broadcast, YubiKey & Ledger WebHID, spending policy'}
        </p>
      </button>
      <button
        type="button"
        on:click={() => selectClientAndScroll('all', 'client-desktop')}
        class="text-left rounded-2xl p-5 bg-brand-surface/70 border border-brand-accent/25 hover:border-brand-accent/60 transition cursor-pointer"
      >
        <div class="text-xs font-mono uppercase tracking-wider text-brand-accent mb-1">02 · DESKTOP GUI ({desktopShots.length} GIFS)</div>
        <div class="text-lg font-bold text-white">{$locale === 'zh' ? '桌面客户端' : 'Starlab Desktop'}</div>
        <p class="text-xs text-white/60 mt-1">
          {$locale === 'zh'
            ? 'Rust + Iced 原生跨平台协签器、HD 多账户与加密备份'
            : 'Native Rust Iced co-signer, HD accounts & share backup'}
        </p>
      </button>
      <button
        type="button"
        on:click={() => selectClientAndScroll('all', 'client-tui')}
        class="text-left rounded-2xl p-5 bg-brand-surface/70 border border-emerald-400/25 hover:border-emerald-400/60 transition cursor-pointer"
      >
        <div class="text-xs font-mono uppercase tracking-wider text-emerald-300 mb-1">03 · TERMINAL TUI ({tuiShots.length} GIFS)</div>
        <div class="text-lg font-bold text-white">{$locale === 'zh' ? '终端 TUI' : 'Starlab TUI'}</div>
        <p class="text-xs text-white/60 mt-1">
          {$locale === 'zh'
            ? '支持 SSH / 树莓派 / 断网 SD 卡冷存的 Ratatui 终端界面'
            : 'Ratatui terminal UI with Online mesh & Offline cold mode'}
        </p>
      </button>
      <button
        type="button"
        on:click={() => selectClientAndScroll('all', 'client-cli')}
        class="text-left rounded-2xl p-5 bg-brand-surface/70 border border-brand-neon/25 hover:border-brand-neon/60 transition cursor-pointer"
      >
        <div class="text-xs font-mono uppercase tracking-wider text-brand-neon mb-1">04 · HEADLESS CLI ({cliShots.length} GIFS)</div>
        <div class="text-lg font-bold text-white">{$locale === 'zh' ? '命令行 CLI' : 'Starlab CLI'}</div>
        <p class="text-xs text-white/60 mt-1">
          {$locale === 'zh'
            ? '2 轮 DKG/签名全日志、无感自动化协签与 Reshare 分片刷新'
            : '2-round DKG/signing traces, automation daemon & reshare'}
        </p>
      </button>
    </div>
  </section>

  <!-- STICKY NAVIGATOR -->
  <div class="sticky top-16 z-40 backdrop-blur-md bg-[#0f141e]/90 border-y border-white/10">
    <div class="max-w-7xl mx-auto px-4 md:px-10 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
      {#each stepsNav as st}
        <button
          type="button"
          on:click={() => {
            if (st.id.startsWith('client-')) clientFilter = 'all';
            setTimeout(() => scrollToStep(st.id), 20);
          }}
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white/5 hover:bg-brand-accent/20 text-white/80 hover:text-white border border-white/10 hover:border-brand-accent/40 transition shrink-0 cursor-pointer"
        >
          <span class="font-mono text-brand-neon text-[11px]">{st.num}</span>
          <span>{$locale === 'zh' ? st.zh : st.en}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- LIVE INTERACTIVE WASM MPC SANDBOX -->
  <div class="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-14 pb-6">
    <MpcPlayground />
  </div>

  <!-- FULL CHAIN COVERAGE SECTION (LEDGER-SCALE) -->
  <section id="chains" class="relative z-10 scroll-mt-36 max-w-7xl mx-auto px-6 md:px-10 pt-12 pb-10 space-y-8">
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
          Ledger 之所以能支持上百条公链，本质上是底层支持了 <strong>secp256k1</strong> 与 <strong>Ed25519</strong> 两条密码学曲线。Starlab MPC 用<strong>门限密码学</strong>完整覆盖了同样的曲线底座——<strong>一次创建，全 EVM 生态上百条链（含自定义 RPC）、Bitcoin Taproot、Solana、Sui、Aptos 全部打通</strong>，并且插件原生支持 WebHID 直连你现有的 Ledger 硬件钱包！
        {:else}
          Ledger supports hundreds of networks because virtually all major blockchains run on two elliptic curves: <strong>secp256k1</strong> and <strong>Ed25519</strong>. Starlab MPC implements threshold signing across the exact same curves — unlocking <strong>100+ EVM networks (plus any custom RPC), Bitcoin Taproot, Solana, Sui, and Aptos</strong> from a single vault, while also connecting physical Ledger devices via WebHID.
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

  <!-- BEGINNER MASTERCLASS: 2-ROUND DKG · 2-ROUND MULTI-SIG · BROADCAST -->
  <section id="concepts" class="relative z-10 scroll-mt-36 max-w-7xl mx-auto px-6 md:px-10 py-14 space-y-8">
    <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      <div class="max-w-3xl space-y-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-brand-accent/20 text-brand-accent border border-brand-accent/40">
          {$locale === 'zh' ? 'STEP 00 · 零基础彻底讲透核心协议' : 'STEP 00 · COMPLETE PROTOCOL MASTERCLASS'}
        </div>
        <h2 class="text-2xl sm:text-4xl font-bold">
          {$locale === 'zh'
            ? '白话拆解每一轮：2 轮 DKG、2 轮门限多签、交易广播'
            : 'Every Single Round Explained: 2-Round DKG, 2-Round Multi-Sig & Broadcast'}
        </h2>
        <p class="text-sm sm:text-base text-white/70 leading-relaxed">
          {$locale === 'zh'
            ? '不讲晦涩公式，用大白话 + 真实字节数据包，让你彻底弄明白为什么 DKG 要跑两轮、为什么多签也要跑两轮、以及签完名是怎么广播上链的。'
            : 'No opaque math jargon — plain language plus real wire payloads explaining why DKG takes 2 rounds, why threshold signing takes 2 rounds, and how transactions broadcast on-chain.'}
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
          1. {$locale === 'zh' ? '2 轮 DKG 全拆解' : '2-Round DKG Explained'}
        </button>
        <button
          type="button"
          on:click={() => (activeLesson = 'multisig')}
          class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition cursor-pointer {activeLesson === 'multisig'
            ? 'bg-violet-500/20 text-violet-200 border-violet-400/50 shadow-[0_0_20px_rgba(167,139,250,0.2)]'
            : 'bg-white/5 text-white/70 border-white/10 hover:text-white'}"
        >
          2. {$locale === 'zh' ? '2 轮门限多签全拆解' : '2-Round Multi-Sig'}
        </button>
        <button
          type="button"
          on:click={() => (activeLesson = 'broadcast')}
          class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition cursor-pointer {activeLesson === 'broadcast'
            ? 'bg-brand-accent/20 text-brand-accent border-brand-accent/50 shadow-[0_0_20px_rgba(233,69,96,0.2)]'
            : 'bg-white/5 text-white/70 border-white/10 hover:text-white'}"
        >
          3. {$locale === 'zh' ? '交易广播上链 5 步' : '5-Step Broadcast'}
        </button>
      </div>
    </div>

    <!-- Lesson 1: 2-Round DKG -->
    {#if activeLesson === 'dkg'}
      <div class="rounded-3xl p-6 sm:p-8 bg-[#121826]/95 border border-brand-neon/30 shadow-2xl space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span class="text-xs font-mono text-brand-neon uppercase tracking-wider">LESSON 01 · 2-ROUND DISTRIBUTED KEY GENERATION (FROST + CGGMP24)</span>
            <h3 class="text-xl sm:text-2xl font-bold mt-1">
              {$locale === 'zh'
                ? '2 轮 DKG 到底每轮在算什么、传什么？为什么绝不产生完整私钥？'
                : 'What Happens in DKG Round 1 vs Round 2? Why No Seed Phrase Ever Exists'}
            </h3>
          </div>
          <span class="px-3 py-1.5 rounded-lg text-xs font-mono bg-brand-neon/10 text-brand-neon border border-brand-neon/30 shrink-0">
            {$locale === 'zh' ? '建库时仅运行 1 次 · 全员须在线' : 'Runs ONCE at Setup · All n Devices Online'}
          </span>
        </div>

        <div class="rounded-2xl p-5 bg-black/35 border border-white/10 text-sm text-white/85 leading-relaxed">
          <strong class="text-brand-neon">
            {$locale === 'zh' ? '🎯 一句话白话类比：' : '🎯 Plain-English Analogy:'}
          </strong>
          {#if $locale === 'zh'}
            想象 3 个人各自心里想一个秘密数字，要合造一把保险柜锁（公钥），但谁都不许把自己的秘密告诉别人。如果一轮定胜负，最后报数的人就能作弊操纵结果；所以必须分<strong>两轮</strong>：<strong>第 1 轮先把「密封承诺信封」全部放桌上</strong>，谁都不能反悔；<strong>第 2 轮再点对点互相递加密碎片并验算</strong>。最后每个人手里只有 1 块加密分片，<strong>完整私钥从始至终从未在任何电脑里出现过！</strong>
          {:else}
            Imagine 3 devices inventing one shared vault lock (public key) without any single device ever knowing the full master key. If done in 1 round, the last device could rig the result. So DKG takes <strong>2 rounds</strong>: <strong>Round 1 seals public commitments on the table</strong> so nobody can cheat; <strong>Round 2 delivers encrypted point-to-point shares</strong> that every receiver mathematically verifies against Round 1!
          {/if}
        </div>

        <!-- Explicit Round 0 / Round 1 / Round 2 / Finalize breakdown -->
        <div class="grid lg:grid-cols-2 gap-5">
          <div class="rounded-2xl p-5 bg-cyan-500/8 border border-cyan-400/30 space-y-3">
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-500/20 text-cyan-200">
                ROUND 1 · 第一轮：公开承诺（Commitment）
              </span>
              <span class="text-[11px] font-mono text-white/55">DKG_ROUND1 · ~135B</span>
            </div>
            <ul class="space-y-2 text-xs sm:text-sm text-white/80 leading-relaxed list-disc list-inside">
              {#if $locale === 'zh'}
                <li><strong>本地造秘密多项式</strong>：每台设备用本地硬件真随机数生成自己的秘密多项式（别人永远看不到），决定门限 <code>t</code> 的阶数。</li>
                <li><strong>广播 Feldman 承诺</strong>：算出对应的公钥承诺包（约 135 字节 <code>DKG_ROUND1</code>）通过 WebRTC 广播给房间内其他所有设备。</li>
                <li><strong>作用（防作弊锁死）</strong>：等收齐全部 <code>n</code> 台设备的 Round 1 承诺后，所有人的数学“起跑线”被永久锁定，才能进入 Round 2。</li>
              {:else}
                <li><strong>Local secret polynomial</strong>: each device samples its own random polynomial of degree <code>t - 1</code> locally (never leaves the device).</li>
                <li><strong>Broadcast Feldman commitment</strong>: broadcasts a ~135-byte <code>DKG_ROUND1</code> public commitment package to every peer over WebRTC.</li>
                <li><strong>Anti-cheating lock</strong>: Round 2 cannot start until all <code>n</code> peers’ Round 1 commitments arrive and lock in.</li>
              {/if}
            </ul>
          </div>

          <div class="rounded-2xl p-5 bg-violet-500/10 border border-violet-400/30 space-y-3">
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-violet-500/25 text-violet-200">
                ROUND 2 · 第二轮：点对点秘密分片（Secret Shares）
              </span>
              <span class="text-[11px] font-mono text-white/55">DKG_ROUND2 · ~131B</span>
            </div>
            <ul class="space-y-2 text-xs sm:text-sm text-white/80 leading-relaxed list-disc list-inside">
              {#if $locale === 'zh'}
                <li><strong>点对点单独发送</strong>：每台设备调用 <code>frost_core::keys::dkg::part2</code>，为其余每台设备算出专属的 131 字节秘密分片，<strong>仅一对一发给对应设备</strong>（不广播！）。</li>
                <li><strong>零知识防作弊验算</strong>：收到分片后，用对方 Round 1 发来的公开承诺做椭圆曲线等式验证——如果有人乱发假数据，立刻报错中止！</li>
                <li><strong>Finalize 合成落盘</strong>：调用 <code>part3</code> 把收到的分片相加得到本机最终密钥分片，把所有承诺相加得到全链公钥地址，立即用本地密码（AES-256-GCM）加密存储。</li>
              {:else}
                <li><strong>Point-to-point private delivery</strong>: calls <code>frost_core::keys::dkg::part2</code> to compute a tailored 131-byte secret share for each peer, sent strictly 1-to-1 over WebRTC.</li>
                <li><strong>Zero-knowledge verification</strong>: every receiver checks the share mathematically against Round 1’s public commitment—bad shares abort immediately.</li>
                <li><strong>Finalize & encrypt</strong>: <code>part3</code> sums received shares into this device’s final share and derives the identical multi-chain addresses, locking the share with AES-256-GCM.</li>
              {/if}
            </ul>
          </div>
        </div>

        <!-- EVM CGGMP24 note -->
        <div class="rounded-2xl p-4 bg-amber-500/10 border border-amber-400/25 text-xs sm:text-sm text-white/80 leading-relaxed">
          <strong class="text-amber-300">
            {$locale === 'zh' ? '⚡ 补充：为什么 EVM 链还需要 1~2 分钟「Secure setup（安全素数）」？' : '⚡ Why does EVM setup also show “Secure setup” (Safe Primes)?'}
          </strong>
          <span class="ml-1">
            {$locale === 'zh'
              ? 'Bitcoin Taproot / Solana / Sui 使用 2 轮 FROST Schnorr（不到 2 秒即可算完）；而以太坊及全 EVM 链使用 CGGMP24 门限 ECDSA，需要预先在后台生成 Paillier 同态加密安全素数（桌面端约 1.5 分钟、浏览器 WASM 约 2–4 分钟）。Starlab 会在打开软件时自动后台预生成，下次建库可秒速复用！'
              : 'Bitcoin Taproot / Solana / Sui finish 2-round FROST in ~2 seconds. Ethereum & all EVM chains run CGGMP24 threshold ECDSA, which requires Paillier safe primes (~1.5 min native, ~2–4 min WASM) pre-generated automatically in the background.'}
          </span>
        </div>
      </div>

    <!-- Lesson 2: 2-Round Multi-Sig -->
    {:else if activeLesson === 'multisig'}
      <div class="rounded-3xl p-6 sm:p-8 bg-[#121826]/95 border border-violet-400/35 shadow-2xl space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span class="text-xs font-mono text-violet-300 uppercase tracking-wider">LESSON 02 · 2-ROUND THRESHOLD MULTI-SIG (CO-SIGNING)</span>
            <h3 class="text-xl sm:text-2xl font-bold mt-1">
              {$locale === 'zh'
                ? '2 轮门限多签怎么协同盖章？为什么比 Safe 合约多签更省 Gas、更隐私？'
                : 'How 2-Round Threshold Multi-Sig Works — Lower Gas & Better Privacy Than Safe'}
            </h3>
          </div>
          <span class="px-3 py-1.5 rounded-lg text-xs font-mono bg-violet-500/15 text-violet-200 border border-violet-400/35 shrink-0">
            {$locale === 'zh' ? '每次转账/授权时触发 · 仅需 t 台设备' : 'Runs on Every Spend · Only t Devices Needed'}
          </span>
        </div>

        <div class="rounded-2xl p-5 bg-black/35 border border-white/10 text-sm text-white/85 leading-relaxed">
          <strong class="text-violet-300">
            {$locale === 'zh' ? '🎯 MPC 门限多签 vs Safe 合约多签：' : '🎯 MPC Threshold vs Smart-Contract Multisig:'}
          </strong>
          {#if $locale === 'zh'}
            Safe 合约多签需要在每条链花钱部署合约、每笔转账 Gas 贵、链上公开暴露所有管理员且不支持比特币；而 <strong>Starlab 门限多签</strong>由任意 <code>t</code> 台设备在<strong>链下跑完 2 轮协同计算</strong>，直接输出 1 个标准单签签名：<strong>0 合约部署费、全网最低 Gas、全链通用、链上根本看不出你是多签！</strong>
          {:else}
            Contract multisigs (Safe) pay deployment + higher gas per chain, expose signer lists on-chain, and don’t work natively on Bitcoin/Solana. <strong>Starlab Threshold Multi-Sig</strong> runs 2 off-chain rounds across any <code>t</code> devices to output 1 standard single-key signature: <strong>$0 deployment, lowest gas, every chain, zero on-chain exposure.</strong>
          {/if}
        </div>

        <div class="grid lg:grid-cols-2 gap-5">
          <div class="rounded-2xl p-5 bg-cyan-500/8 border border-cyan-400/30 space-y-3">
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-500/20 text-cyan-200">
                SIGN ROUND 1 · 第一轮：一次性随机数承诺
              </span>
              <span class="text-[11px] font-mono text-white/55">SIGN_COMMIT · 69B</span>
            </div>
            <ul class="space-y-2 text-xs sm:text-sm text-white/80 leading-relaxed list-disc list-inside">
              {#if $locale === 'zh'}
                <li><strong>独立核验防钓鱼</strong>：发起方广播待签交易摘要后，协签设备弹窗显示链名、发件地址与内容——发现任何异常直接点「拒绝」中止！</li>
                <li><strong>锁定 t 台签发者</strong>：例如 2-of-3 时，只要任意 2 台同意即可开签，第 3 台冷设备无需开机。</li>
                <li><strong>交换 69 字节随机数承诺</strong>：每台签发者生成全新一次性随机数（Nonce），把公开承诺 <code>SIGN_COMMIT</code> 发给对方，防止私钥通过重复随机数泄露。</li>
              {:else}
                <li><strong>Independent phishing review</strong>: co-signers inspect the chain, sender, and payload—declining on any device aborts instantly.</li>
                <li><strong>Lock t-signer quorum</strong>: in 2-of-3, any 2 devices lock the signer set; the 3rd stays offline.</li>
                <li><strong>Exchange 69-byte nonce commitments</strong>: each signer sends fresh single-use <code>SIGN_COMMIT</code> over WebRTC.</li>
              {/if}
            </ul>
          </div>

          <div class="rounded-2xl p-5 bg-violet-500/10 border border-violet-400/30 space-y-3">
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-violet-500/25 text-violet-200">
                SIGN ROUND 2 · 第二轮：局部签名分片与聚合
              </span>
              <span class="text-[11px] font-mono text-white/55">SIGN_SHARE · 32B</span>
            </div>
            <ul class="space-y-2 text-xs sm:text-sm text-white/80 leading-relaxed list-disc list-inside">
              {#if $locale === 'zh'}
                <li><strong>算出 32 字节局部签名</strong>：收齐所有签发者的 Round 1 承诺后，每台设备用本机加密分片算出 32 字节局部签名 <code>SIGN_SHARE</code> 发给对方。</li>
                <li><strong>聚合为原生链上单签</strong>：集齐 <code>t</code> 份局部签名后自动聚合成标准单签签名（EVM 输出 65 字节低-s <code>r‖s‖v</code>，BTC Taproot 输出 64 字节 BIP-340，SOL/SUI 输出 64 字节 Ed25519）。</li>
                <li><strong>单设备绝对拦截</strong>：实测如果少于门限 <code>t</code> 台设备在线，协议 100% 无法算出合法签名（详见下方桌面端截图 09）。</li>
              {:else}
                <li><strong>Compute 32-byte partial signature</strong>: using Round 1 commitments + local share, each device sends its 32-byte <code>SIGN_SHARE</code>.</li>
                <li><strong>Aggregate standard signature</strong>: combines <code>t</code> shares into a standard single-sig output (65-byte low-s ECDSA for EVM, 64-byte BIP-340 for BTC, 64-byte Ed25519 for SOL/SUI).</li>
                <li><strong>Cryptographic quorum enforcement</strong>: fewer than <code>t</code> devices can never forge a valid signature.</li>
              {/if}
            </ul>
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
            <strong>「签名（Sign）」</strong>就像两个人在支票上盖完章——此时钱还没扣，因为银行还没收到支票。<strong>「广播（Broadcast）」</strong>就是把盖好章的原始交易字节流（Raw Signed Tx）递交给区块链的 <strong>RPC 节点</strong>，节点验签通过后打包进区块，你的转账才算真正到账！
          {:else}
            <strong>Signing</strong> stamps a check with both required signatures—no money moves until the bank receives it. <strong>Broadcasting</strong> submits that raw signed transaction to a blockchain <strong>RPC node</strong>, which validates it and confirms it in a block!
          {/if}
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div class="rounded-xl p-4 bg-white/[0.03] border border-white/10 space-y-1.5">
            <div class="text-[11px] font-mono text-brand-neon">① BUILD 构造</div>
            <h4 class="font-semibold text-white text-sm">{$locale === 'zh' ? '自动补全参数' : 'Fill Nonce & Gas'}</h4>
            <p class="text-xs text-white/65 leading-relaxed">
              {$locale === 'zh'
                ? '自动查询链上 pending nonce、估算 Gas（+20% 防失败余量）与 EIP-1559 费率，封装原生币或 ERC-20 转账。'
                : 'Fetches pending nonce, estimates gas (+20% headroom) & EIP-1559 fees for native or ERC-20 transfers.'}
            </p>
          </div>
          <div class="rounded-xl p-4 bg-white/[0.03] border border-white/10 space-y-1.5">
            <div class="text-[11px] font-mono text-violet-300">② SIGN 2轮多签</div>
            <h4 class="font-semibold text-white text-sm">{$locale === 'zh' ? '双端协同盖章' : '2-Round Co-Sign'}</h4>
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

        <div class="grid md:grid-cols-2 gap-4 pt-1">
          <div class="rounded-2xl p-5 bg-emerald-500/10 border border-emerald-400/30 space-y-2">
            <div class="text-xs font-mono text-emerald-300 font-semibold">
              {$locale === 'zh' ? '方式 A · 日常最省心（插件 / dApp 自动广播）' : 'MODE A · EVERYDAY (AUTO-BROADCAST IN EXTENSION)'}
            </div>
            <p class="text-xs sm:text-sm text-white/80 leading-relaxed">
              {$locale === 'zh'
                ? '在 Chrome 插件内点 Send 转账，或连接 Uniswap / OpenSea / Aave 发起交易：双端批准签名后，插件自动组装并调用当前网络 RPC 的 eth_sendRawTransaction 广播上链，立即返回 Tx Hash，小白零手动操作！'
                : 'When sending inside the Chrome Extension or using any dApp (Uniswap, Aave, OpenSea): once co-signers approve, the extension automatically assembles and broadcasts via eth_sendRawTransaction and returns the live Tx Hash.'}
            </p>
          </div>
          <div class="rounded-2xl p-5 bg-sky-500/10 border border-sky-400/30 space-y-2">
            <div class="text-xs font-mono text-sky-300 font-semibold">
              {$locale === 'zh' ? '方式 B · 高级冷签（Desktop / TUI / CLI 手动广播）' : 'MODE B · AIR-GAP / MANUAL BROADCAST'}
            </div>
            <p class="text-xs sm:text-sm text-white/80 leading-relaxed">
              {$locale === 'zh'
                ? '在桌面端、TUI 或 CLI 签出原始签名并拼好 Raw Signed Tx 后，直接提交给任意公开广播页（etherscan.io/pushTx、mempool.space/tx/push）或用 curl 发往 RPC（详见 CLI 截图 04）——广播数据不含任何私钥分片，签名机可全程断网！'
                : 'When signing raw digests via Desktop, TUI, or CLI, paste the assembled raw tx hex into etherscan.io/pushTx, mempool.space/tx/push, or curl your RPC (see CLI Shot 04)—reveals zero secret share info.'}
            </p>
          </div>
        </div>
      </div>
    {/if}
  </section>

  <!-- ==================== 4-CLIENT VISUAL ATLAS (ALL 36 REAL ANNOTATED SCREENSHOTS) ==================== -->
  <main id="client-atlas" class="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-10 space-y-20">
    <!-- Atlas header + filter pills -->
    <div class="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#161c2e] via-[#13192a] to-[#1a1630] border border-white/12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div class="space-y-2">
        <span class="text-xs font-mono uppercase tracking-widest text-brand-neon">
          {$locale === 'zh' ? `全套 ${totalShots} 组实机动态 GIF 操作图鉴` : `COMPLETE ${totalShots}-GIF INTERACTIVE WALKTHROUGH`}
        </span>
        <h2 class="text-2xl sm:text-3xl font-extrabold">
          {$locale === 'zh'
            ? '四大客户端逐屏操作 GIF 动图（自动演示点击与跳转，点图放大，悬停编号定位）'
            : 'Every Screen Across All 4 Clients — Live Operation GIFs (Click to Zoom)'}
        </h2>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          on:click={() => (clientFilter = 'all')}
          class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition cursor-pointer {clientFilter === 'all'
            ? 'bg-white text-black border-white'
            : 'bg-white/5 text-white/75 border-white/15 hover:text-white'}"
        >
          {$locale === 'zh' ? `全部四端 (${totalShots}动图)` : `All 4 Clients (${totalShots} GIFs)`}
        </button>
        <button
          type="button"
          on:click={() => (clientFilter = 'extension')}
          class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition cursor-pointer {clientFilter === 'extension'
            ? 'bg-violet-500 text-white border-violet-400'
            : 'bg-violet-500/10 text-violet-200 border-violet-400/30 hover:bg-violet-500/20'}"
        >
          Chrome Extension ({extensionShots.length})
        </button>
        <button
          type="button"
          on:click={() => (clientFilter = 'desktop')}
          class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition cursor-pointer {clientFilter === 'desktop'
            ? 'bg-brand-accent text-white border-brand-accent'
            : 'bg-brand-accent/10 text-brand-accent border-brand-accent/30 hover:bg-brand-accent/20'}"
        >
          Desktop ({desktopShots.length})
        </button>
        <button
          type="button"
          on:click={() => (clientFilter = 'tui')}
          class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition cursor-pointer {clientFilter === 'tui'
            ? 'bg-emerald-500 text-black border-emerald-400'
            : 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/20'}"
        >
          Terminal TUI ({tuiShots.length})
        </button>
        <button
          type="button"
          on:click={() => (clientFilter = 'cli')}
          class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition cursor-pointer {clientFilter === 'cli'
            ? 'bg-brand-neon text-black border-brand-neon'
            : 'bg-brand-neon/10 text-brand-neon border-brand-neon/30 hover:bg-brand-neon/20'}"
        >
          Headless CLI ({cliShots.length})
        </button>
      </div>
    </div>

    <!-- ==================== CLIENT 1: CHROME EXTENSION (15 SHOTS) ==================== -->
    {#if clientFilter === 'all' || clientFilter === 'extension'}
      <section id="client-extension" class="scroll-mt-36 space-y-8">
        <div class="border-b border-white/10 pb-5 space-y-2">
          <div class="flex flex-wrap items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-400/40">
              CLIENT 01 · CHROME EXTENSION
            </span>
            <span class="text-xs font-mono text-white/50">
              {extensionShots.length} {$locale === 'zh' ? '组操作 GIF 动图 · 日常 Web3 & 自动广播主力' : 'LIVE OPERATION GIFS · EVERYDAY WEB3 & AUTO-BROADCAST'}
            </span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-bold">
            {$locale === 'zh'
              ? 'Chrome 浏览器插件（starlab-wallet）全流程 15 屏逐帧图解'
              : 'Chrome Browser Extension (starlab-wallet) — Full 15-Screen Walkthrough'}
          </h2>
          <p class="text-sm sm:text-base text-white/70 max-w-4xl leading-relaxed">
            {$locale === 'zh'
              ? '从首次打开选择 YubiKey/密码解锁、接入 Ledger WebHID、配置 Room ID 与 2-of-2/2-of-3 门限、实时跑完 2 轮 DKG 加密落盘，到日常四链收款、多金库切换、单笔/日限额风控与 3 曲线加密备份——一步不落。'
              : 'Every screen from YubiKey/password setup, Ledger WebHID integration, Room ID pairing, 2-round DKG keygen, multi-chain receiving, and multi-vault switching to Spending Policy guardrails and 3-file encrypted share backup.'}
          </p>
        </div>

        <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          {#each extensionShots as shot (shot.id)}
            <div class="space-y-2.5 flex flex-col">
              <div class="flex items-center justify-between px-1">
                <span class="text-[11px] font-mono text-violet-300 uppercase tracking-wider">{shot.stepTag}</span>
              </div>
              <AnnotatedScreenshot
                src={shot.src}
                alt={shot.alt}
                device="extension"
                titleEn={shot.titleEn}
                titleZh={shot.titleZh}
                callouts={shot.callouts}
              />
              <p class="text-xs text-white/65 px-1 leading-relaxed">
                {$locale === 'zh' ? shot.summaryZh : shot.summaryEn}
              </p>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- ==================== CLIENT 2: STARLAB DESKTOP (11 SHOTS) ==================== -->
    {#if clientFilter === 'all' || clientFilter === 'desktop'}
      <section id="client-desktop" class="scroll-mt-36 space-y-8">
        <div class="border-b border-white/10 pb-5 space-y-2">
          <div class="flex flex-wrap items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-brand-accent/20 text-brand-accent border border-brand-accent/40">
              CLIENT 02 · STARLAB DESKTOP
            </span>
            <span class="text-xs font-mono text-white/50">
              {desktopShots.length} {$locale === 'zh' ? '组操作 GIF 动图 · 原生 Rust + Iced 跨平台桌面协签器' : 'LIVE OPERATION GIFS · NATIVE RUST ICED DESKTOP CO-SIGNER'}
            </span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-bold">
            {$locale === 'zh'
              ? '桌面客户端（starlab-desktop）全流程 11 屏逐帧图解'
              : 'Starlab Desktop App (starlab-desktop) — Full 11-Screen Walkthrough'}
          </h2>
          <p class="text-sm sm:text-base text-white/70 max-w-4xl leading-relaxed">
            {$locale === 'zh'
              ? '完整展示桌面端如何预热安全素数、一键加入插件邀请、跨端混编（Desktop + TUI + Extension 同房协同）、发起以太坊 CGGMP24 与比特币 Taproot 门限签名、单设备拒签实证、免 DKG 派生 Account 3，以及离线加密备份恢复。'
              : 'Follow Starlab Desktop from safe-prime pre-generation and one-click invite joining to cross-client 3-device interop, Ethereum & Bitcoin Taproot signing, single-device quorum blocking, instant HD Account 3 derivation, and encrypted share backup.'}
          </p>
        </div>

        <div class="grid lg:grid-cols-2 gap-8 items-start">
          {#each desktopShots as shot (shot.id)}
            <div class="space-y-2.5 flex flex-col">
              <div class="flex items-center justify-between px-1">
                <span class="text-[11px] font-mono text-brand-accent uppercase tracking-wider">{shot.stepTag}</span>
              </div>
              <AnnotatedScreenshot
                src={shot.src}
                alt={shot.alt}
                device="desktop"
                titleEn={shot.titleEn}
                titleZh={shot.titleZh}
                callouts={shot.callouts}
              />
              <p class="text-xs sm:text-sm text-white/65 px-1 leading-relaxed">
                {$locale === 'zh' ? shot.summaryZh : shot.summaryEn}
              </p>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- ==================== CLIENT 3: STARLAB TUI (6 SHOTS) ==================== -->
    {#if clientFilter === 'all' || clientFilter === 'tui'}
      <section id="client-tui" class="scroll-mt-36 space-y-8">
        <div class="border-b border-white/10 pb-5 space-y-2">
          <div class="flex flex-wrap items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
              CLIENT 03 · TERMINAL TUI
            </span>
            <span class="text-xs font-mono text-white/50">
              {tuiShots.length} {$locale === 'zh' ? '组终端操作 GIF 动图 · 极客 / SSH / 断网冷存专属' : 'TERMINAL OPERATION GIFS · SSH & AIR-GAP COLD STORAGE'}
            </span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-bold">
            {$locale === 'zh'
              ? '终端客户端（starlab-tui）6 屏实战：在线热签 & 离线冷存模式'
              : 'Starlab Terminal UI (starlab-tui) — 6 Real Ratatui Screens'}
          </h2>
          <p class="text-sm sm:text-base text-white/70 max-w-4xl leading-relaxed">
            {$locale === 'zh'
              ? '纯 Rust Ratatui 打造的零依赖终端界面，与桌面端共享本地加密 Keystore，适合放进无桌面环境的 Linux 服务器、树莓派或彻底断网的老笔记本作为 2-of-3 第 3 台冷签节点。'
              : 'Zero-GUI Ratatui terminal client sharing the exact same encrypted keystore as Desktop — ideal for headless Linux boxes, Raspberry Pi signers, or dedicated air-gapped laptops in a 2-of-3 vault.'}
          </p>
        </div>

        <div class="grid lg:grid-cols-2 gap-8 items-start">
          {#each tuiShots as shot (shot.id)}
            <div class="space-y-2.5 flex flex-col">
              <div class="flex items-center justify-between px-1">
                <span class="text-[11px] font-mono text-emerald-300 uppercase tracking-wider">{shot.stepTag}</span>
              </div>
              <AnnotatedScreenshot
                src={shot.src}
                alt={shot.alt}
                device="tui"
                titleEn={shot.titleEn}
                titleZh={shot.titleZh}
                callouts={shot.callouts}
              />
              <p class="text-xs sm:text-sm text-white/65 px-1 leading-relaxed">
                {$locale === 'zh' ? shot.summaryZh : shot.summaryEn}
              </p>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- ==================== CLIENT 4: STARLAB CLI (4 SHOTS) ==================== -->
    {#if clientFilter === 'all' || clientFilter === 'cli'}
      <section id="client-cli" class="scroll-mt-36 space-y-8">
        <div class="border-b border-white/10 pb-5 space-y-2">
          <div class="flex flex-wrap items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-brand-neon/15 text-brand-neon border border-brand-neon/40">
              CLIENT 04 · HEADLESS CLI
            </span>
            <span class="text-xs font-mono text-white/50">
              {cliShots.length} {$locale === 'zh' ? '组双节点协议演示 GIF 动图 · 看清 2 轮 DKG 与 2 轮签名的每个字节' : 'DUAL-NODE PROTOCOL TRACE GIFS · EVERY ROUND VISIBLE'}
            </span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-bold">
            {$locale === 'zh'
              ? '命令行引擎（starlab-cli）4 屏硬核实战：2 轮 DKG · HD 派生 · 2 轮签名 · Reshare 与广播'
              : 'Headless CLI (starlab-cli) — 2-Round DKG, HD Accounts, 2-Round Signing, Reshare & Broadcast'}
          </h2>
          <p class="text-sm sm:text-base text-white/70 max-w-4xl leading-relaxed">
            {$locale === 'zh'
              ? '适合机构自动化出金、CI/服务器守护协签节点（serve --auto-approve），也是学习底层协议最直观的窗口：直接看到 Round 1 公开承诺（135B）、Round 2 秘密分片（131B）、SIGN_COMMIT（69B）、SIGN_SHARE（32B）、不换地址 Reshare 刷新分片以及 RPC 广播上链！'
              : 'Built for treasury automation and server co-signers (serve --auto-approve), and the clearest window into the wire protocol: watch 135B DKG Round 1, 131B DKG Round 2, 69B SIGN_COMMIT, 32B SIGN_SHARE, address-preserving Reshare, and eth_sendRawTransaction broadcast live.'}
          </p>
        </div>

        <div class="grid lg:grid-cols-2 gap-8 items-start">
          {#each cliShots as shot (shot.id)}
            <div class="space-y-2.5 flex flex-col">
              <div class="flex items-center justify-between px-1">
                <span class="text-[11px] font-mono text-brand-neon uppercase tracking-wider">{shot.stepTag}</span>
              </div>
              <AnnotatedScreenshot
                src={shot.src}
                alt={shot.alt}
                device="cli"
                titleEn={shot.titleEn}
                titleZh={shot.titleZh}
                callouts={shot.callouts}
              />
              <p class="text-xs sm:text-sm text-white/65 px-1 leading-relaxed">
                {$locale === 'zh' ? shot.summaryZh : shot.summaryEn}
              </p>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- ==================== BEGINNER SAFETY CHECKLIST ==================== -->
    <section class="scroll-mt-32">
      <div class="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#19162b] via-[#121826] to-[#111e2b] border border-white/15 space-y-4">
        <h3 class="text-lg sm:text-2xl font-bold text-white">
          {$locale === 'zh' ? '🛡️ 小白转大额前 30 秒安全 Checklist（必看！）' : '🛡️ 30-Second Pre-Flight Safety Checklist'}
        </h3>
        <div class="grid md:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div class="space-y-2.5 text-white/80">
            <p><span class="text-emerald-400 font-bold mr-1.5">✓</span>{$locale === 'zh' ? '先用极小金额（例如 $1~$5 等值代币）在 Base / Arbitrum 或测试网完整跑通一次「收款 → 2 轮多签 → 广播上链」。' : 'Always run one tiny test transfer ($1–$5 on Base/Arbitrum or testnet) end-to-end before moving large funds.'}</p>
            <p><span class="text-emerald-400 font-bold mr-1.5">✓</span>{$locale === 'zh' ? '不同客户端设置不同本地加密密码，并将各设备的加密分片备份分别存放在不同离线 U 盘/SD 卡。' : 'Use distinct passwords per device and store each encrypted share backup on separate offline media.'}</p>
            <p><span class="text-emerald-400 font-bold mr-1.5">✓</span>{$locale === 'zh' ? '大额长期资金强烈建议 2-of-3 金库（如插件 + 常用电脑 + TUI 冷机）：丢任何 1 台设备照常签发，被偷 1 台也无法盗币。' : 'Use a 2-of-3 vault (e.g., Extension + Desktop + TUI cold signer) for large holdings so losing 1 device never freezes funds.'}</p>
          </div>
          <div class="space-y-2.5 text-white/80">
            <p><span class="text-brand-accent font-bold mr-1.5">✗</span>{$locale === 'zh' ? '绝不要把 2-of-2 两台设备的加密分片备份放进同一个网盘或同一个 U 盘（否则会退化回单点风险）。' : 'Never store backups from both 2-of-2 devices in the same cloud drive or USB stick.'}</p>
            <p><span class="text-brand-accent font-bold mr-1.5">✗</span>{$locale === 'zh' ? '协签弹窗务必核对链名、收款地址与摘要再点批准——第二台设备独立审核正是拦截恶意合约与木马的关键防线。' : 'Never blind-approve co-signing prompts—independent verification on your second device stops phishing!'}</p>
            <p><span class="text-brand-accent font-bold mr-1.5">✗</span>{$locale === 'zh' ? '零托管架构没有任何官方客服能重置你的本地分片密码，请务必用密码管理器（Bitwarden / 1Password）或离线纸条妥善保管。' : 'Zero-custody means nobody can reset your share password—save each device password safely in a password manager.'}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== COMPARISON TABLE ==================== -->
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
                ★ {$locale === 'zh' ? 'Starlab MPC (四大客户端)' : 'Starlab MPC (4 Clients)'}
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
    <section id="faq" class="scroll-mt-36 space-y-8">
      <div class="text-center max-w-2xl mx-auto">
        <p class="text-xs font-mono uppercase tracking-widest text-brand-neon mb-2">FAQ</p>
        <h2 class="text-2xl sm:text-4xl font-bold">
          {$locale === 'zh' ? '深度常见问题解答' : 'Frequently Asked Questions'}
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
              <div class="px-6 pb-5 text-sm text-white/75 leading-relaxed border-t border-white/8 pt-3.5 whitespace-pre-line">
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
              ? '完全开源、零托管、支持与 Ledger 同级的全主流公链生态。任选 Chrome 插件、桌面端、TUI 或 CLI，5 分钟跑通 2 轮 DKG、门限多签与广播上链！'
              : '100% open source, zero cloud custody, and Ledger-level multi-chain coverage across all 4 clients. Launch your threshold vault in 5 minutes.'}
          </p>
          <div class="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href="https://github.com/stars-labs/starlab-wallet/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              class="px-6 py-3 rounded-xl bg-violet-600/85 hover:bg-violet-500 text-white font-semibold text-sm transition shadow-lg"
            >
              {$locale === 'zh' ? '下载浏览器插件 (Chrome/Edge/Firefox)' : 'Download Extension (Chrome/Edge/Firefox)'} &nearr;
            </a>
            <a
              href="https://github.com/stars-labs/starlab-desktop/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              class="px-6 py-3 rounded-xl bg-brand-accent text-white font-semibold text-sm hover:brightness-110 transition shadow-lg"
            >
              {$locale === 'zh' ? '下载桌面端 (macOS/Linux/Win)' : 'Download Desktop (macOS/Linux/Win)'} &nearr;
            </a>
            <a
              href="https://github.com/stars-labs/starlab-mpc/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              class="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium text-sm transition"
            >
              {$locale === 'zh' ? '下载 TUI / CLI (macOS/Linux/Win)' : 'Download TUI / CLI (macOS/Linux/Win)'} &nearr;
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
