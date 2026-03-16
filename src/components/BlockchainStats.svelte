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

  let refreshInterval: ReturnType<typeof setInterval>;
  let isLoading = false;
  let apiConnected = false;

  async function fetchStats() {
    if (isLoading) return;
    isLoading = true;

    try {
      // Fetch multiple stats in parallel
      const [chainStats, txStats, networkStats, miningStats, globalAnalytics] = await Promise.all([
        api.getChainStats().catch(() => ({ totalBlocks: 0, latestHeight: 0 })),
        api.getTransactionStats().catch(() => ({ totalTransactions: 0, pendingCount: 0, confirmedCount: 0 })),
        api.getNetworkStats().catch(() => ({ network: { activeNodes: 0 } })),
        api.getMiningStats().catch(() => null),
        api.getGlobalAnalytics(1).catch(() => ({ interactions: {}, mining: {} }))
      ]);

      stats = {
        totalBlocks: chainStats?.totalBlocks || 0,
        totalTransactions: txStats?.totalTransactions || 0,
        pendingTxs: txStats?.pendingCount || 0,
        confirmedTxs: txStats?.confirmedCount || 0,
        activeNodes: networkStats?.network?.activeNodes || 0,
        miningSpeed: miningStats?.speedMultiplier || 1,
        userInteractions: globalAnalytics?.interactions?.totalInteractions || 0
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
    refreshInterval = setInterval(fetchStats, 30000);
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