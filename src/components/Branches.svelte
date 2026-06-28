<script lang="ts">
  import { t } from '../lib/i18n';

  $: branches = [
    {
      icon: "🎮",
      title: $t('branches.games.title'),
      desc: $t('branches.games.desc'),
      link: "",
      cta: "",
    },
    {
      icon: "📈",
      title: $t('branches.quant.title'),
      desc: $t('branches.quant.desc'),
      link: "",
      cta: "",
    },
    {
      icon: "💱",
      title: $t('branches.exchange.title'),
      desc: $t('branches.exchange.desc'),
      link: "https://github.com/stars-labs/pg-outcry",
      cta: $t('branches.live'),
    }
  ];

  const cardClass =
    "group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-brand-surface to-brand-bg border border-white/10 flex flex-col";
</script>

<section id="branches" class="section">
  <h2 class="text-3xl md:text-5xl font-bold mb-12">{$t('branches.title')}</h2>
  <div class="grid md:grid-cols-3 gap-6">
    {#each branches as b}
      {#if b.link}
        <a
          href={b.link}
          target="_blank"
          rel="noopener noreferrer"
          class="{cardClass} hover:border-brand-accent/60 transition"
        >
          <div class="text-3xl mb-4">{b.icon}</div>
          <h3 class="font-semibold mb-2">{b.title}</h3>
          <p class="text-sm text-white/65 leading-relaxed flex-1">{b.desc}</p>
          <span class="mt-4 text-sm text-brand-accent group-hover:underline">{b.cta} &rarr;</span>
          <div
            class="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,255,0.2),transparent_70%)]"
          ></div>
        </a>
      {:else}
        <div class={cardClass}>
          <div class="text-3xl mb-4">{b.icon}</div>
          <h3 class="font-semibold mb-2">{b.title}</h3>
          <p class="text-sm text-white/65 leading-relaxed flex-1">{b.desc}</p>
          <div
            class="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,255,0.2),transparent_70%)]"
          ></div>
        </div>
      {/if}
    {/each}
  </div>
</section>
