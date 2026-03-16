<script lang="ts">
  const projects = [
    {
      name: "MPC Wallet",
      tag: "Threshold Crypto",
      desc: "Multi-party FROST signing across browser, CLI, native nodes.",
      link: "https://github.com/stars-labs/mpc-wallet",
      ready: true,
    },
    {
      name: "Secure Signaling",
      tag: "Networking",
      desc: "Resilient WebRTC signaling with cryptographic session semantics.",
      link: "",
      ready: false,
    },
    {
      name: "Agent Control Stack",
      tag: "AI + Robotics",
      desc: "Layered autonomy pipeline for task planning + safe actuation.",
      link: "",
      ready: false,
    },
  ];
</script>

<section class="section">
  <div class="flex items-end justify-between mb-10">
    <h2 class="text-3xl md:text-5xl font-bold">Research & Builds</h2>
    <a href="https://github.com/stars-labs" class="text-sm text-brand-accent hover:underline"
      >All repositories &rarr;</a
    >
  </div>
  <div class="grid md:grid-cols-3 gap-6">
    {#each projects as pr}
      {#if pr.ready}
        <a
          href={pr.link}
          target="_blank"
          rel="noopener noreferrer"
          class="group relative rounded-2xl p-6 bg-brand-surface/60 border border-white/10 hover:border-brand-accent/60 transition flex flex-col gap-4"
        >
          <div class="text-xs uppercase tracking-wider text-brand-accent">
            {pr.tag}
          </div>
          <h3 class="text-xl font-semibold">{pr.name}</h3>
          <p class="text-sm text-white/65 leading-relaxed flex-1">{pr.desc}</p>
          <span
            class="text-sm text-white/60 group-hover:text-brand-accent transition"
            >View &rarr;</span
          >
          <div
            class="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[radial-gradient(circle_at_70%_30%,rgba(0,255,255,0.15),transparent_70%)]"
          ></div>
        </a>
      {:else}
        <div
          class="group relative rounded-2xl p-6 bg-brand-surface/60 border border-white/10 flex flex-col gap-4 opacity-70"
        >
          <div class="text-xs uppercase tracking-wider text-brand-accent">
            {pr.tag}
          </div>
          <h3 class="text-xl font-semibold">{pr.name}</h3>
          <p class="text-sm text-white/65 leading-relaxed flex-1">{pr.desc}</p>
          <span class="text-sm text-white/40">Coming Soon</span>
        </div>
      {/if}
    {/each}
  </div>
</section>
