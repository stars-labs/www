<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    submit: { from: string; to: string; amount: number };
  }>();

  let fromAddress = '';
  let toAddress = '';
  let amount = '';
  let expanded = false;
  let submitted = false;
  let submittedTx = { from: '', to: '', amount: 0 };

  function randomHex(len: number): string {
    return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  function prefill() {
    fromAddress = '0x' + randomHex(8);
    toAddress = '0x' + randomHex(8);
    amount = (Math.random() * 500 + 10).toFixed(2);
  }

  function handleSubmit() {
    const parsedAmount = parseFloat(amount);
    const tx = {
      from: fromAddress || '0x' + randomHex(8),
      to: toAddress || '0x' + randomHex(8),
      amount: (parsedAmount > 0 && parsedAmount <= 1000000) ? parsedAmount : Math.random() * 500 + 10,
    };
    dispatch('submit', tx);

    submittedTx = tx;
    submitted = true;

    // Reset after showing confirmation
    setTimeout(() => {
      submitted = false;
      fromAddress = '';
      toAddress = '';
      amount = '';
    }, 3000);
  }
</script>

{#if expanded}
  <div class="fixed bottom-20 left-4 bg-gray-900/90 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 w-80 font-mono text-sm z-50">
    <div class="flex items-center justify-between mb-3">
      <span class="text-cyan-400 font-semibold text-xs uppercase tracking-wider">Create Transaction</span>
      <button on:click={() => expanded = false} class="text-white/40 hover:text-white text-lg leading-none">&times;</button>
    </div>

    {#if submitted}
      <div class="text-center py-4">
        <div class="text-green-400 font-semibold mb-1">Transaction Submitted!</div>
        <div class="text-white/40 text-xs">
          {submittedTx.amount.toFixed(2)} tokens
        </div>
        <div class="text-white/30 text-xs mt-1">
          {submittedTx.from} &rarr; {submittedTx.to}
        </div>
        <div class="text-yellow-400 text-xs mt-2 animate-pulse">Pending confirmation...</div>
      </div>
    {:else}
      <div class="space-y-2">
        <div>
          <label for="tx-from" class="text-white/40 text-xs block mb-1">From Address</label>
          <input
            id="tx-from"
            bind:value={fromAddress}
            placeholder="0x..."
            class="w-full bg-black/40 border border-cyan-500/20 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
          />
        </div>
        <div>
          <label for="tx-to" class="text-white/40 text-xs block mb-1">To Address</label>
          <input
            id="tx-to"
            bind:value={toAddress}
            placeholder="0x..."
            class="w-full bg-black/40 border border-cyan-500/20 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
          />
        </div>
        <div>
          <label for="tx-amount" class="text-white/40 text-xs block mb-1">Amount</label>
          <input
            id="tx-amount"
            bind:value={amount}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="100.00"
            class="w-full bg-black/40 border border-cyan-500/20 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
          />
        </div>
        <div class="flex gap-2 pt-1">
          <button
            on:click={prefill}
            class="flex-1 px-3 py-1.5 text-xs border border-white/10 rounded text-white/60 hover:text-white hover:border-white/30 transition"
          >
            Random
          </button>
          <button
            on:click={handleSubmit}
            class="flex-1 px-3 py-1.5 text-xs bg-cyan-500 text-black font-semibold rounded hover:bg-cyan-400 transition"
          >
            Send
          </button>
        </div>
      </div>
    {/if}
  </div>
{/if}

<!-- Toggle button -->
<button
  on:click={() => expanded = !expanded}
  class="fixed bottom-4 left-4 bg-gray-900/80 backdrop-blur-md border border-cyan-500/30 rounded-lg px-3 py-2 text-cyan-400 font-mono text-xs z-50 hover:border-cyan-400/60 hover:bg-gray-800/80 transition flex items-center gap-2"
>
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
  </svg>
  New Tx
</button>
