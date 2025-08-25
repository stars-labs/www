<script lang="ts">
  const projects = [
    {
      name: "MPC Wallet",
      tag: "Threshold Crypto",
      desc: "Multi-party FROST signing across browser, CLI, native nodes.",
      link: "https://github.com/stars-labs/mpc-wallet",
    },
    {
      name: "Secure Signaling",
      tag: "Networking",
      desc: "Resilient WebRTC signaling with cryptographic session semantics.",
      link: "#",
    },
    {
      name: "Agent Control Stack",
      tag: "AI + Robotics",
      desc: "Layered autonomy pipeline for task planning + safe actuation.",
      link: "#",
    },
  ];
</script>

<section class="section">
  <div class="flex items-end justify-between mb-10">
    <h2 class="text-3xl md:text-5xl font-bold">Research & Builds</h2>
    <a href="#" class="text-sm text-brand-accent hover:underline"
      >All repositories →</a
    >
  </div>
  <div class="grid md:grid-cols-3 gap-6">
    {#each projects as pr}
      <a
        href={pr.link}
        class="group relative rounded-2xl p-6 bg-brand-surface/60 border border-white/10 hover:border-brand-accent/60 transition flex flex-col gap-4"
      >
        <div class="text-xs uppercase tracking-wider text-brand-accent">
          {pr.tag}
        </div>
        <h3 class="text-xl font-semibold">{pr.name}</h3>
        <p class="text-sm text-white/65 leading-relaxed flex-1">{pr.desc}</p>
        <span
          class="text-sm text-white/60 group-hover:text-brand-accent transition"
          >View →</span
        >
        <div
          class="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[radial-gradient(circle_at_70%_30%,rgba(0,255,255,0.15),transparent_70%)]"
        ></div>
      </a>
    {/each}
  </div>
</section>
