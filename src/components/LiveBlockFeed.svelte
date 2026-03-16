<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../services/api';
  import { navigateTo } from '../lib/router';

  import type { Block } from '../services/api';

  let blocks: Block[] = [];
  let refreshInterval: ReturnType<typeof setInterval>;

  async function fetchBlocks() {
    try {
      const data = await api.getBlocks(8, 0);
      blocks = data.blocks;
    } catch {
      // silently fail — feed is non-critical
    }
  }

  function formatHash(hash: string): string {
    return hash.length > 12 ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : hash;
  }

  function goToExplorer() {
    navigateTo('explorer');
  }

  onMount(() => {
    fetchBlocks();
    refreshInterval = setInterval(fetchBlocks, 15000);
  });

  onDestroy(() => {
    if (refreshInterval) clearInterval(refreshInterval);
  });
</script>

<div class="w-full bg-black/60 backdrop-blur-md border-y border-cyan-500/20 py-3 overflow-hidden">
  <div class="max-w-7xl mx-auto px-6 md:px-10 flex items-center gap-4">
    <button
      on:click={goToExplorer}
      class="shrink-0 text-xs font-semibold text-brand-neon uppercase tracking-wider hover:text-white transition"
    >
      Live Blocks &rarr;
    </button>

    <div class="flex gap-3 overflow-x-auto scrollbar-hide">
      {#each blocks as block}
        <button
          on:click={goToExplorer}
          class="shrink-0 flex items-center gap-2 bg-gray-900/60 border border-cyan-500/20 rounded-md px-3 py-1.5 text-xs font-mono hover:border-cyan-400/50 hover:bg-gray-800/60 transition cursor-pointer"
        >
          <span class="text-cyan-400">#{block.height}</span>
          <span class="text-white/40">{formatHash(block.hash)}</span>
          <span class="text-white/30">{block.txCount || 0} txs</span>
        </button>
      {/each}

      {#if blocks.length === 0}
        <span class="text-white/30 text-xs">Waiting for blocks...</span>
      {/if}
    </div>

    <button
      on:click={goToExplorer}
      class="shrink-0 ml-auto text-xs text-brand-accent hover:underline transition hidden md:block"
    >
      Open Explorer
    </button>
  </div>
</div>

<style>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
