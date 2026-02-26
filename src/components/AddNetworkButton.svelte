<script lang="ts">
  import { MetaMaskManager, isMetaMaskInstalled } from '../lib/metamask';
  
  let adding = false;
  let metamask: MetaMaskManager;
  
  $: if (typeof window !== 'undefined') {
    metamask = new MetaMaskManager();
  }
  
  async function handleAddNetwork() {
    if (!$isMetaMaskInstalled) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    
    adding = true;
    
    try {
      const success = await metamask.addNetwork();
      
      if (success) {
        alert('STARS Network has been added to MetaMask! You can now connect your wallet.');
      } else {
        alert('Failed to add network. Please try again.');
      }
    } catch (error) {
      console.error('Error adding network:', error);
      alert('Error adding network. Please check MetaMask and try again.');
    } finally {
      adding = false;
    }
  }
</script>

{#if !$isMetaMaskInstalled}
  <button
    on:click={handleAddNetwork}
    class="add-network-btn px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition flex items-center gap-2 shadow-lg"
  >
    <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" class="w-5 h-5" />
    Install MetaMask
  </button>
{:else}
  <button
    on:click={handleAddNetwork}
    disabled={adding}
    class="add-network-btn px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:brightness-110 transition flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 11V9h4v2H8zm0 2v2h4v-2H8z"/>
      <path d="M10 5a1 1 0 011 1v2a1 1 0 11-2 0V6a1 1 0 011-1z"/>
    </svg>
    {adding ? 'Adding...' : 'Add STARS Network to MetaMask'}
  </button>
{/if}

<style>
  .add-network-btn {
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
  }
  
  .add-network-btn:hover {
    animation: none;
    transform: scale(1.05);
  }
</style>