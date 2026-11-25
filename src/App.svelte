<script lang="ts">
  import Hero from "./components/Hero.svelte";
  import Pillars from "./components/Pillars.svelte";
  import Showcase from "./components/Showcase.svelte";
  import CTA from "./components/CTA.svelte";
  import Footer from "./components/Footer.svelte";
  import WebGPUParticles from "./components/WebGPUParticles.svelte";
  import GlitchEffect from "./components/GlitchEffect.svelte";
  import BlockchainViz from "./components/BlockchainViz.svelte";
  import BlockchainStats from "./components/BlockchainStats.svelte";
  import BlockchainExplorer from "./components/BlockchainExplorer.svelte";
  import LiveBlockFeed from "./components/LiveBlockFeed.svelte";
  import TransactionPanel from "./components/TransactionPanel.svelte";
  import Branches from "./components/Branches.svelte";
  import WalletGuide from "./components/WalletGuide.svelte";
  import {
    currentRoute,
    navigateTo,
    walletWorkspace,
    setWalletWorkspace,
    type Route,
    type WalletWorkspace,
  } from "./lib/router";
  import { locale, t } from "./lib/i18n";
  import faviconUrl from "/favicon.png";

  let mobileMenuOpen = false;

  function handleUserTx(e: CustomEvent<{ from: string; to: string; amount: number }>) {
    // Dispatch a custom window event that BlockchainViz listens for
    window.dispatchEvent(new CustomEvent('user-tx', { detail: e.detail }));
  }

  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    mobileMenuOpen = false; // Close mobile menu after navigation
  }

  function selectWalletTab(ws: WalletWorkspace) {
    setWalletWorkspace(ws, true);
    mobileMenuOpen = false;
  }

  function handleNavigate(route: Route) {
    navigateTo(route);
    mobileMenuOpen = false;
  }

  $: nav = [
    { id: "pillars", label: $t('pillars.title') },
    { id: "branches", label: $t('branches.title') },
    { id: "projects", label: $t('showcase.title') },
    { id: "contact", label: "Contact" },
  ];

  function toggleLocale() {
    locale.update(l => l === 'en' ? 'zh' : 'en');
  }

  $: if (typeof document !== 'undefined') {
    if ($currentRoute === 'wallet') {
      document.title = $locale === 'zh'
        ? 'Starlab MPC 钱包 | 零助记词全链门限托管 & 实操攻略'
        : 'Starlab MPC Wallet | Zero-Seed Multi-Chain Threshold Custody';
    } else if ($currentRoute === 'explorer') {
      document.title = $locale === 'zh'
        ? 'StarsLab 区块浏览器'
        : 'StarsLab | Blockchain Explorer';
    } else {
      document.title = 'StarsLab | Blockchain • AI • Humanoid Systems';
    }
  }
</script>

{#if $currentRoute === 'home'}
  <BlockchainViz />
  <WebGPUParticles />
  <GlitchEffect />
  <BlockchainStats />
  <TransactionPanel on:submit={handleUserTx} />
{/if}

<nav
  class="fixed top-0 left-0 right-0 backdrop-blur bg-black/55 border-b border-white/10"
  style="z-index: 100;"
>
  <div
    class="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between"
  >
    {#if $currentRoute === 'wallet'}
      <button
        on:click={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        class="flex items-center gap-2 font-semibold tracking-wide cursor-pointer"
      >
        <img src={faviconUrl} alt="Starlab Wallet" class="w-8 h-8" />
        <span class="gradient-text text-lg">Starlab Wallet</span>
      </button>
    {:else}
      <button
        on:click={() => handleNavigate('home')}
        class="flex items-center gap-2 font-semibold tracking-wide cursor-pointer"
      >
        <img src={faviconUrl} alt="StarsLab" class="w-8 h-8" />
        <span class="gradient-text text-lg">StarsLab</span>
      </button>
    {/if}
    
    <!-- Desktop Navigation -->
    <ul class="hidden md:flex gap-7 text-sm items-center">
      {#if $currentRoute === 'wallet'}
        {#each [
          { id: 'sandbox', zh: '⚡ 在线体验', en: '⚡ Sandbox' },
          { id: 'guides', zh: '🎬 操作动图', en: '🎬 GIF Guides' },
          { id: 'chains', zh: '🌐 全链对比', en: '🌐 Chains' },
          { id: 'protocol', zh: '🧠 协议原理', en: '🧠 Protocol' },
          { id: 'faq', zh: '❓ FAQ', en: '❓ FAQ' },
        ] as item}
          <li>
            <button
              on:click={() => selectWalletTab(item.id as WalletWorkspace)}
              class="transition cursor-pointer {$walletWorkspace === item.id
                ? 'text-brand-neon font-bold'
                : 'text-white/75 hover:text-white'}"
            >
              {$locale === 'zh' ? item.zh : item.en}
            </button>
          </li>
        {/each}
        <li>
          <a
            href="https://starslab.qzz.io"
            class="text-white/50 hover:text-white transition"
          >
            StarsLab &nearr;
          </a>
        </li>
      {:else}
        {#if $currentRoute === 'home'}
          {#each nav as n}
            <li>
              <button
                on:click={() => scrollToId(n.id)}
                class="text-white/70 hover:text-brand-accent transition cursor-pointer"
                >{n.label}</button
              >
            </li>
          {/each}
        {/if}
        <li>
          <a
            href="https://wallet.starslab.qzz.io"
            class="text-white/75 hover:text-brand-accent transition font-medium"
          >
            {$t('nav.wallet')} &nearr;
          </a>
        </li>
        <li>
          <button
            on:click={() => handleNavigate('explorer')}
            class="text-white/70 hover:text-brand-accent transition cursor-pointer {$currentRoute === 'explorer' ? 'text-brand-accent font-semibold' : ''}"
          >
            {$t('nav.explorer')}
          </button>
        </li>
      {/if}
      <li>
        <button
          on:click={toggleLocale}
          class="px-2 py-1 rounded text-white/70 hover:text-white bg-white/10 hover:bg-white/20 transition text-xs font-mono cursor-pointer"
        >
          {$locale === 'en' ? '中' : 'EN'}
        </button>
      </li>
    </ul>

    <!-- Desktop CTA -->
    <div class="hidden md:flex gap-3 items-center">
      {#if $currentRoute === 'wallet'}
        <a
          href="https://github.com/stars-labs/starlab-desktop/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
          class="px-4 py-2 rounded-md bg-brand-accent text-white text-sm font-semibold hover:brightness-110 transition"
        >
          {$locale === 'zh' ? '下载客户端' : 'Download'} &nearr;
        </a>
      {:else if $currentRoute === 'explorer'}
        <button
          on:click={() => handleNavigate('home')}
          class="px-4 py-2 rounded-md border border-brand-accent text-brand-accent text-sm font-medium hover:bg-brand-accent hover:text-black transition cursor-pointer"
        >
          {$locale === 'zh' ? '返回首页' : 'Back to Home'}
        </button>
      {:else}
        <button
          on:click={() => scrollToId("contact")}
          class="px-4 py-2 rounded-md bg-brand-accent text-sm font-medium hover:brightness-110 cursor-pointer"
        >
          Join
        </button>
      {/if}
    </div>

    <!-- Mobile Menu Button -->
    <button
      on:click={() => mobileMenuOpen = !mobileMenuOpen}
      class="md:hidden p-2 text-white/70 hover:text-white"
      aria-label="Toggle menu"
    >
      {#if mobileMenuOpen}
        <!-- Close Icon -->
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      {:else}
        <!-- Hamburger Icon -->
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      {/if}
    </button>
  </div>
  
  <!-- Mobile Menu Dropdown -->
  {#if mobileMenuOpen}
    <div class="md:hidden absolute top-16 left-0 right-0 bg-black/95 backdrop-blur border-b border-white/10">
      <div class="px-6 py-4 space-y-3">
        {#if $currentRoute === 'wallet'}
          {#each [
            { id: 'sandbox', zh: '⚡ 在线 WASM 体验', en: '⚡ Live WASM Sandbox' },
            { id: 'guides', zh: '🎬 四端操作动图 (36 GIF)', en: '🎬 Client GIF Guides (36)' },
            { id: 'chains', zh: '🌐 全链支持 & 对比', en: '🌐 Chains & Comparison' },
            { id: 'protocol', zh: '🧠 协议原理 & 安全清单', en: '🧠 Protocol & Checklist' },
            { id: 'faq', zh: '❓ 深度 FAQ', en: '❓ FAQ' },
          ] as item}
            <button
              on:click={() => selectWalletTab(item.id as WalletWorkspace)}
              class="block w-full text-left py-2 {$walletWorkspace === item.id ? 'text-brand-neon font-bold' : 'text-white/75 hover:text-white'}"
            >
              {$locale === 'zh' ? item.zh : item.en}
            </button>
          {/each}
          <a href="https://starslab.qzz.io" class="block w-full text-left text-white/50 hover:text-white py-2">
            {$locale === 'zh' ? 'StarsLab 实验室官网' : 'StarsLab Home'} &nearr;
          </a>
        {:else}
          {#if $currentRoute === 'home'}
            {#each nav as n}
              <button
                on:click={() => scrollToId(n.id)}
                class="block w-full text-left text-white/70 hover:text-brand-accent transition py-2"
              >
                {n.label}
              </button>
            {/each}
          {/if}
          <a
            href="https://wallet.starslab.qzz.io"
            class="block w-full text-left text-white/75 hover:text-brand-accent transition py-2"
          >
            {$t('nav.wallet')} &nearr;
          </a>
          <button
            on:click={() => handleNavigate('explorer')}
            class="block w-full text-left text-white/70 hover:text-brand-accent transition py-2 {$currentRoute === 'explorer' ? 'text-brand-accent' : ''}"
          >
            {$t('nav.explorer')}
          </button>
        {/if}
        <div class="pt-3 border-t border-white/10 flex items-center justify-between">
          <button
            on:click={toggleLocale}
            class="px-3 py-1.5 rounded text-white/70 hover:text-white bg-white/10 hover:bg-white/20 transition text-sm font-mono"
          >
            {$locale === 'en' ? '中文' : 'English'}
          </button>
          {#if $currentRoute === 'wallet'}
            <a
              href="https://github.com/stars-labs/starlab-desktop/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2 rounded-md bg-brand-accent text-white text-sm font-medium hover:brightness-110"
            >
              {$locale === 'zh' ? '下载客户端' : 'Download'} &nearr;
            </a>
          {:else if $currentRoute === 'explorer'}
            <button
              on:click={() => handleNavigate('home')}
              class="px-4 py-2 rounded-md border border-brand-accent text-brand-accent text-sm font-medium hover:bg-brand-accent hover:text-black transition"
            >
              {$locale === 'zh' ? '返回首页' : 'Back to Home'}
            </button>
          {:else}
            <button
              on:click={() => scrollToId("contact")}
              class="px-4 py-2 rounded-md bg-brand-accent text-sm font-medium hover:brightness-110"
            >
              Join
            </button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</nav>

{#if $currentRoute === 'home'}
  <!-- Full-viewport hero section with blockchain viz as backdrop -->
  <section class="relative min-h-screen flex items-center justify-center" style="z-index: 10;">
    <Hero {scrollToId} />
    <!-- Interactive hint -->
    <div class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-pulse-slow">
      <span class="text-white/60 text-sm font-mono tracking-wider">Click anywhere to mine blocks</span>
      <svg class="w-5 h-5 text-brand-neon/60 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
      </svg>
    </div>
  </section>

  <!-- Live block feed bridging viz → explorer -->
  <div class="relative" style="z-index: 10;">
    <LiveBlockFeed />
  </div>

  <main class="relative" style="z-index: 10;">
    <div id="pillars"><Pillars /></div>
    <div id="branches"><Branches /></div>
    <div id="projects"><Showcase /></div>
    <CTA />
  </main>
  <Footer />
{:else if $currentRoute === 'wallet'}
  <WalletGuide />
  <Footer />
{:else if $currentRoute === 'explorer'}
  <BlockchainExplorer />
{/if}
