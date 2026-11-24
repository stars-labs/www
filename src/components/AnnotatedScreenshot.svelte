<script context="module" lang="ts">
  export interface Callout {
    id: number;
    /** Highlight box in percentage (0-100) of the image dimensions */
    x: number;
    y: number;
    w: number;
    h: number;
    /** Optional badge anchor offset: 'tl' | 'tr' | 'bl' | 'br' */
    anchor?: 'tl' | 'tr' | 'bl' | 'br';
    /** Color theme: 'accent' (#e94560) | 'neon' (#00ffff) | 'violet' (#a78bfa) */
    tone?: 'accent' | 'neon' | 'violet';
    labelEn: string;
    labelZh: string;
    detailEn?: string;
    detailZh?: string;
  }
</script>

<script lang="ts">
  import { locale } from '../lib/i18n';

  export let src: string;
  export let alt: string;
  export let titleEn: string = '';
  export let titleZh: string = '';
  export let device: 'desktop' | 'extension' = 'desktop';
  export let callouts: Callout[] = [];
  export let aspectHint: string = '';

  let showAnnotations = true;
  let activeId: number | null = null;
  let lightboxOpen = false;

  const toneColors: Record<string, { stroke: string; fill: string; badgeBg: string; badgeText: string; ring: string }> = {
    accent: {
      stroke: '#ff4d6d',
      fill: 'rgba(233, 69, 96, 0.14)',
      badgeBg: '#e94560',
      badgeText: '#ffffff',
      ring: 'rgba(233, 69, 96, 0.45)',
    },
    neon: {
      stroke: '#00f5ff',
      fill: 'rgba(0, 245, 255, 0.12)',
      badgeBg: '#00d9e6',
      badgeText: '#071019',
      ring: 'rgba(0, 245, 255, 0.45)',
    },
    violet: {
      stroke: '#a78bfa',
      fill: 'rgba(167, 139, 250, 0.16)',
      badgeBg: '#7c3aed',
      badgeText: '#ffffff',
      ring: 'rgba(167, 139, 250, 0.45)',
    },
  };

  function getTone(tone?: string) {
    return toneColors[tone || 'accent'] || toneColors.accent;
  }

  function badgePos(c: Callout): { bx: number; by: number } {
    const a = c.anchor || 'tl';
    if (a === 'tr') return { bx: c.x + c.w, by: c.y };
    if (a === 'bl') return { bx: c.x, by: c.y + c.h };
    if (a === 'br') return { bx: c.x + c.w, by: c.y + c.h };
    return { bx: c.x, by: c.y };
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && lightboxOpen) {
      lightboxOpen = false;
    }
  }

  $: title = $locale === 'zh' ? titleZh || titleEn : titleEn || titleZh;
</script>

<svelte:window on:keydown={handleKeydown} />

<figure
  class="group rounded-2xl border border-white/10 bg-[#121826]/90 shadow-2xl overflow-hidden flex flex-col"
>
  <!-- Top chrome header -->
  <div class="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/10 bg-black/30">
    <div class="flex items-center gap-2.5 min-w-0">
      {#if device === 'desktop'}
        <span class="flex items-center gap-1.5 shrink-0">
          <span class="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></span>
        </span>
      {:else}
        <span
          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono bg-violet-500/20 text-violet-300 border border-violet-400/30 shrink-0"
        >
          Chrome Extension
        </span>
      {/if}
      {#if title}
        <span class="text-xs font-medium text-white/75 truncate">{title}</span>
      {/if}
    </div>

    <div class="flex items-center gap-2 shrink-0">
      {#if callouts.length > 0}
        <button
          type="button"
          on:click={() => (showAnnotations = !showAnnotations)}
          class="px-2.5 py-1 rounded-md text-[11px] font-mono border transition cursor-pointer {showAnnotations
            ? 'bg-brand-accent/20 text-brand-accent border-brand-accent/40'
            : 'bg-white/5 text-white/60 border-white/10 hover:text-white'}"
        >
          {showAnnotations
            ? $locale === 'zh'
              ? '隐藏标注'
              : 'Hide Callouts'
            : $locale === 'zh'
              ? '显示标注'
              : 'Show Callouts'}
        </button>
      {/if}
      <button
        type="button"
        on:click={() => (lightboxOpen = true)}
        class="px-2.5 py-1 rounded-md text-[11px] font-mono bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition cursor-pointer"
        aria-label={$locale === 'zh' ? '放大查看' : 'Zoom'}
      >
        {$locale === 'zh' ? '放大' : 'Zoom'}
      </button>
    </div>
  </div>

  <!-- Screenshot stage with crisp SVG vector callout overlays -->
  <div
    class="relative w-full flex items-center justify-center p-3 sm:p-4 {device === 'extension'
      ? 'bg-gradient-to-br from-[#161b2e] via-[#121629] to-[#1a1330]'
      : 'bg-[#0b0f19]'}"
  >
    <div
      class="relative {device === 'extension' ? 'w-full max-w-[360px] rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.65)] ring-1 ring-white/15' : 'w-full rounded-lg overflow-hidden'}"
      style={aspectHint ? `aspect-ratio: ${aspectHint};` : ''}
    >
      <img
        {src}
        {alt}
        loading="lazy"
        class="block w-full h-auto select-none"
      />

      {#if showAnnotations && callouts.length > 0}
        <div class="absolute inset-0 pointer-events-none">
          {#each callouts as c (c.id)}
            {@const tone = getTone(c.tone)}
            {@const pos = badgePos(c)}
            {@const isActive = activeId === c.id}
            <!-- Highlight frame -->
            <div
              class="absolute rounded-lg transition-all duration-200"
              style="
                left: {c.x}%;
                top: {c.y}%;
                width: {c.w}%;
                height: {c.h}%;
                border: {isActive ? '3px' : '2px'} solid {tone.stroke};
                background: {tone.fill};
                box-shadow: 0 0 {isActive ? '24px' : '12px'} {tone.ring};
                opacity: {activeId !== null && !isActive ? 0.3 : 1};
              "
            ></div>

            <!-- Numbered badge -->
            <button
              type="button"
              class="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full font-mono text-xs sm:text-sm font-bold flex items-center justify-center shadow-lg transition-all duration-150 cursor-pointer {isActive
                ? 'scale-125 z-20'
                : 'hover:scale-115 z-10'}"
              style="
                left: {pos.bx}%;
                top: {pos.by}%;
                background: {tone.badgeBg};
                color: {tone.badgeText};
                box-shadow: 0 0 0 2px rgba(10,14,24,0.9), 0 4px 14px {tone.ring};
                opacity: {activeId !== null && !isActive ? 0.45 : 1};
              "
              on:mouseenter={() => (activeId = c.id)}
              on:mouseleave={() => (activeId = null)}
              on:click={() => (activeId = activeId === c.id ? null : c.id)}
              aria-label={$locale === 'zh' ? c.labelZh : c.labelEn}
            >
              {c.id}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Numbered annotation legend -->
  {#if callouts.length > 0}
    <figcaption class="px-4 py-3.5 bg-black/25 border-t border-white/10 space-y-2">
      {#each callouts as c (c.id)}
        {@const tone = getTone(c.tone)}
        {@const isActive = activeId === c.id}
        <button
          type="button"
          class="w-full text-left flex items-start gap-2.5 px-2.5 py-1.5 rounded-lg transition cursor-pointer {isActive
            ? 'bg-white/10'
            : 'hover:bg-white/5'}"
          on:mouseenter={() => (activeId = c.id)}
          on:mouseleave={() => (activeId = null)}
          on:click={() => (activeId = activeId === c.id ? null : c.id)}
        >
          <span
            class="mt-0.5 w-5 h-5 rounded-full font-mono text-[11px] font-bold flex items-center justify-center shrink-0"
            style="background: {tone.badgeBg}; color: {tone.badgeText};"
          >
            {c.id}
          </span>
          <span class="text-xs sm:text-sm leading-snug">
            <strong class="text-white font-semibold">
              {$locale === 'zh' ? c.labelZh : c.labelEn}
            </strong>
            {#if ($locale === 'zh' ? c.detailZh : c.detailEn)}
              <span class="text-white/65 ml-1">
                — {$locale === 'zh' ? c.detailZh : c.detailEn}
              </span>
            {/if}
          </span>
        </button>
      {/each}
    </figcaption>
  {/if}
</figure>

<!-- Fullscreen lightbox modal -->
{#if lightboxOpen}
  <div
    class="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
    role="dialog"
    aria-modal="true"
    aria-label={title || alt}
  >
    <button
      type="button"
      class="absolute inset-0 cursor-zoom-out"
      aria-label="Close"
      on:click={() => (lightboxOpen = false)}
    ></button>
    <div class="relative z-10 max-w-6xl w-full max-h-[92vh] flex flex-col gap-3">
      <div class="flex items-center justify-between text-white">
        <span class="text-sm font-medium">{title || alt}</span>
        <button
          type="button"
          on:click={() => (lightboxOpen = false)}
          class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono cursor-pointer"
        >
          ESC / {$locale === 'zh' ? '关闭' : 'Close'}
        </button>
      </div>
      <div class="relative overflow-auto rounded-xl border border-white/15 bg-[#0b0f19] p-3 flex justify-center">
        <div class="relative {device === 'extension' ? 'max-w-[440px] w-full' : 'w-full'}">
          <img {src} {alt} class="block w-full h-auto rounded-lg" />
          {#if showAnnotations && callouts.length > 0}
            <div class="absolute inset-0 pointer-events-none">
              {#each callouts as c (c.id)}
                {@const tone = getTone(c.tone)}
                {@const pos = badgePos(c)}
                <div
                  class="absolute rounded-lg"
                  style="
                    left: {c.x}%;
                    top: {c.y}%;
                    width: {c.w}%;
                    height: {c.h}%;
                    border: 2.5px solid {tone.stroke};
                    background: {tone.fill};
                    box-shadow: 0 0 16px {tone.ring};
                  "
                ></div>
                <div
                  class="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full font-mono text-sm font-bold flex items-center justify-center shadow-lg"
                  style="
                    left: {pos.bx}%;
                    top: {pos.by}%;
                    background: {tone.badgeBg};
                    color: {tone.badgeText};
                    box-shadow: 0 0 0 2px rgba(10,14,24,0.9);
                  "
                >
                  {c.id}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
