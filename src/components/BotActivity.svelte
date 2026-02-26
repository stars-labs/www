<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../services/api';
  
  let botStatus: any = null;
  let isActive = false;
  let lastTransaction: any = null;
  let interval: any = null;
  
  onMount(async () => {
    // Check bot status
    await loadBotStatus();
    
    // Start auto-sending transactions
    startBot();
  });
  
  onDestroy(() => {
    stopBot();
  });
  
  async function loadBotStatus() {
    try {
      botStatus = await api.request('/bot/status');
    } catch (error) {
      console.error('Failed to load bot status:', error);
    }
  }
  
  async function sendRandomTransaction() {
    try {
      const result = await api.request('/bot/send-random', {
        method: 'POST'
      });
      
      if (result.success) {
        lastTransaction = result.transaction;
        await loadBotStatus();
      }
    } catch (error) {
      console.error('Bot transaction failed:', error);
    }
  }
  
  function startBot() {
    if (interval) return;
    
    isActive = true;
    
    // Send transactions every 5 seconds
    interval = setInterval(async () => {
      await sendRandomTransaction();
    }, 5000);
    
    // Send first transaction immediately
    sendRandomTransaction();
  }
  
  function stopBot() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    isActive = false;
  }
  
  function toggleBot() {
    if (isActive) {
      stopBot();
    } else {
      startBot();
    }
  }
</script>

<div class="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold flex items-center gap-2">
      <span class="text-2xl">🤖</span>
      Network Bot Activity
    </h3>
    
    <button
      on:click={toggleBot}
      class="px-4 py-2 rounded-lg font-medium transition-all {isActive 
        ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
        : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'}"
    >
      {isActive ? '⏸ Pause Bot' : '▶ Start Bot'}
    </button>
  </div>
  
  {#if botStatus}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <div class="text-center">
        <div class="text-xs text-white/50 mb-1">Bot Balance</div>
        <div class="text-sm font-mono">
          {botStatus.balance ? (BigInt(botStatus.balance) / BigInt(10 ** 10)).toString() : '0'} STARS
        </div>
      </div>
      
      <div class="text-center">
        <div class="text-xs text-white/50 mb-1">Total Sent</div>
        <div class="text-sm font-mono">{botStatus.totalTransactions || 0}</div>
      </div>
      
      <div class="text-center">
        <div class="text-xs text-white/50 mb-1">Pending TX</div>
        <div class="text-sm font-mono">{botStatus.pendingTransactions || 0}</div>
      </div>
      
      <div class="text-center">
        <div class="text-xs text-white/50 mb-1">Status</div>
        <div class="text-sm">
          {#if isActive}
            <span class="text-green-400">🟢 Active</span>
          {:else}
            <span class="text-gray-400">⭕ Paused</span>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  
  {#if lastTransaction}
    <div class="mt-4 p-3 bg-black/30 rounded-lg">
      <div class="text-xs text-white/50 mb-1">Last Transaction</div>
      <div class="space-y-1">
        <div class="text-xs font-mono">
          To: {lastTransaction.to.slice(0, 10)}...{lastTransaction.to.slice(-8)}
        </div>
        <div class="text-xs font-mono">
          Amount: {(BigInt(lastTransaction.value) / BigInt(10 ** 10)).toString()} STARS
        </div>
      </div>
    </div>
  {/if}
  
  <div class="mt-4 text-xs text-white/40">
    Bot sends random transactions every 5 seconds to create network activity
  </div>
</div>