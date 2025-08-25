<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../services/api';
  import type { Block, Transaction, ChainFork } from '../services/api';

  let activeTab: 'blocks' | 'transactions' | 'forks' = 'blocks';
  let searchQuery = '';
  let searchType: 'block' | 'tx' = 'block';
  let isLoading = false;
  let error = '';

  // Data
  let blocks: Block[] = [];
  let transactions: Transaction[] = [];
  let chainForks: ChainFork[] = [];
  let selectedBlock: Block | null = null;
  let selectedTx: Transaction | null = null;
  let stats = {
    totalBlocks: 0,
    totalTransactions: 0,
    pendingTxs: 0,
    chains: [] as Array<{ chainId: string; blockCount: number; maxHeight: number }>
  };

  let refreshInterval: NodeJS.Timeout;

  async function loadData() {
    isLoading = true;
    error = '';

    try {
      const [blockData, forkData, statsData, txStats] = await Promise.all([
        api.getBlocks(20, 0),
        api.getChainForks(),
        api.getChainStats(),
        api.getTransactionStats()
      ]);

      blocks = blockData.blocks;
      // Use recent transactions from stats which includes pending ones
      transactions = txStats.recentTransactions || [];
      chainForks = forkData;
      stats = {
        totalBlocks: statsData.totalBlocks,
        totalTransactions: txStats.totalTransactions,
        pendingTxs: txStats.pendingCount,
        chains: statsData.chains
      };
    } catch (err) {
      error = 'Failed to load blockchain data';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;

    isLoading = true;
    error = '';

    try {
      if (searchType === 'block') {
        const block = await api.getBlock(searchQuery);
        selectedBlock = block;
        activeTab = 'blocks';
      } else {
        const tx = await api.getTransaction(searchQuery);
        selectedTx = tx;
        activeTab = 'transactions';
      }
    } catch (err) {
      error = `${searchType === 'block' ? 'Block' : 'Transaction'} not found`;
      selectedBlock = null;
      selectedTx = null;
    } finally {
      isLoading = false;
    }
  }

  async function loadMoreBlocks() {
    try {
      const moreBlocks = await api.getBlocks(20, blocks.length);
      blocks = [...blocks, ...moreBlocks.blocks];
    } catch (err) {
      console.error('Failed to load more blocks', err);
    }
  }

  async function loadMoreTransactions() {
    try {
      // Load from mempool (pending transactions) since that's where they are
      const mempool = await api.getMempool();
      // Get unique transactions not already displayed
      const existingHashes = new Set(transactions.map(tx => tx.hash));
      const newTxs = mempool.mempool.filter(tx => !existingHashes.has(tx.hash));
      transactions = [...transactions, ...newTxs.slice(0, 20)];
    } catch (err) {
      console.error('Failed to load more transactions', err);
    }
  }

  function formatHash(hash: string): string {
    if (!hash) return '';
    return hash.length > 16 ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : hash;
  }

  function formatTime(timestamp: Date | string | null): string {
    if (!timestamp) return 'Pending';
    
    const date = new Date(timestamp);
    // Check for invalid date (e.g., null parsed as date)
    if (isNaN(date.getTime())) return 'Pending';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 0) return 'Future'; // Handle future dates
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }

  onMount(() => {
    loadData();
    // Refresh data every 10 seconds
    refreshInterval = setInterval(loadData, 10000);
  });

  onDestroy(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });
</script>

<div class="min-h-screen bg-brand-bg text-white pt-20 pb-10">
  <div class="max-w-7xl mx-auto px-6 md:px-10">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold mb-2 gradient-text">Blockchain Explorer</h1>
      <p class="text-gray-400">Explore blocks, transactions, and network activity</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4">
        <div class="text-sm text-gray-400 mb-1">Total Blocks</div>
        <div class="text-2xl font-bold text-cyan-400">{stats.totalBlocks.toLocaleString()}</div>
      </div>
      <div class="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4">
        <div class="text-sm text-gray-400 mb-1">Transactions</div>
        <div class="text-2xl font-bold text-cyan-400">{stats.totalTransactions.toLocaleString()}</div>
      </div>
      <div class="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4">
        <div class="text-sm text-gray-400 mb-1">Pending Txs</div>
        <div class="text-2xl font-bold text-yellow-400">{stats.pendingTxs.toLocaleString()}</div>
      </div>
      <div class="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4">
        <div class="text-sm text-gray-400 mb-1">Active Chains</div>
        <div class="text-2xl font-bold text-cyan-400">{stats.chains.length}</div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 mb-8">
      <div class="flex flex-col md:flex-row gap-4">
        <select 
          bind:value={searchType}
          class="px-4 py-2 bg-gray-800 border border-cyan-500/30 rounded-lg focus:outline-none focus:border-cyan-400"
        >
          <option value="block">Block Hash</option>
          <option value="tx">Transaction Hash</option>
        </select>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Enter hash to search..."
          class="flex-1 px-4 py-2 bg-gray-800 border border-cyan-500/30 rounded-lg focus:outline-none focus:border-cyan-400"
          on:keypress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          on:click={handleSearch}
          disabled={isLoading}
          class="px-6 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
      {#if error}
        <div class="mt-3 text-red-400 text-sm">{error}</div>
      {/if}
    </div>

    <!-- Tabs -->
    <div class="flex gap-4 mb-6 border-b border-gray-700">
      <button
        on:click={() => activeTab = 'blocks'}
        class="pb-3 px-2 font-semibold transition {activeTab === 'blocks' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}"
      >
        Blocks
      </button>
      <button
        on:click={() => activeTab = 'transactions'}
        class="pb-3 px-2 font-semibold transition {activeTab === 'transactions' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}"
      >
        Transactions
      </button>
      <button
        on:click={() => activeTab = 'forks'}
        class="pb-3 px-2 font-semibold transition {activeTab === 'forks' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}"
      >
        Chain Forks
      </button>
    </div>

    <!-- Content -->
    <div class="bg-gray-900/30 backdrop-blur-sm border border-cyan-500/20 rounded-lg overflow-hidden">
      {#if isLoading && !blocks.length}
        <div class="p-8 text-center text-gray-400">Loading blockchain data...</div>
      {:else if activeTab === 'blocks'}
        <!-- Blocks Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-800/50 border-b border-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">Height</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">Hash</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">Chain</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">Txs</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">Miner</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">Time</th>
              </tr>
            </thead>
            <tbody>
              {#if selectedBlock}
                <tr class="bg-cyan-500/10 border-b border-cyan-500/30">
                  <td class="px-4 py-3 font-mono text-cyan-400">#{selectedBlock.height}</td>
                  <td class="px-4 py-3 font-mono text-cyan-400">{formatHash(selectedBlock.hash)}</td>
                  <td class="px-4 py-3 text-sm">{selectedBlock.chainId}</td>
                  <td class="px-4 py-3">{selectedBlock.transactionCount || 0}</td>
                  <td class="px-4 py-3 font-mono text-xs">{formatHash(selectedBlock.minerAddress || '')}</td>
                  <td class="px-4 py-3 text-sm text-gray-400">{formatTime(selectedBlock.timestamp)}</td>
                </tr>
              {/if}
              {#each blocks as block}
                <tr class="border-b border-gray-800 hover:bg-gray-800/30 transition cursor-pointer"
                    on:click={() => selectedBlock = block}>
                  <td class="px-4 py-3 font-mono text-cyan-400">#{block.height}</td>
                  <td class="px-4 py-3 font-mono text-cyan-400">{formatHash(block.hash)}</td>
                  <td class="px-4 py-3 text-sm">{block.chainId}</td>
                  <td class="px-4 py-3">{block.transactionCount || 0}</td>
                  <td class="px-4 py-3 font-mono text-xs">{formatHash(block.minerAddress || '')}</td>
                  <td class="px-4 py-3 text-sm text-gray-400" title={block.timestamp ? new Date(block.timestamp).toLocaleString() : 'No timestamp'}>{formatTime(block.timestamp)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <div class="p-4 text-center">
          <button
            on:click={loadMoreBlocks}
            class="px-4 py-2 text-cyan-400 hover:text-cyan-300 transition"
          >
            Load More Blocks
          </button>
        </div>
      {:else if activeTab === 'transactions'}
        <!-- Transactions Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-800/50 border-b border-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">Hash</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">From</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">To</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">Value</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">Time</th>
              </tr>
            </thead>
            <tbody>
              {#if selectedTx}
                <tr class="bg-cyan-500/10 border-b border-cyan-500/30">
                  <td class="px-4 py-3 font-mono text-cyan-400">{formatHash(selectedTx.hash)}</td>
                  <td class="px-4 py-3 font-mono text-xs">{formatHash(selectedTx.fromAddress)}</td>
                  <td class="px-4 py-3 font-mono text-xs">{formatHash(selectedTx.toAddress)}</td>
                  <td class="px-4 py-3">{selectedTx.value.toFixed(2)}</td>
                  <td class="px-4 py-3">
                    <span class="{getStatusColor(selectedTx.status)}">{selectedTx.status}</span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-400" title={selectedTx.createdAt ? new Date(selectedTx.createdAt).toLocaleString() : 'Pending transaction'}>{formatTime(selectedTx.createdAt)}</td>
                </tr>
              {/if}
              {#each transactions as tx}
                <tr class="border-b border-gray-800 hover:bg-gray-800/30 transition cursor-pointer"
                    on:click={() => selectedTx = tx}>
                  <td class="px-4 py-3 font-mono text-cyan-400">{formatHash(tx.hash)}</td>
                  <td class="px-4 py-3 font-mono text-xs">{formatHash(tx.fromAddress)}</td>
                  <td class="px-4 py-3 font-mono text-xs">{formatHash(tx.toAddress)}</td>
                  <td class="px-4 py-3">{tx.value.toFixed(2)}</td>
                  <td class="px-4 py-3">
                    <span class="{getStatusColor(tx.status)}">{tx.status}</span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-400" title={tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'Pending transaction'}>{formatTime(tx.createdAt)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <div class="p-4 text-center">
          <button
            on:click={loadMoreTransactions}
            class="px-4 py-2 text-cyan-400 hover:text-cyan-300 transition"
          >
            Load More Transactions
          </button>
        </div>
      {:else if activeTab === 'forks'}
        <!-- Chain Forks -->
        <div class="p-6">
          <div class="grid gap-4">
            {#each chainForks as fork}
              <div class="bg-gray-800/30 border border-cyan-500/20 rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <div class="font-semibold text-cyan-400">Fork ID: {fork.forkId}</div>
                    <div class="text-sm text-gray-400">Parent Chain: {fork.parentChainId}</div>
                  </div>
                  <div class="text-right">
                    {#if fork.isMainChain}
                      <span class="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Main Chain</span>
                    {:else}
                      <span class="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">Side Chain</span>
                    {/if}
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-4 mt-3 text-sm">
                  <div>
                    <span class="text-gray-500">Fork Height:</span>
                    <span class="ml-2">#{fork.forkHeight}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Total Blocks:</span>
                    <span class="ml-2">{fork.totalBlocks}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Created:</span>
                    <span class="ml-2">{formatTime(fork.createdAt)}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>