<script lang="ts">
  import { locale } from '../lib/i18n';
  import {
    navigateTo,
    walletWorkspace,
    setWalletWorkspace,
    type WalletWorkspace,
  } from '../lib/router';
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
    type ShotItem,
  } from '../lib/walletGuideData';

  // Guides Master-Detail state (only 1 GIF displayed at a time -> 1 viewport tall!)
  let activeClient: 'extension' | 'desktop' | 'tui' | 'cli' = 'extension';
  let activeShotIndex = 0;

  // Protocol lesson state
  let activeLesson: 'dkg' | 'multisig' | 'broadcast' = 'dkg';

  // FAQ search + single-open accordion state
  let faqQuery = '';
  let openFaq: number | null = 0;

  const totalShots =
    extensionShots.length + desktopShots.length + tuiShots.length + cliShots.length;

  const clientMeta = {
    extension: {
      shots: extensionShots,
      device: 'extension' as const,
      zh: 'Chrome 插件',
      en: 'Chrome Extension',
      descZh: '日常 Web3 交互、dApp 自动广播、YubiKey / Ledger WebHID 与限额风控',
      descEn: 'Everyday Web3 dApps, auto-broadcast, YubiKey / Ledger WebHID & spending policies',
      badgeClass: 'bg-violet-500/20 text-violet-200 border-violet-400/45',
    },
    desktop: {
      shots: desktopShots,
      device: 'desktop' as const,
      zh: '桌面客户端',
      en: 'Starlab Desktop',
      descZh: 'Rust + Iced 原生跨平台协签器、多设备混编、HD 多账户与加密备份',
      descEn: 'Native Rust Iced co-signer, 3-device interop, HD accounts & encrypted backups',
      badgeClass: 'bg-brand-accent/20 text-brand-accent border-brand-accent/45',
    },
    tui: {
      shots: tuiShots,
      device: 'tui' as const,
      zh: '终端 TUI',
      en: 'Terminal TUI',
      descZh: 'Ratatui 零依赖终端，适合 SSH / 树莓派 / 断网 SD 卡冷存节点',
      descEn: 'Zero-GUI Ratatui terminal for SSH servers, Raspberry Pi & air-gapped SD cold storage',
      badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/45',
    },
    cli: {
      shots: cliShots,
      device: 'cli' as const,
      zh: '命令行 CLI',
      en: 'Headless CLI',
      descZh: '自动化守护协签节点、2 轮协议完整抓包、不换地址 Reshare 与 RPC 广播',
      descEn: 'Headless co-signer daemon, wire-level protocol traces, reshare & RPC broadcast',
      badgeClass: 'bg-brand-neon/20 text-brand-neon border-brand-neon/45',
    },
  };

  function switchClient(c: 'extension' | 'desktop' | 'tui' | 'cli') {
    activeClient = c;
    activeShotIndex = 0;
  }

  $: currentClientMeta = clientMeta[activeClient];
  $: currentShots = currentClientMeta.shots as ShotItem[];
  $: currentShot = currentShots[activeShotIndex] ?? currentShots[0];

  function prevShot() {
    activeShotIndex = (activeShotIndex - 1 + currentShots.length) % currentShots.length;
  }

  function nextShot() {
    activeShotIndex = (activeShotIndex + 1) % currentShots.length;
  }

  function toggleFaq(index: number) {
    openFaq = openFaq === index ? null : index;
  }

  $: filteredFaqs = faqs
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => {
      const q = faqQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        item.qZh.toLowerCase().includes(q) ||
        item.aZh.toLowerCase().includes(q) ||
        item.qEn.toLowerCase().includes(q) ||
        item.aEn.toLowerCase().includes(q)
      );
    });

  const workspaces: { id: WalletWorkspace; icon: string; zh: string; en: string; badge?: string }[] = [
    { id: 'sandbox', icon: '⚡', zh: '在线真机体验', en: 'Live WASM Sandbox', badge: '5 算法' },
    { id: 'guides', icon: '🎬', zh: '四端操作动图', en: 'Client GIF Guides', badge: `${totalShots} GIF` },
    { id: 'chains', icon: '🌐', zh: '全链支持 & 对比', en: 'Chains & Compare' },
    { id: 'protocol', icon: '🧠', zh: '协议原理 & 清单', en: 'Protocol & Safety' },
    { id: 'faq', icon: '❓', zh: '深度问答 FAQ', en: 'FAQ', badge: `${faqs.length}` },
  ];
</script>

<div class="relative min-h-screen bg-brand-bg text-white pt-16 overflow-x-clip">
  <!-- Ambient radial glow backdrop -->
  <div
    class="pointer-events-none fixed inset-0 opacity-35"
    style="background: radial-gradient(circle at 18% 10%, rgba(233, 69, 96, 0.22), transparent 40%), radial-gradient(circle at 82% 20%, rgba(0, 255, 255, 0.14), transparent 38%), radial-gradient(circle at 50% 80%, rgba(124, 58, 237, 0.14), transparent 45%);"
  ></div>

  <!-- COMPACT HERO STRIP (Designed so the Workspace Bar + Live Sandbox sit right above the fold!) -->
  <section class="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-6 pb-5">
    <div class="rounded-2xl border border-white/10 bg-[#101626]/85 px-5 sm:px-7 py-5 grid lg:grid-cols-12 gap-6 items-center shadow-[0_14px_40px_rgba(0,0,0,0.45)]">
      <div class="lg:col-span-7 space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-neon/12 border border-brand-neon/35 text-[11px] font-mono text-brand-neon">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-neon animate-pulse"></span>
            STARLAB MPC WALLET · FROST 3.0 + CGGMP24
          </span>
          <span class="text-[11px] font-mono text-white/55">
            {$locale === 'zh' ? '100% 开源 · 零助记词 · 100+ EVM / BTC / SOL / SUI' : '100% Open Source · Zero Seed · 100+ EVM / BTC / SOL / SUI'}
          </span>
        </div>

        <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
          {#if $locale === 'zh'}
            告别助记词：<span class="gradient-text">私钥从未完整存在</span>，全链金库一网打尽
          {:else}
            Zero Seed Phrases. <span class="gradient-text">Ledger-Scale Threshold Custody.</span>
          {/if}
        </h1>

        <p class="text-xs sm:text-sm text-white/70 leading-relaxed max-w-2xl">
          {$locale === 'zh'
            ? '下方用 5 个独立工作区把整个钱包拆解清爽：直接在线跑通真实 Rust WASM 密码学动画、按步骤翻看四端 36 组实机 GIF、对比 Ledger 与助记词、或检索 13 篇深度 FAQ——告别冗长滚屏！'
            : 'Everything organized into 5 focused workspaces: run real Rust WASM animations live, browse 36 client GIFs in a step-by-step viewer, compare chains, study protocols, or search the FAQ — zero endless scrolling.'}
        </p>

        <!-- Compact Download Row -->
        <div class="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
          <a
            href="https://github.com/stars-labs/starlab-wallet/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            class="px-3 py-1.5 rounded-lg bg-violet-500/18 hover:bg-violet-500/28 border border-violet-400/35 text-violet-200 font-semibold transition"
          >
            {$locale === 'zh' ? '下载浏览器插件' : 'Extension'} &nearr;
          </a>
          <a
            href="https://github.com/stars-labs/starlab-desktop/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            class="px-3 py-1.5 rounded-lg bg-brand-accent/20 hover:bg-brand-accent/30 border border-brand-accent/40 text-brand-accent font-semibold transition"
          >
            {$locale === 'zh' ? '下载桌面端' : 'Desktop'} &nearr;
          </a>
          <a
            href="https://github.com/stars-labs/starlab-mpc/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            class="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 text-emerald-200 font-semibold transition"
          >
            {$locale === 'zh' ? '下载 TUI / CLI' : 'TUI / CLI'} &nearr;
          </a>
        </div>
      </div>

      <!-- Compact Live GIF Thumbnail Preview (Click opens GIF Guides workspace) -->
      <div class="lg:col-span-5">
        <button
          type="button"
          on:click={() => setWalletWorkspace('guides', false)}
          class="w-full text-left grid grid-cols-12 gap-2.5 p-2.5 rounded-xl bg-black/35 border border-white/10 hover:border-brand-neon/45 transition cursor-pointer group"
        >
          <div class="col-span-8 rounded-lg overflow-hidden border border-white/10 bg-[#0b1120]">
            <img
              src="/wallet-guide/hero-desktop-flow.gif"
              alt="Starlab Desktop live preview"
              class="w-full h-32 sm:h-36 object-cover object-top block"
            />
          </div>
          <div class="col-span-4 rounded-lg overflow-hidden border border-violet-400/30 bg-[#14182a]">
            <img
              src="/wallet-guide/hero-ext-flow.gif"
              alt="Starlab Extension live preview"
              class="w-full h-32 sm:h-36 object-cover object-top block"
            />
          </div>
          <div class="col-span-12 flex items-center justify-between px-1 text-[11px] font-mono text-white/60 group-hover:text-brand-neon transition">
            <span>● LIVE PREVIEW · Desktop + Chrome Extension</span>
            <span>{$locale === 'zh' ? `点此浏览全部 ${totalShots} 组操作动图 →` : `Open all ${totalShots} GIFs →`}</span>
          </div>
        </button>
      </div>
    </div>
  </section>

  <!-- STICKY 5-WORKSPACE TAB BAR (Single Clean Navigation Hub!) -->
  <div id="wallet-workspace" class="sticky top-16 z-40 scroll-mt-16 backdrop-blur-md bg-[#0b101b]/92 border-y border-white/10">
    <div class="max-w-7xl mx-auto px-5 sm:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
      {#each workspaces as ws}
        {@const active = $walletWorkspace === ws.id}
        <button
          type="button"
          on:click={() => setWalletWorkspace(ws.id, false)}
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition shrink-0 cursor-pointer {active
            ? 'bg-brand-neon/15 text-brand-neon border-brand-neon/55 shadow-[0_0_20px_rgba(0,255,255,0.14)]'
            : 'bg-white/[0.03] text-white/70 border-white/10 hover:text-white hover:border-white/25'}"
        >
          <span>{ws.icon}</span>
          <span>{$locale === 'zh' ? ws.zh : ws.en}</span>
          {#if ws.badge}
            <span
              class="px-1.5 py-0.5 rounded text-[10px] font-mono {active
                ? 'bg-brand-neon/25 text-brand-neon'
                : 'bg-white/10 text-white/60'}"
            >
              {ws.badge}
            </span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- ACTIVE WORKSPACE BODY (Only 1 Focused Workspace Rendered at a Time -> Short, Fast, Crisp!) -->
  <main class="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-6">
    {#if $walletWorkspace === 'sandbox'}
      <!-- ==================== WORKSPACE 1: LIVE RUST WASM SANDBOX ==================== -->
      <MpcPlayground />

    {:else if $walletWorkspace === 'guides'}
      <!-- ==================== WORKSPACE 2: MASTER-DETAIL 36-GIF STORYBOARD ==================== -->
      <div class="rounded-3xl border border-white/12 bg-[#101626]/90 overflow-hidden shadow-2xl">
        <!-- Client Selector Bar -->
        <div class="px-5 sm:px-7 py-4 border-b border-white/10 bg-black/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="space-y-1">
            <h2 class="text-lg sm:text-xl font-bold text-white">
              {$locale === 'zh' ? '四大客户端实机操作动图浏览器（单屏精看，无需长滚）' : '4-Client Interactive GIF Storyboard'}
            </h2>
            <p class="text-xs text-white/65">
              {$locale === 'zh' ? currentClientMeta.descZh : currentClientMeta.descEn}
            </p>
          </div>
          <div class="flex flex-wrap gap-2 shrink-0">
            {#each ['extension', 'desktop', 'tui', 'cli'] as key}
              {@const m = clientMeta[key as keyof typeof clientMeta]}
              {@const selected = activeClient === key}
              <button
                type="button"
                on:click={() => switchClient(key as 'extension' | 'desktop' | 'tui' | 'cli')}
                class="px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer {selected
                  ? m.badgeClass
                  : 'bg-white/5 text-white/65 border-white/10 hover:text-white'}"
              >
                {$locale === 'zh' ? m.zh : m.en} ({m.shots.length})
              </button>
            {/each}
          </div>
        </div>

        <!-- Master-Detail Split Grid -->
        <div class="grid lg:grid-cols-12">
          <!-- Left: Compact Scrollable Step Index -->
          <div class="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/20 p-3 space-y-1.5 max-h-[560px] overflow-y-auto">
            {#each currentShots as shot, idx (shot.id)}
              {@const active = idx === activeShotIndex}
              <button
                type="button"
                on:click={() => (activeShotIndex = idx)}
                class="w-full text-left px-3 py-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 {active
                  ? 'bg-brand-neon/12 border-brand-neon/50 text-white'
                  : 'bg-transparent border-transparent hover:bg-white/[0.04] text-white/70 hover:text-white'}"
              >
                <span
                  class="px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 mt-0.5 {active
                    ? 'bg-brand-neon text-black font-bold'
                    : 'bg-white/10 text-white/60'}"
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div class="min-w-0">
                  <div class="text-xs font-semibold leading-snug truncate">
                    {$locale === 'zh' ? shot.titleZh : shot.titleEn}
                  </div>
                  <div class="text-[10.5px] font-mono text-white/45 truncate mt-0.5">
                    {shot.stepTag}
                  </div>
                </div>
              </button>
            {/each}
          </div>

          <!-- Right: Focused Single GIF Player + Prev/Next Pager -->
          <div class="lg:col-span-8 p-5 sm:p-6 space-y-4">
            {#if currentShot}
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-1 rounded-lg text-[11px] font-mono border {currentClientMeta.badgeClass}">
                    {currentShot.stepTag}
                  </span>
                  <span class="text-xs font-mono text-white/55">
                    {activeShotIndex + 1} / {currentShots.length}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    on:click={prevShot}
                    class="px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 border border-white/12 text-xs font-mono text-white cursor-pointer"
                  >
                    ← {$locale === 'zh' ? '上一屏' : 'Prev'}
                  </button>
                  <button
                    type="button"
                    on:click={nextShot}
                    class="px-3 py-1.5 rounded-lg bg-brand-neon/18 hover:bg-brand-neon/28 border border-brand-neon/45 text-xs font-mono font-bold text-brand-neon cursor-pointer"
                  >
                    {$locale === 'zh' ? '下一屏' : 'Next'} →
                  </button>
                </div>
              </div>

              <div class="max-w-3xl mx-auto">
                <AnnotatedScreenshot
                  src={currentShot.src}
                  alt={currentShot.alt}
                  device={currentClientMeta.device}
                  titleEn={currentShot.titleEn}
                  titleZh={currentShot.titleZh}
                  callouts={currentShot.callouts}
                />
              </div>

              <div class="p-4 rounded-xl bg-black/35 border border-white/10 text-xs sm:text-sm text-white/80 leading-relaxed">
                {$locale === 'zh' ? currentShot.summaryZh : currentShot.summaryEn}
              </div>
            {/if}
          </div>
        </div>
      </div>

    {:else if $walletWorkspace === 'chains'}
      <!-- ==================== WORKSPACE 3: FULL CHAIN COVERAGE + COMPARISON ==================== -->
      <div class="space-y-6">
        <div class="grid md:grid-cols-2 gap-4">
          {#each chainFamilies as fam}
            <div class="rounded-2xl p-5 bg-[#121826]/90 border border-white/10 hover:border-white/20 transition space-y-3">
              <div class="flex items-center justify-between gap-2">
                <span class="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-mono border {fam.accentClass}">
                  {fam.badge}
                </span>
              </div>
              <h3 class="text-lg font-bold text-white">
                {$locale === 'zh' ? fam.titleZh : fam.titleEn}
              </h3>
              <p class="text-xs sm:text-sm text-white/70 leading-relaxed">
                {$locale === 'zh' ? fam.descZh : fam.descEn}
              </p>
              <div class="flex flex-wrap gap-1.5 pt-1">
                {#each fam.pills as pill}
                  <span class="px-2 py-0.5 rounded-md text-[11px] font-mono bg-black/40 border border-white/10 text-white/80">
                    {pill}
                  </span>
                {/each}
              </div>
            </div>
          {/each}
        </div>

        <div class="overflow-x-auto rounded-2xl border border-white/10 bg-[#121826]/90 shadow-xl">
          <div class="px-5 py-3.5 border-b border-white/10 bg-black/30 flex items-center justify-between">
            <h3 class="text-sm sm:text-base font-bold text-white">
              {$locale === 'zh'
                ? '横向对比：传统助记词钱包 vs 单台硬件钱包 (Ledger) vs Starlab MPC'
                : 'Comparison: Seed Phrase vs Single Hardware (Ledger) vs Starlab MPC'}
            </h3>
          </div>
          <table class="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr class="border-b border-white/10 bg-black/25 text-xs uppercase tracking-wider font-mono">
                <th class="p-3.5 text-white/60">{$locale === 'zh' ? '安全与体验维度' : 'Dimension'}</th>
                <th class="p-3.5 text-white/60">{$locale === 'zh' ? '传统助记词钱包' : 'Seed Phrase'}</th>
                <th class="p-3.5 text-white/60">{$locale === 'zh' ? '单台硬件钱包 (Ledger)' : 'Single Hardware'}</th>
                <th class="p-3.5 text-brand-neon bg-brand-neon/5">★ Starlab MPC</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10 text-xs sm:text-sm">
              {#each comparisons as row}
                <tr class="hover:bg-white/[0.02] transition">
                  <td class="p-3.5 font-semibold text-white">{$locale === 'zh' ? row.metricZh : row.metricEn}</td>
                  <td class="p-3.5 text-white/60">{$locale === 'zh' ? row.seedZh : row.seedEn}</td>
                  <td class="p-3.5 text-white/70">{$locale === 'zh' ? row.hwZh : row.hwEn}</td>
                  <td class="p-3.5 text-white font-medium bg-brand-neon/[0.04]">
                    <span class="text-emerald-400 mr-1.5">✓</span>{$locale === 'zh' ? row.mpcZh : row.mpcEn}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

    {:else if $walletWorkspace === 'protocol'}
      <!-- ==================== WORKSPACE 4: PROTOCOL MASTERCLASS + SAFETY CHECKLIST ==================== -->
      <div class="space-y-6">
        <div class="rounded-3xl p-5 sm:p-7 bg-[#121826]/95 border border-white/12 shadow-xl space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 class="text-lg sm:text-2xl font-bold text-white">
                {$locale === 'zh' ? '白话拆解三大核心协议：2 轮 DKG · 2 轮多签 · 广播上链' : 'Core Protocol Masterclass: DKG · Multi-Sig · Broadcast'}
              </h2>
              <p class="text-xs text-white/60 mt-1">
                {$locale === 'zh' ? '想看真机动态数据流动？切回「⚡ 在线真机体验」即可实时运行 Rust WASM 动画。' : 'Want live animated packet traces? Switch to Live WASM Sandbox!'}
              </p>
            </div>
            <div class="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                on:click={() => (activeLesson = 'dkg')}
                class="px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer {activeLesson === 'dkg'
                  ? 'bg-brand-neon/15 text-brand-neon border-brand-neon/50'
                  : 'bg-white/5 text-white/70 border-white/10 hover:text-white'}"
              >
                1. {$locale === 'zh' ? '2 轮 DKG' : '2-Round DKG'}
              </button>
              <button
                type="button"
                on:click={() => (activeLesson = 'multisig')}
                class="px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer {activeLesson === 'multisig'
                  ? 'bg-violet-500/20 text-violet-200 border-violet-400/50'
                  : 'bg-white/5 text-white/70 border-white/10 hover:text-white'}"
              >
                2. {$locale === 'zh' ? '2 轮门限多签' : '2-Round Multi-Sig'}
              </button>
              <button
                type="button"
                on:click={() => (activeLesson = 'broadcast')}
                class="px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer {activeLesson === 'broadcast'
                  ? 'bg-brand-accent/20 text-brand-accent border-brand-accent/50'
                  : 'bg-white/5 text-white/70 border-white/10 hover:text-white'}"
              >
                3. {$locale === 'zh' ? '交易广播 5 步' : '5-Step Broadcast'}
              </button>
            </div>
          </div>

          {#if activeLesson === 'dkg'}
            <div class="space-y-4">
              <div class="rounded-xl p-4 bg-black/35 border border-white/10 text-xs sm:text-sm text-white/85 leading-relaxed">
                <strong class="text-brand-neon">{$locale === 'zh' ? '🎯 一句话白话：' : '🎯 Plain English:'}</strong>
                {$locale === 'zh'
                  ? '第 1 轮每台设备先把「公开承诺信封」摆上桌防作弊；第 2 轮再点对点互递加密分片并做零知识验算。建库结束时每人只有 1 块独立分片，完整私钥从未在任何电脑出现过！'
                  : 'Round 1 seals public commitments on the table so nobody can cheat; Round 2 delivers P2P secret shares verified against Round 1. No full private key ever exists!'}
              </div>
              <div class="grid md:grid-cols-2 gap-4">
                <div class="rounded-2xl p-4 bg-cyan-500/8 border border-cyan-400/30 space-y-2 text-xs sm:text-sm text-white/80">
                  <div class="font-mono font-bold text-cyan-200">ROUND 1 · 公开承诺 (DKG_ROUND1 · ~135B)</div>
                  <p>{$locale === 'zh' ? '本地硬件真随机数生成秘密多项式（绝不出本机）→ 广播 Feldman 承诺锁死随机性，收齐全部 n 台承诺后才进入第 2 轮。' : 'Sample local secret polynomial → broadcast Feldman commitment to lock randomness across all n peers.'}</p>
                </div>
                <div class="rounded-2xl p-4 bg-violet-500/10 border border-violet-400/30 space-y-2 text-xs sm:text-sm text-white/80">
                  <div class="font-mono font-bold text-violet-200">ROUND 2 · 点对点加密份额 (DKG_ROUND2 · ~131B)</div>
                  <p>{$locale === 'zh' ? '一对一发送专属份额 → 用第 1 轮承诺做零知识验算 → 本地合成加密分片并用 AES-256-GCM 落盘（EVM 同步完成 CGGMP24 建库）。' : 'Deliver tailored P2P shares → verify via Feldman VSS → finalize & encrypt local shares with AES-256-GCM.'}</p>
                </div>
              </div>
            </div>

          {:else if activeLesson === 'multisig'}
            <div class="space-y-4">
              <div class="rounded-xl p-4 bg-black/35 border border-white/10 text-xs sm:text-sm text-white/85 leading-relaxed">
                <strong class="text-violet-300">{$locale === 'zh' ? '🎯 为什么比 Safe 合约多签更强？' : '🎯 Why Better Than Contract Multisigs?'}</strong>
                {$locale === 'zh'
                  ? '任意 t 台设备在链下跑完 2 轮协同，直接聚合为 1 个标准单签签名：0 合约部署费、全网最低 Gas、BTC/SOL/SUI/EVM 全链通用、链上完全看不出是多签！'
                  : 'Any t devices co-sign off-chain in 2 rounds into 1 standard single-sig output: $0 deployment, lowest gas, native BTC/SOL/SUI/EVM, zero on-chain multisig footprint.'}
              </div>
              <div class="grid md:grid-cols-2 gap-4">
                <div class="rounded-2xl p-4 bg-cyan-500/8 border border-cyan-400/30 space-y-2 text-xs sm:text-sm text-white/80">
                  <div class="font-mono font-bold text-cyan-200">SIGN ROUND 1 · 一次性随机数承诺 (SIGN_COMMIT · 69B)</div>
                  <p>{$locale === 'zh' ? '各协签端独立弹窗核对链名与转账内容防钓鱼 → 选定 t 台在线节点 → 各自生成全新一次性 Nonce 并交换 69B 公开承诺。' : 'Independent phishing review → lock t signers → exchange fresh single-use 69B nonce commitments.'}</p>
                </div>
                <div class="rounded-2xl p-4 bg-violet-500/10 border border-violet-400/30 space-y-2 text-xs sm:text-sm text-white/80">
                  <div class="font-mono font-bold text-violet-200">SIGN ROUND 2 · 局部签名与聚合 (SIGN_SHARE · 32B)</div>
                  <p>{$locale === 'zh' ? '每台设备算出 32B 局部签名并立即销毁 Nonce → 聚合为 64B (BTC/SOL/SUI) 或 65B r‖s‖v (EVM) 标准签名，单设备强签 100% 拦截。' : 'Compute 32B partial signature & zeroize nonce → aggregate standard 64B/65B single signature.'}</p>
                </div>
              </div>
            </div>

          {:else}
            <div class="space-y-4">
              <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {#each [
                  { n: '① BUILD', zh: '查 pending nonce、估算 Gas (+20%) 与 EIP-1559 费率', en: 'Fetch pending nonce, estimate gas & fees' },
                  { n: '② SIGN', zh: '双端 2 轮门限多签产出标准 (r, s, v) / BIP-340 签名', en: '2-round threshold co-signing over sighash' },
                  { n: '③ ASSEMBLE', zh: '拼装为 0x02f8... 原始签名交易字节流', en: 'Serialize raw signed transaction bytes' },
                  { n: '④ BROADCAST', zh: '调用 eth_sendRawTransaction 推入 RPC 内存池', en: 'Push to chain RPC mempool' },
                  { n: '⑤ CONFIRM', zh: '拿到 Tx Hash 到 Etherscan / mempool.space 查到账', en: 'Verify Tx Hash confirmed on explorer' },
                ] as st}
                  <div class="rounded-xl p-3.5 bg-white/[0.03] border border-white/10 space-y-1">
                    <div class="font-mono font-bold text-brand-neon">{st.n}</div>
                    <p class="text-white/75 leading-relaxed">{$locale === 'zh' ? st.zh : st.en}</p>
                  </div>
                {/each}
              </div>
              <div class="grid md:grid-cols-2 gap-3 text-xs text-white/80">
                <div class="rounded-xl p-4 bg-emerald-500/10 border border-emerald-400/30">
                  <strong class="text-emerald-300">{$locale === 'zh' ? '日常推荐：插件自动广播' : 'Everyday: Auto-Broadcast'}</strong> —
                  {$locale === 'zh' ? '在 Chrome 插件内转账或连 Uniswap/Aave，双端确认后自动推送 RPC 并返回 Tx Hash。' : 'Extension automatically submits raw signed tx to RPC once co-signers approve.'}
                </div>
                <div class="rounded-xl p-4 bg-sky-500/10 border border-sky-400/30">
                  <strong class="text-sky-300">{$locale === 'zh' ? '冷签模式：手动/断网广播' : 'Air-Gap: Manual Broadcast'}</strong> —
                  {$locale === 'zh' ? 'Desktop / TUI / CLI 签出原始交易后可贴到 etherscan.io/pushTx 或 mempool.space/tx/push 广播。' : 'Paste raw tx hex into etherscan.io/pushTx or mempool.space/tx/push — zero share data exposed.'}
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Compact 30s Safety Checklist -->
        <div class="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-[#19162b] via-[#121826] to-[#111e2b] border border-white/12 space-y-3">
          <h3 class="text-base sm:text-lg font-bold text-white">
            {$locale === 'zh' ? '🛡️ 小白转大额前 30 秒安全 Checklist' : '🛡️ 30-Second Pre-Flight Safety Checklist'}
          </h3>
          <div class="grid md:grid-cols-2 gap-3 text-xs text-white/80">
            <div class="space-y-2">
              <p><span class="text-emerald-400 font-bold mr-1.5">✓</span>{$locale === 'zh' ? '先用 $1~$5 小额在 Base / Arbitrum 跑通一次「收款 → 多签 → 广播上链」。' : 'Run one $1–$5 test spend end-to-end before depositing large funds.'}</p>
              <p><span class="text-emerald-400 font-bold mr-1.5">✓</span>{$locale === 'zh' ? '不同设备用不同本地加密密码，备份文件分别存在不同离线 U 盘 / SD 卡。' : 'Use distinct passwords per device and store encrypted backups on separate offline media.'}</p>
              <p><span class="text-emerald-400 font-bold mr-1.5">✓</span>{$locale === 'zh' ? '大额资金强烈建议 2-of-3（如插件 + 电脑 + ESP32/冷机），丢 1 台照常签发。' : 'Prefer 2-of-3 for large funds so losing any 1 device never freezes assets.'}</p>
            </div>
            <div class="space-y-2">
              <p><span class="text-brand-accent font-bold mr-1.5">✗</span>{$locale === 'zh' ? '绝不把 2-of-2 两台设备的备份放进同一个网盘或同一个 U 盘。' : 'Never put both 2-of-2 device backups into the same cloud drive or USB.'}</p>
              <p><span class="text-brand-accent font-bold mr-1.5">✗</span>{$locale === 'zh' ? '协签弹窗务必核对链名、地址与金额再批准——第二台设备独立核验是防木马核心。' : 'Always verify chain, recipient & amount on the co-signing device before approving.'}</p>
              <p><span class="text-brand-accent font-bold mr-1.5">✗</span>{$locale === 'zh' ? '零托管没有官方客服可重置密码，请用 Bitwarden / 1Password 或纸质安全保存。' : 'Zero custody means nobody can reset your password — back up passwords safely.'}</p>
            </div>
          </div>
        </div>
      </div>

    {:else if $walletWorkspace === 'faq'}
      <!-- ==================== WORKSPACE 5: SEARCHABLE COMPACT FAQ ACCORDION ==================== -->
      <div class="max-w-4xl mx-auto space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-white">
              {$locale === 'zh' ? `深度常见问题解答（共 ${faqs.length} 问）` : `Deep Technical & Security FAQ (${faqs.length})`}
            </h2>
            <p class="text-xs text-white/60">
              {$locale === 'zh' ? '涵盖 3 份分片原理、FROST vs CGGMP24、ESP32 开源硬件、2-of-3 容灾、防木马与迁移方案。' : 'Covers 3 shares, FROST vs CGGMP24, ESP32 hardware shares, 2-of-3 recovery, malware defense & migration.'}
            </p>
          </div>
          <input
            type="search"
            bind:value={faqQuery}
            placeholder={$locale === 'zh' ? '🔍 搜索关键词（如 3分片 / ESP32 / 丢设备）…' : '🔍 Filter FAQ (e.g. ESP32 / 3 shares)…'}
            class="sm:w-72 px-3.5 py-2 rounded-xl bg-black/45 border border-white/15 text-xs text-white placeholder-white/40 outline-none focus:border-brand-neon"
          />
        </div>

        <div class="space-y-2.5">
          {#each filteredFaqs as { item, idx } (idx)}
            <div class="rounded-2xl border border-white/10 bg-[#121826]/90 overflow-hidden">
              <button
                type="button"
                on:click={() => toggleFaq(idx)}
                class="w-full px-5 py-3.5 text-left flex items-center justify-between gap-4 hover:bg-white/[0.03] transition cursor-pointer"
              >
                <span class="font-semibold text-xs sm:text-sm text-white">
                  {$locale === 'zh' ? item.qZh : item.qEn}
                </span>
                <span class="text-brand-neon font-mono text-base shrink-0">
                  {openFaq === idx ? '−' : '+'}
                </span>
              </button>
              {#if openFaq === idx}
                <div class="px-5 pb-4 text-xs sm:text-sm text-white/75 leading-relaxed border-t border-white/8 pt-3 whitespace-pre-line">
                  {$locale === 'zh' ? item.aZh : item.aEn}
                </div>
              {/if}
            </div>
          {:else}
            <div class="p-8 text-center text-xs font-mono text-white/50 rounded-2xl border border-white/10 bg-black/30">
              {$locale === 'zh' ? '未找到匹配问题，换个关键词试试' : 'No matching FAQ items.'}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- SLIM SINGLE-ROW BOTTOM DOWNLOAD BAR -->
    <div class="mt-8 rounded-2xl px-5 py-4 border border-white/10 bg-[#101626]/80 flex flex-wrap items-center justify-between gap-3">
      <div class="text-xs sm:text-sm text-white/75">
        <strong class="text-white">{$locale === 'zh' ? '准备好真机部署你的全链 MPC 金库了吗？' : 'Ready to deploy your self-custody MPC vault?'}</strong>
        <span class="ml-1.5 text-white/55 hidden sm:inline">
          {$locale === 'zh' ? '完全开源 · MIT/Apache · 无任何服务端托管' : '100% Open Source · Zero Cloud Custody'}
        </span>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <a
          href="https://github.com/stars-labs/starlab-wallet/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
          class="px-3 py-1.5 rounded-lg bg-violet-600/80 hover:bg-violet-500 text-white font-semibold transition"
        >
          {$locale === 'zh' ? '浏览器插件' : 'Extension'} &nearr;
        </a>
        <a
          href="https://github.com/stars-labs/starlab-desktop/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
          class="px-3 py-1.5 rounded-lg bg-brand-accent text-white font-semibold hover:brightness-110 transition"
        >
          {$locale === 'zh' ? '桌面端' : 'Desktop'} &nearr;
        </a>
        <a
          href="https://github.com/stars-labs/starlab-mpc/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
          class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition"
        >
          TUI / CLI &nearr;
        </a>
        <button
          type="button"
          on:click={() => navigateTo('home')}
          class="px-3 py-1.5 rounded-lg border border-white/15 text-white/65 hover:text-white transition cursor-pointer"
        >
          StarsLab &nearr;
        </button>
      </div>
    </div>
  </main>
</div>
