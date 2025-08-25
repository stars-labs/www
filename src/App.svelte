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

  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const nav = [
    { id: "pillars", label: "Pillars" },
    { id: "projects", label: "Projects" },
    { id: "contact", label: "Contact" },
  ];
</script>

<BlockchainViz />
<WebGPUParticles />
<TechGrid />
<GlitchEffect />
<BlockchainStats />

<nav
  class="fixed top-0 left-0 right-0 backdrop-blur bg-black/40 border-b border-white/10"
  style="z-index: 100;"
>
  <div
    class="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between"
  >
    <div class="flex items-center gap-2 font-semibold tracking-wide">
      <span class="gradient-text text-lg">StarsLab</span>
    </div>
    <ul class="hidden md:flex gap-8 text-sm">
      {#each nav as n}
        <li>
          <button
            on:click={() => scrollToId(n.id)}
            class="text-white/70 hover:text-brand-accent transition"
            >{n.label}</button
          >
        </li>
      {/each}
    </ul>
    <button
      on:click={() => scrollToId("contact")}
      class="px-4 py-2 rounded-md bg-brand-accent text-sm font-medium hover:brightness-110"
      >Join</button
    >
  </div>
</nav>

<main class="relative" style="z-index: 10;">
  <Hero {scrollToId} />
  <div id="pillars"><Pillars /></div>
  <div id="projects"><Showcase /></div>
  <CTA />
</main>

<Footer />
