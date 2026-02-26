<script lang="ts">
  import { account, isConnected } from '../lib/metamask';
  import { api } from '../services/api';
  
  let requesting = false;
  let message = '';
  let messageType: 'success' | 'error' | '' = '';
  
  async function requestTestStars() {
    if (!$account) {
      message = 'Please connect your wallet first';
      messageType = 'error';
      return;
    }
    
    requesting = true;
    message = '';
    
    try {
      const response = await api.request('/faucet', {
        method: 'POST',
        body: JSON.stringify({
          address: $account,
          amount: '100000000000000000000' // 100 STARS
        })
      });
      
      if (response.success) {
        message = `Successfully received 100 test STARS! New balance: ${BigInt(response.newBalance) / BigInt(10**18)} STARS`;
        messageType = 'success';
        
        // Refresh MetaMask balance
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(response.error || 'Failed to get test STARS');
      }
    } catch (error) {
      console.error('Faucet error:', error);
      message = error instanceof Error ? error.message : 'Failed to request test STARS';
      messageType = 'error';
    } finally {
      requesting = false;
    }
  }
</script>

<div class="faucet-panel bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-xl p-6 border border-purple-500/30">
  <div class="flex items-center justify-between mb-4">
    <div>
      <h3 class="text-xl font-bold text-white mb-1">🚰 Test STARS Faucet</h3>
      <p class="text-sm text-white/70">Get free test STARS for development and testing</p>
    </div>
    
    <div class="text-right">
      <div class="text-xs text-white/50 mb-1">Per Request</div>
      <div class="text-lg font-bold text-cyan-400">100 STARS</div>
    </div>
  </div>
  
  {#if $isConnected && $account}
    <button
      on:click={requestTestStars}
      disabled={requesting}
      class="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg font-medium hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {requesting ? 'Requesting...' : '💧 Request Test STARS'}
    </button>
  {:else}
    <div class="text-center py-3 text-white/50">
      Connect your wallet to use the faucet
    </div>
  {/if}
  
  {#if message}
    <div class="mt-4 p-3 rounded-lg {messageType === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
      {message}
    </div>
  {/if}
  
  <div class="mt-4 p-3 bg-black/20 rounded-lg">
    <div class="text-xs text-white/50">
      <strong>Note:</strong> This is a testnet faucet. These STARS have no real value and are only for testing purposes on the STARS blockchain testnet.
    </div>
  </div>
</div>

<style>
  .faucet-panel {
    animation: glow 3s ease-in-out infinite alternate;
  }
  
  @keyframes glow {
    from {
      box-shadow: 0 0 10px rgba(147, 51, 234, 0.3);
    }
    to {
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
    }
  }
</style>