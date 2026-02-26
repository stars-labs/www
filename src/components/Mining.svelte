<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../services/api';
  import Wallet from './Wallet.svelte';
  import AddNetworkButton from './AddNetworkButton.svelte';
  import BotActivity from './BotActivity.svelte';
  import Faucet from './Faucet.svelte';
  import { 
    MiningManager,
    isMining,
    hashRateFormatted,
    blocksFound,
    totalHashes,
    currentDifficulty,
    minerAddress,
    earningsFormatted,
    formatStars
  } from '../lib/mining';
  import { account } from '../lib/metamask';
  
  let miningManager: MiningManager;
  let miningStats: any = null;
  let statsInterval: number;
  let accountUnsubscribe: () => void;
  
  onMount(async () => {
    // Initialize mining manager
    miningManager = new MiningManager(api);
    
    // Wait a bit to ensure MetaMask connection is established
    setTimeout(async () => {
      await miningManager.getMinerAddress();
    }, 1000);
    
    // Request notification permission
    miningManager.requestNotificationPermission();
    
    // Fetch initial stats
    await fetchStats();
    
    // Update stats every 5 seconds
    statsInterval = setInterval(fetchStats, 5000);
    
    // Watch for account changes and update miner address
    accountUnsubscribe = account.subscribe(async (newAccount) => {
      if (miningManager && newAccount) {
        console.log('Account changed, updating miner address:', newAccount);
        await miningManager.updateMinerAddress();
      }
    });
  });
  
  onDestroy(() => {
    if (miningManager) {
      miningManager.stopMining();
    }
    
    if (statsInterval) {
      clearInterval(statsInterval);
    }
    
    if (accountUnsubscribe) {
      accountUnsubscribe();
    }
  });
  
  async function fetchStats() {
    miningStats = await miningManager.getStats();
  }
  
  function toggleMining() {
    if ($isMining) {
      miningManager.stopMining();
    } else {
      miningManager.startMining();
    }
  }
  
  function formatNumber(num: number): string {
    return num.toLocaleString();
  }
  
  function formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }
</script>

<!-- Network Setup Banner -->
<div class="mb-6 p-4 bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-xl border border-purple-500/30">
  <div class="flex flex-col md:flex-row items-center justify-between gap-4">
    <div>
      <h3 class="text-lg font-semibold text-white mb-1">🌟 Connect to STARS Network</h3>
      <p class="text-sm text-white/70">Add the STARS blockchain to MetaMask to start mining and earning rewards</p>
    </div>
    <AddNetworkButton />
  </div>
</div>

<!-- Faucet Component -->
<div class="mb-6">
  <Faucet />
</div>

<!-- Wallet Component -->
<div class="mb-6">
  <Wallet />
</div>

<div class="mining-panel bg-brand-surface/80 rounded-2xl p-6 backdrop-blur border border-white/10">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-bold gradient-text">STARS Mining</h2>
    <button
      on:click={toggleMining}
      class="px-6 py-3 rounded-lg font-medium transition-all {$isMining 
        ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
        : 'bg-brand-accent/20 text-brand-accent border border-brand-accent/50 hover:bg-brand-accent/30'}"
    >
      {$isMining ? '⛏️ Stop Mining' : '⚡ Start Mining'}
    </button>
  </div>
  
  <!-- Miner Address -->
  <div class="mb-6 p-4 bg-black/30 rounded-lg">
    <div class="text-xs text-white/50 mb-1">Miner Address</div>
    <div class="font-mono text-sm text-brand-accent break-all">{$minerAddress || 'Generating...'}</div>
  </div>
  
  <!-- Mining Stats Grid -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div class="stat-card">
      <div class="text-xs text-white/50 mb-1">Hash Rate</div>
      <div class="text-xl font-bold text-cyan-400">{$hashRateFormatted}</div>
    </div>
    
    <div class="stat-card">
      <div class="text-xs text-white/50 mb-1">Blocks Found</div>
      <div class="text-xl font-bold text-green-400">{$blocksFound}</div>
    </div>
    
    <div class="stat-card">
      <div class="text-xs text-white/50 mb-1">Total Hashes</div>
      <div class="text-xl font-bold text-yellow-400">{formatNumber($totalHashes)}</div>
    </div>
    
    <div class="stat-card">
      <div class="text-xs text-white/50 mb-1">Earnings</div>
      <div class="text-xl font-bold text-purple-400">{$earningsFormatted}</div>
    </div>
  </div>
  
  <!-- Network Stats -->
  {#if miningStats}
    <div class="border-t border-white/10 pt-6">
      <h3 class="text-lg font-semibold mb-4">Network Statistics</h3>
      
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div class="stat-card">
          <div class="text-xs text-white/50 mb-1">Block Height</div>
          <div class="text-lg font-bold">#{miningStats.currentHeight}</div>
        </div>
        
        <div class="stat-card">
          <div class="text-xs text-white/50 mb-1">Difficulty</div>
          <div class="text-lg font-bold">{miningStats.currentDifficulty}</div>
        </div>
        
        <div class="stat-card">
          <div class="text-xs text-white/50 mb-1">Active Miners</div>
          <div class="text-lg font-bold">{miningStats.activeMiners}</div>
        </div>
        
        <div class="stat-card">
          <div class="text-xs text-white/50 mb-1">Total Supply</div>
          <div class="text-lg font-bold">{formatStars(miningStats.totalSupply)}</div>
        </div>
        
        <div class="stat-card">
          <div class="text-xs text-white/50 mb-1">Block Reward</div>
          <div class="text-lg font-bold">{formatStars(miningStats.miningReward)}</div>
        </div>
        
        <div class="stat-card">
          <div class="text-xs text-white/50 mb-1">Next Adjustment</div>
          <div class="text-lg font-bold">Block #{miningStats.nextDifficultyAdjust}</div>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Mining Status -->
  {#if $isMining}
    <div class="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        <span class="text-green-400 font-medium">Mining in progress...</span>
      </div>
      <div class="text-xs text-white/50 mt-1">
        Your browser is working to find the next block. Keep this tab open to continue mining.
      </div>
    </div>
  {:else}
    <div class="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
      <div class="text-sm text-white/70">
        Click "Start Mining" to begin earning STARS cryptocurrency. Your browser will perform 
        proof-of-work calculations to secure the network and earn rewards.
      </div>
    </div>
  {/if}
</div>

<!-- Bot Activity -->
<div class="mt-8">
  <BotActivity />
</div>

<style>
  .stat-card {
    @apply p-3 bg-black/20 rounded-lg border border-white/5;
  }
  
  .gradient-text {
    background: linear-gradient(135deg, #00ffff, #ff00ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
</style>