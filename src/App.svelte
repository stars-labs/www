<script lang="ts">
  import Hero from "./components/Hero.svelte";
  import Pillars from "./components/Pillars.svelte";
  import Showcase from "./components/Showcase.svelte";
  import CTA from "./components/CTA.svelte";
  import Footer from "./components/Footer.svelte";
  import WebGPUParticles from "./components/WebGPUParticles.svelte";
  import TechGrid from "./components/TechGrid.svelte";
  import GlitchEffect from "./components/GlitchEffect.svelte";
  import BlockchainViz from "./components/BlockchainViz.svelte";
  import BlockchainStats from "./components/BlockchainStats.svelte";
  import BlockchainExplorer from "./components/BlockchainExplorer.svelte";
  import { currentRoute, navigateTo } from "./lib/router";
  import faviconUrl from "/favicon.png";

  let mobileMenuOpen = false;

  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    mobileMenuOpen = false; // Close mobile menu after navigation
  }

  function handleNavigate(route: string) {
    navigateTo(route);
    mobileMenuOpen = false;
  }

  const nav = [
    { id: "pillars", label: "Pillars" },
    { id: "projects", label: "Projects" },
    { id: "contact", label: "Contact" },
  ];
</script>

{#if $currentRoute === 'home'}
  <BlockchainViz />
  <WebGPUParticles />
  <TechGrid />
  <GlitchEffect />
  <BlockchainStats />
{/if}

<nav
  class="fixed top-0 left-0 right-0 backdrop-blur bg-black/40 border-b border-white/10"
  style="z-index: 100;"
>
  <div
    class="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between"
  >
    <button 
      on:click={() => handleNavigate('home')}
      class="flex items-center gap-2 font-semibold tracking-wide cursor-pointer"
    >
      <img src={faviconUrl} alt="StarsLab" class="w-8 h-8" />
      <span class="gradient-text text-lg">StarsLab</span>
    </button>
    
    <!-- Desktop Navigation -->
    <ul class="hidden md:flex gap-8 text-sm">
      {#if $currentRoute === 'home'}
        {#each nav as n}
          <li>
            <button
              on:click={() => scrollToId(n.id)}
              class="text-white/70 hover:text-brand-accent transition"
              >{n.label}</button
            >
          </li>
        {/each}
      {/if}
      <li>
        <button
          on:click={() => handleNavigate('explorer')}
          class="text-white/70 hover:text-brand-accent transition {$currentRoute === 'explorer' ? 'text-brand-accent' : ''}"
        >
          Explorer
        </button>
      </li>
    </ul>

    <!-- Desktop CTA -->
    <div class="hidden md:flex gap-4">
      {#if $currentRoute === 'explorer'}
        <button
          on:click={() => handleNavigate('home')}
          class="px-4 py-2 rounded-md border border-brand-accent text-brand-accent text-sm font-medium hover:bg-brand-accent hover:text-black transition"
        >
          Back to Home
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
        <button
          on:click={() => handleNavigate('explorer')}
          class="block w-full text-left text-white/70 hover:text-brand-accent transition py-2 {$currentRoute === 'explorer' ? 'text-brand-accent' : ''}"
        >
          Explorer
        </button>
        <div class="pt-3 border-t border-white/10">
          {#if $currentRoute === 'explorer'}
            <button
              on:click={() => handleNavigate('home')}
              class="w-full px-4 py-2 rounded-md border border-brand-accent text-brand-accent text-sm font-medium hover:bg-brand-accent hover:text-black transition"
            >
              Back to Home
            </button>
          {:else}
            <button
              on:click={() => scrollToId("contact")}
              class="w-full px-4 py-2 rounded-md bg-brand-accent text-sm font-medium hover:brightness-110"
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
  <main class="relative" style="z-index: 10;">
    <Hero {scrollToId} />
    <div id="pillars"><Pillars /></div>
    <div id="projects"><Showcase /></div>
    <CTA />
  </main>
  <Footer />
{:else if $currentRoute === 'explorer'}
  <BlockchainExplorer />
{/if}
