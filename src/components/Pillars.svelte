<script lang="ts">
  const pillars = [
    {
      icon: "🛡️",
      title: "Decentralized Security",
      desc: "Advanced MPC (e.g. FROST), verifiable compute, programmable trust rails.",
    },
    {
      icon: "🧠",
      title: "Bounded Intelligence",
      desc: "Safe agent architectures combining symbolic guardrails with neural adaptability.",
    },
    {
      icon: "🤖",
      title: "Humanoid Interfaces",
      desc: "Secure control channels + sensor fusion for embodied collaboration.",
    },
    {
      icon: "⚙️",
      title: "Edge Coordination",
      desc: "Deterministic mesh protocols enabling low-latency multi-agent swarms.",
    },
  ];
</script>

<section id="pillars" class="section">
  <h2 class="text-3xl md:text-5xl font-bold mb-12">Innovation Pillars</h2>
  <div class="grid md:grid-cols-4 gap-6">
    {#each pillars as p}
      <div
        class="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-brand-surface to-brand-bg border border-white/10"
      >
        <div class="text-3xl mb-4">{p.icon}</div>
        <h3 class="font-semibold mb-2">{p.title}</h3>
        <p class="text-sm text-white/65 leading-relaxed">{p.desc}</p>
        <div
          class="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(233,69,96,0.25),transparent_70%)]"
        ></div>
      </div>
    {/each}
  </div>
</section>
