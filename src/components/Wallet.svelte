<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    MetaMaskManager, 
    isConnected, 
    account, 
    balanceFormatted,
    isMetaMaskInstalled 
  } from '../lib/metamask';
  import { api } from '../services/api';
  
  let metamask: MetaMaskManager;
  let showSendModal = false;
  let sendTo = '';
  let sendAmount = '';
  let sending = false;
  let txHistory: any[] = [];
  
  onMount(() => {
    metamask = new MetaMaskManager();
    
    if ($account) {
      loadTransactionHistory();
    }
  });
  
  async function handleConnect() {
    if (metamask) {
      const success = await metamask.connect();
      if (success) {
        loadTransactionHistory();
      }
    }
  }
  
  function handleDisconnect() {
    if (metamask) {
      metamask.disconnect();
      txHistory = [];
    }
  }
  
  async function handleSend() {
    if (!metamask || !sendTo || !sendAmount) return;
    
    sending = true;
    
    try {
      const txHash = await metamask.sendTransaction(sendTo, sendAmount);
      
      if (txHash) {
        alert(`Transaction sent! Hash: ${txHash}`);
        showSendModal = false;
        sendTo = '';
        sendAmount = '';
        
        // Refresh balance and history
        setTimeout(() => {
          metamask.updateBalance($account!);
          loadTransactionHistory();
        }, 2000);
      }
    } finally {
      sending = false;
    }
  }
  
  async function loadTransactionHistory() {
    if (!$account) return;
    
    try {
      const response = await api.request(`/transactions?address=${$account}`);
      txHistory = response.transactions || [];
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    }
  }
  
  function formatAddress(addr: string): string {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }
  
  function formatTimestamp(ts: number): string {
    return new Date(ts).toLocaleString();
  }
</script>

<div class="wallet-panel bg-brand-surface/80 rounded-2xl p-6 backdrop-blur border border-white/10">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-bold gradient-text">STARS Wallet</h2>
    
    {#if !$isMetaMaskInstalled}
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        class="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
      >
        Install MetaMask
      </a>
    {:else if $isConnected}
      <button
        on:click={handleDisconnect}
        class="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-medium border border-red-500/50 hover:bg-red-500/30 transition"
      >
        Disconnect
      </button>
    {:else}
      <button
        on:click={handleConnect}
        class="px-4 py-2 bg-brand-accent/20 text-brand-accent rounded-lg font-medium border border-brand-accent/50 hover:bg-brand-accent/30 transition flex items-center gap-2"
      >
        <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" class="w-5 h-5" />
        Connect Wallet
      </button>
    {/if}
  </div>
  
  {#if $isConnected && $account}
    <!-- Account Info -->
    <div class="mb-6 p-4 bg-black/30 rounded-lg">
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="text-xs text-white/50 mb-1">Connected Account</div>
          <div class="font-mono text-sm text-brand-accent">{formatAddress($account)}</div>
        </div>
        <button
          on:click={() => navigator.clipboard.writeText($account)}
          class="p-2 hover:bg-white/10 rounded-lg transition"
          title="Copy address"
        >
          📋
        </button>
      </div>
      
      <div class="pt-3 border-t border-white/10">
        <div class="text-xs text-white/50 mb-1">Balance</div>
        <div class="text-2xl font-bold text-green-400">{$balanceFormatted}</div>
      </div>
    </div>
    
    <!-- Action Buttons -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <button
        on:click={() => showSendModal = true}
        class="px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg font-medium border border-blue-500/50 hover:bg-blue-500/30 transition"
      >
        📤 Send STARS
      </button>
      
      <button
        on:click={() => metamask.watchAsset()}
        class="px-4 py-3 bg-purple-500/20 text-purple-400 rounded-lg font-medium border border-purple-500/50 hover:bg-purple-500/30 transition"
      >
        ➕ Add to MetaMask
      </button>
    </div>
    
    <!-- Transaction History -->
    {#if txHistory.length > 0}
      <div class="border-t border-white/10 pt-6">
        <h3 class="text-lg font-semibold mb-4">Recent Transactions</h3>
        
        <div class="space-y-2 max-h-64 overflow-y-auto">
          {#each txHistory as tx}
            <div class="p-3 bg-black/20 rounded-lg border border-white/5">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-white/50">
                  {tx.from === $account ? 'Sent' : 'Received'}
                </span>
                <span class="text-xs text-white/50">
                  {formatTimestamp(tx.timestamp)}
                </span>
              </div>
              
              <div class="flex items-center justify-between">
                <div class="font-mono text-xs">
                  {tx.from === $account ? `To: ${formatAddress(tx.to)}` : `From: ${formatAddress(tx.from)}`}
                </div>
                <div class="font-bold {tx.from === $account ? 'text-red-400' : 'text-green-400'}">
                  {tx.from === $account ? '-' : '+'}{(BigInt(tx.value) / BigInt(10 ** 10)).toString()} STARS
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {:else if !$isMetaMaskInstalled}
    <div class="text-center py-8">
      <div class="mb-4">
        <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" class="w-20 h-20 mx-auto opacity-50" />
      </div>
      <p class="text-white/70 mb-4">
        MetaMask is required to interact with the STARS blockchain
      </p>
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
      >
        Download MetaMask
      </a>
    </div>
  {:else}
    <div class="text-center py-8">
      <p class="text-white/70">
        Connect your MetaMask wallet to view your balance and send transactions
      </p>
    </div>
  {/if}
</div>

<!-- Send Modal -->
{#if showSendModal}
  <div class="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center p-6" style="z-index: 200;">
    <div class="bg-brand-surface rounded-2xl p-6 max-w-md w-full border border-white/10">
      <h3 class="text-xl font-bold mb-4">Send STARS</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-white/70 mb-2">Recipient Address</label>
          <input
            type="text"
            bind:value={sendTo}
            placeholder="0x..."
            class="w-full px-4 py-2 bg-black/30 rounded-lg border border-white/20 focus:border-brand-accent focus:outline-none"
          />
        </div>
        
        <div>
          <label class="block text-sm text-white/70 mb-2">Amount (STARS)</label>
          <input
            type="number"
            bind:value={sendAmount}
            placeholder="0.0"
            step="0.0001"
            min="0"
            class="w-full px-4 py-2 bg-black/30 rounded-lg border border-white/20 focus:border-brand-accent focus:outline-none"
          />
        </div>
        
        <div class="text-xs text-white/50">
          Fee: 0.0000000001 STARS (1 starshars)
        </div>
      </div>
      
      <div class="flex gap-4 mt-6">
        <button
          on:click={() => showSendModal = false}
          class="flex-1 px-4 py-2 bg-white/10 rounded-lg font-medium hover:bg-white/20 transition"
          disabled={sending}
        >
          Cancel
        </button>
        
        <button
          on:click={handleSend}
          class="flex-1 px-4 py-2 bg-brand-accent rounded-lg font-medium hover:brightness-110 transition disabled:opacity-50"
          disabled={sending || !sendTo || !sendAmount}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .gradient-text {
    background: linear-gradient(135deg, #00ffff, #ff00ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
</style>