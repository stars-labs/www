<script lang="ts">
  import { navigateTo, type Route } from '../lib/router';
  import { t } from '../lib/i18n';

  $: pillars = [
    {
      icon: "🛡️",
      title: $t('pillars.p1.title'),
      desc: $t('pillars.p1.desc'),
      link: "https://github.com/stars-labs/mpc-wallet",
      linkLabel: $t('pillars.repo'),
      external: true,
    },
    {
      icon: "🧠",
      title: $t('pillars.p2.title'),
      desc: $t('pillars.p2.desc'),
      link: "",
      linkLabel: $t('pillars.comingSoon'),
      external: false,
    },
    {
      icon: "🤖",
      title: $t('pillars.p3.title'),
      desc: $t('pillars.p3.desc'),
      link: "",
      linkLabel: $t('pillars.comingSoon'),
      external: false,
    },
    {
      icon: "⚙️",
      title: $t('pillars.p4.title'),
      desc: $t('pillars.p4.desc'),
      link: "explorer",
      linkLabel: $t('pillars.liveDemo'),
      external: false,
    },
  ];

  function handleClick(pillar: typeof pillars[0]) {
    if (pillar.external && pillar.link) {
      window.open(pillar.link, '_blank', 'noopener,noreferrer');
    } else if (pillar.link) {
      navigateTo(pillar.link as Route);
    }
  }
</script>

<section id="pillars" class="section">
  <h2 class="text-3xl md:text-5xl font-bold mb-12">{$t('pillars.title')}</h2>
  <div class="grid md:grid-cols-4 gap-6">
    {#each pillars as p}
      <div
        class="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-brand-surface to-brand-bg border border-white/10 flex flex-col"
      >
        <div class="text-3xl mb-4">{p.icon}</div>
        <h3 class="font-semibold mb-2">{p.title}</h3>
        <p class="text-sm text-white/65 leading-relaxed flex-1">{p.desc}</p>
        {#if p.link}
          <button
            on:click={() => handleClick(p)}
            class="mt-3 text-xs text-brand-accent hover:text-white transition self-start"
          >
            {p.linkLabel} &rarr;
          </button>
        {:else}
          <span class="mt-3 text-xs text-white/30">{p.linkLabel}</span>
        {/if}
        <div
          class="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(233,69,96,0.25),transparent_70%)]"
        ></div>
      </div>
    {/each}
  </div>
</section>
