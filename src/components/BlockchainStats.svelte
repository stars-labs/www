<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../services/api';

  let stats = {
    totalBlocks: 0,
    totalTransactions: 0,
    pendingTxs: 0,
    confirmedTxs: 0,
    activeNodes: 0,
    miningSpeed: 1,
    userInteractions: 0
  };

  let refreshInterval: NodeJS.Timeout;
  let isLoading = false;
  let apiConnected = false;

  async function fetchStats() {
    if (isLoading) return;
    isLoading = true;

    try {
      // Fetch multiple stats in parallel
      const [chainStats, txStats, networkStats, miningStats, globalAnalytics] = await Promise.all([
        api.getChainStats(),
        api.getTransactionStats(),
        api.getNetworkStats(),
        api.getMiningStats().catch(() => null),
        api.getGlobalAnalytics(1)
      ]);

      stats = {
        totalBlocks: chainStats.totalBlocks,
        totalTransactions: txStats.totalTransactions,
        pendingTxs: txStats.pendingCount,
        confirmedTxs: txStats.confirmedCount,
        activeNodes: networkStats.network.activeNodes || 0,
        miningSpeed: miningStats?.speedMultiplier || 1,
        userInteractions: globalAnalytics.interactions.totalInteractions || 0
      };

      apiConnected = true;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      apiConnected = false;
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    fetchStats();
    // Refresh stats every 5 seconds
    refreshInterval = setInterval(fetchStats, 5000);
  });

  onDestroy(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });
</script>

<div class="fixed bottom-4 right-4 bg-gray-900/80 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 text-cyan-400 font-mono text-sm z-50">
  <div class="flex items-center gap-2 mb-2">
    <div class="w-2 h-2 rounded-full {apiConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse"></div>
    <span class="text-xs">{apiConnected ? 'API Connected' : 'API Offline'}</span>
  </div>
  
  <div class="grid grid-cols-2 gap-x-4 gap-y-1">
    <div class="flex justify-between">
      <span class="text-gray-500">Blocks:</span>
      <span>{stats.totalBlocks}</span>
    </div>
    <div class="flex justify-between">
      <span class="text-gray-500">Txns:</span>
      <span>{stats.totalTransactions}</span>
    </div>
    <div class="flex justify-between">
      <span class="text-gray-500">Pending:</span>
      <span class="text-yellow-400">{stats.pendingTxs}</span>
    </div>
    <div class="flex justify-between">
      <span class="text-gray-500">Confirmed:</span>
      <span class="text-green-400">{stats.confirmedTxs}</span>
    </div>
    <div class="flex justify-between">
      <span class="text-gray-500">Nodes:</span>
      <span>{stats.activeNodes}</span>
    </div>
    <div class="flex justify-between">
      <span class="text-gray-500">Speed:</span>
      <span class="text-orange-400">{stats.miningSpeed.toFixed(1)}x</span>
    </div>
    <div class="flex justify-between col-span-2">
      <span class="text-gray-500">Interactions:</span>
      <span class="text-purple-400">{stats.userInteractions}</span>
    </div>
  </div>
</div>