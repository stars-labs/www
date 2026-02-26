<script lang="ts">
  import { account } from '../lib/metamask';
  import { api } from '../services/api';
  
  let showModal = false;
  let sendTo = '';
  let sendAmount = '';
  let sending = false;
  let message = '';
  let messageType: 'success' | 'error' | '' = '';
  
  async function handleDirectSend() {
    if (!$account) {
      message = 'Please connect your wallet first';
      messageType = 'error';
      return;
    }
    
    if (!sendTo || !sendAmount) {
      message = 'Please enter recipient and amount';
      messageType = 'error';
      return;
    }
    
    sending = true;
    message = '';
    
    try {
      const response = await api.request('/wallet/send', {
        method: 'POST',
        body: JSON.stringify({
          from: $account,
          to: sendTo,
          amount: sendAmount
        })
      });
      
      if (response.success) {
        message = `Transaction sent! Hash: ${response.txHash.slice(0, 10)}...`;
        messageType = 'success';
        
        // Clear form
        sendTo = '';
        sendAmount = '';
        
        // Refresh page after 2 seconds to update balance
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(response.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Direct send error:', error);
      message = error instanceof Error ? error.message : 'Failed to send transaction';
      messageType = 'error';
    } finally {
      sending = false;
    }
  }
</script>

<!-- Direct Send Button (Alternative to MetaMask) -->
<div class="direct-send-panel bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-4 border border-green-500/30">
  <div class="flex items-center justify-between">
    <div>
      <h4 class="text-lg font-semibold text-white mb-1">⚡ Direct Transfer</h4>
      <p class="text-xs text-white/70">Send STARS directly without MetaMask issues</p>
    </div>
    <button
      on:click={() => showModal = true}
      class="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:brightness-110 transition"
      disabled={!$account}
    >
      Send STARS
    </button>
  </div>
</div>

<!-- Direct Send Modal -->
{#if showModal}
  <div class="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center p-6" style="z-index: 200;">
    <div class="bg-brand-surface rounded-2xl p-6 max-w-md w-full border border-white/10">
      <h3 class="text-xl font-bold mb-4">Direct STARS Transfer</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-white/70 mb-2" for="recipient">Recipient Address</label>
          <input
            id="recipient"
            type="text"
            bind:value={sendTo}
            placeholder="0x..."
            class="w-full px-4 py-2 bg-black/30 rounded-lg border border-white/20 focus:border-brand-accent focus:outline-none"
          />
        </div>
        
        <div>
          <label class="block text-sm text-white/70 mb-2" for="amount">Amount (STARS)</label>
          <input
            id="amount"
            type="number"
            bind:value={sendAmount}
            placeholder="0.0"
            step="0.0001"
            min="0"
            class="w-full px-4 py-2 bg-black/30 rounded-lg border border-white/20 focus:border-brand-accent focus:outline-none"
          />
        </div>
        
        <div class="text-xs text-white/50">
          <div>From: {$account ? `${$account.slice(0, 6)}...${$account.slice(-4)}` : 'Not connected'}</div>
          <div>Fee: 0.000000000000021 STARS (21 starshars)</div>
        </div>
      </div>
      
      {#if message}
        <div class="mt-4 p-3 rounded-lg {messageType === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
          {message}
        </div>
      {/if}
      
      <div class="flex gap-4 mt-6">
        <button
          on:click={() => {
            showModal = false;
            message = '';
          }}
          class="flex-1 px-4 py-2 bg-white/10 rounded-lg font-medium hover:bg-white/20 transition"
          disabled={sending}
        >
          Cancel
        </button>
        
        <button
          on:click={handleDirectSend}
          class="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:brightness-110 transition disabled:opacity-50"
          disabled={sending || !sendTo || !sendAmount || !$account}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .brand-surface {
    background: #1a1f2e;
  }
  
  .brand-accent {
    color: #00d4ff;
  }
</style>