<script lang="ts">
  import { onMount } from 'svelte';
  
  export let scrollToId = (id: string) => {};
  
  let titleVisible = false;
  let contentVisible = false;
  let cardsVisible = false;
  
  onMount(() => {
    setTimeout(() => titleVisible = true, 100);
    setTimeout(() => contentVisible = true, 300);
    setTimeout(() => cardsVisible = true, 500);
  });
</script>

<section class="section pt-32 pb-24 flex flex-col gap-10 relative">
  <div class="max-w-3xl space-y-6 relative z-10">
    <h1 class="text-4xl md:text-6xl font-extrabold leading-tight hero-title" class:visible={titleVisible}>
      Building the <span class="gradient-text animated-gradient">Convergent Future</span><br />
      <span class="tech-stack">Blockchain • AI • Humanoid Systems</span>
    </h1>
    <p class="text-lg md:text-xl text-white/70 hero-content" class:visible={contentVisible}>
      StarsLab is a deep R&amp;D lab advancing decentralized cryptography,
      intelligent autonomy, and human‑centric robotics—fusing trust, cognition,
      and embodiment.
    </p>
    <div class="flex flex-wrap gap-4 hero-buttons" class:visible={contentVisible}>
      <button
        on:click={() => scrollToId("pillars")}
        class="px-6 py-3 rounded-lg font-medium bg-brand-accent hover:brightness-110 transition"
      >
        Explore Pillars
      </button>
      <button
        on:click={() => scrollToId("contact")}
        class="px-6 py-3 rounded-lg font-medium bg-white/5 hover:bg-white/10 backdrop-blur border border-white/10 transition"
      >
        Get Involved
      </button>
    </div>
  </div>
  <div class="grid md:grid-cols-3 gap-6 mt-4 hero-cards" class:visible={cardsVisible}>
    {#each [{ t: "Cryptographic Wallet Infra", d: "Threshold MPC, zero-knowledge, multi-chain security primitives." }, { t: "Adaptive Intelligence", d: "Model distillation + on-device reasoning for autonomous agents." }, { t: "Humanoid Integration", d: "Realtime intent fusion: perception, control, secure coordination." }] as c, i}
      <div
        class="tech-card glow-border rounded-2xl p-6 bg-brand-surface/60 backdrop-blur-sm flex flex-col gap-3"
        style="animation-delay: {i * 150}ms"
      >
        <h3 class="text-lg font-semibold">{c.t}</h3>
        <p class="text-sm text-white/65 leading-relaxed">{c.d}</p>
      </div>
    {/each}
  </div>
</section>

<style>
  .hero-title {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .hero-title.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  .animated-gradient {
    background-size: 200% 200%;
    animation: gradient-shift 4s ease infinite;
  }
  
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  .tech-stack {
    display: inline-block;
    font-size: 0.5em;
    opacity: 0.8;
    letter-spacing: 0.05em;
    animation: tech-glow 2s ease-in-out infinite;
  }
  
  @keyframes tech-glow {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  
  .hero-content, .hero-buttons {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    transition-delay: 0.2s;
  }
  
  .hero-content.visible, .hero-buttons.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  .hero-cards {
    opacity: 0;
  }
  
  .hero-cards.visible .tech-card {
    animation: card-slide-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  
  @keyframes card-slide-in {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .tech-card {
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .tech-card::before {
    content: "";
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #E94560, #00FFFF, #E94560);
    background-size: 300% 300%;
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 18px;
    animation: gradient-rotate 3s linear infinite;
  }
  
  .tech-card:hover::before {
    opacity: 0.3;
  }
  
  .tech-card:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 20px 40px rgba(233, 69, 96, 0.2);
  }
  
  @keyframes gradient-rotate {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
</style>
