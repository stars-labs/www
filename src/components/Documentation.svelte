<script lang="ts">
  import { navigateTo } from '../lib/router';
  
  let activeSection = 'getting-started';
  
  function setActiveSection(section: string) {
    activeSection = section;
  }
</script>

<div class="min-h-screen bg-black text-white pt-20 px-6 md:px-10">
  <div class="max-w-7xl mx-auto py-12">
    <div class="grid md:grid-cols-4 gap-8">
      <!-- Sidebar Navigation -->
      <aside class="md:col-span-1">
        <div class="sticky top-24 bg-brand-surface/50 rounded-xl p-6 border border-white/10">
          <h3 class="font-bold mb-4 text-cyan-400">Documentation</h3>
          
          <nav class="space-y-2">
            <button
              on:click={() => setActiveSection('getting-started')}
              class="w-full text-left px-3 py-2 rounded-lg transition {activeSection === 'getting-started' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
            >
              Getting Started
            </button>
            
            <button
              on:click={() => setActiveSection('mining-guide')}
              class="w-full text-left px-3 py-2 rounded-lg transition {activeSection === 'mining-guide' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
            >
              Mining Guide
            </button>
            
            <button
              on:click={() => setActiveSection('wallet-setup')}
              class="w-full text-left px-3 py-2 rounded-lg transition {activeSection === 'wallet-setup' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
            >
              Wallet Setup
            </button>
            
            <button
              on:click={() => setActiveSection('api-reference')}
              class="w-full text-left px-3 py-2 rounded-lg transition {activeSection === 'api-reference' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
            >
              API Reference
            </button>
            
            <button
              on:click={() => setActiveSection('troubleshooting')}
              class="w-full text-left px-3 py-2 rounded-lg transition {activeSection === 'troubleshooting' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
            >
              Troubleshooting
            </button>
            
            <button
              on:click={() => setActiveSection('faq')}
              class="w-full text-left px-3 py-2 rounded-lg transition {activeSection === 'faq' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
            >
              FAQ
            </button>
          </nav>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="md:col-span-3">
        {#if activeSection === 'getting-started'}
          <section class="bg-brand-surface/30 rounded-2xl p-8 border border-white/10">
            <h1 class="text-3xl font-bold mb-6 gradient-text">Getting Started with STARS</h1>
            
            <div class="space-y-8">
              <div>
                <h2 class="text-xl font-semibold mb-3 text-cyan-400">What is STARS?</h2>
                <p class="text-gray-300 leading-relaxed">
                  STARS is a revolutionary browser-based cryptocurrency that allows anyone to mine digital currency 
                  directly from their web browser. No downloads, no special hardware - just open your browser and 
                  start earning STARS tokens.
                </p>
              </div>

              <div>
                <h2 class="text-xl font-semibold mb-3 text-cyan-400">Quick Start Guide</h2>
                <ol class="list-decimal list-inside space-y-3 text-gray-300">
                  <li>
                    <strong>Install MetaMask:</strong> Download the MetaMask browser extension from 
                    <a href="https://metamask.io" target="_blank" class="text-cyan-400 hover:underline">metamask.io</a>
                  </li>
                  <li>
                    <strong>Connect to STARS Network:</strong> Add the STARS network to MetaMask using our network details
                  </li>
                  <li>
                    <strong>Visit Mining Page:</strong> Navigate to the 
                    <button on:click={() => navigateTo('mining')} class="text-cyan-400 hover:underline">Mining page</button>
                  </li>
                  <li>
                    <strong>Start Mining:</strong> Click "Start Mining" to begin earning STARS tokens
                  </li>
                  <li>
                    <strong>Monitor Progress:</strong> Watch your hash rate and earnings in real-time
                  </li>
                </ol>
              </div>

              <div>
                <h2 class="text-xl font-semibold mb-3 text-cyan-400">System Requirements</h2>
                <ul class="list-disc list-inside space-y-2 text-gray-300">
                  <li>Modern web browser (Chrome, Firefox, Edge, Safari)</li>
                  <li>JavaScript enabled</li>
                  <li>Stable internet connection</li>
                  <li>MetaMask wallet (for transactions)</li>
                </ul>
              </div>
            </div>
          </section>
        {/if}

        {#if activeSection === 'mining-guide'}
          <section class="bg-brand-surface/30 rounded-2xl p-8 border border-white/10">
            <h1 class="text-3xl font-bold mb-6 gradient-text">Mining Guide</h1>
            
            <div class="space-y-8">
              <div>
                <h2 class="text-xl font-semibold mb-3 text-cyan-400">How Mining Works</h2>
                <p class="text-gray-300 leading-relaxed mb-4">
                  STARS mining uses your browser's computational power to solve complex mathematical puzzles. 
                  When you successfully solve a puzzle, you're rewarded with 1 STARS token.
                </p>
                
                <div class="bg-black/50 rounded-lg p-4 space-y-2">
                  <div class="flex justify-between">
                    <span class="text-gray-400">Mining Algorithm:</span>
                    <span class="font-mono text-cyan-400">SHA-256</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Block Time:</span>
                    <span class="font-mono text-cyan-400">~5 seconds</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Block Reward:</span>
                    <span class="font-mono text-cyan-400">1 STARS</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Difficulty Adjustment:</span>
                    <span class="font-mono text-cyan-400">Every 10 blocks</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 class="text-xl font-semibold mb-3 text-cyan-400">Optimizing Your Mining</h2>
                <ul class="list-disc list-inside space-y-2 text-gray-300">
                  <li><strong>Keep the tab active:</strong> Mining pauses when the tab is in the background</li>
                  <li><strong>Use a powerful device:</strong> Faster processors = higher hash rate</li>
                  <li><strong>Close unnecessary programs:</strong> Free up CPU resources for mining</li>
                  <li><strong>Stable connection:</strong> Ensure uninterrupted connection to submit solutions</li>
                  <li><strong>Enable notifications:</strong> Get alerts when you mine a block</li>
                </ul>
              </div>

              <div>
                <h2 class="text-xl font-semibold mb-3 text-cyan-400">Understanding Hash Rate</h2>
                <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p class="text-gray-300 mb-3">
                    Hash rate measures how many hash calculations your browser performs per second:
                  </p>
                  <ul class="space-y-1 text-sm text-gray-400">
                    <li>• <strong>H/s:</strong> Hashes per second</li>
                    <li>• <strong>KH/s:</strong> Thousand hashes per second</li>
                    <li>• <strong>MH/s:</strong> Million hashes per second</li>
                  </ul>
                  <p class="text-gray-300 mt-3">
                    Higher hash rate = better chance of mining blocks
                  </p>
                </div>
              </div>
            </div>
          </section>
        {/if}

        {#if activeSection === 'wallet-setup'}
          <section class="bg-brand-surface/30 rounded-2xl p-8 border border-white/10">
            <h1 class="text-3xl font-bold mb-6 gradient-text">Wallet Setup</h1>
            
            <div class="space-y-8">
              <div>
                <h2 class="text-xl font-semibold mb-3 text-cyan-400">Installing MetaMask</h2>
                <ol class="list-decimal list-inside space-y-3 text-gray-300">
                  <li>Visit <a href="https://metamask.io" target="_blank" class="text-cyan-400 hover:underline">metamask.io</a></li>
                  <li>Click "Download" and select your browser</li>
                  <li>Add the extension to your browser</li>
                  <li>Create a new wallet or import existing one</li>
                  <li>Secure your seed phrase (NEVER share it!)</li>
                </ol>
              </div>

              <div>
                <h2 class="text-xl font-semibold mb-3 text-cyan-400">Adding STARS Network</h2>
                <p class="text-gray-300 mb-4">
                  Configure MetaMask to connect to the STARS blockchain:
                </p>
                
                <div class="bg-black/50 rounded-lg p-6 space-y-4">
                  <div>
                    <label class="text-gray-400 text-sm">Network Name</label>
                    <div class="font-mono text-cyan-400 mt-1">StarsLab Network</div>
                  </div>
                  
                  <div>
                    <label class="text-gray-400 text-sm">New RPC URL</label>
                    <div class="font-mono text-cyan-400 mt-1 break-all">https://www.hecoinfo.com/api/rpc</div>
                  </div>
                  
                  <div>
                    <label class="text-gray-400 text-sm">Chain ID</label>
                    <div class="font-mono text-cyan-400 mt-1">1337</div>
                  </div>
                  
                  <div>
                    <label class="text-gray-400 text-sm">Currency Symbol</label>
                    <div class="font-mono text-cyan-400 mt-1">STARS</div>
                  </div>
                  
                  <div>
                    <label class="text-gray-400 text-sm">Block Explorer URL</label>
                    <div class="font-mono text-cyan-400 mt-1 break-all">https://www.hecoinfo.com/explorer</div>
                  </div>
                </div>
                
                <div class="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p class="text-green-400 text-sm">
                    💡 Tip: You can automatically add the network by clicking "Connect Wallet" on the Mining page
                  </p>
                </div>
              </div>

              <div>
                <h2 class="text-xl font-semibold mb-3 text-cyan-400">Managing Your STARS</h2>
                <ul class="list-disc list-inside space-y-2 text-gray-300">
                  <li><strong>View Balance:</strong> Your STARS balance appears in MetaMask</li>
                  <li><strong>Send STARS:</strong> Use MetaMask's send function</li>
                  <li><strong>Receive STARS:</strong> Share your wallet address</li>
                  <li><strong>Transaction History:</strong> View in MetaMask or our Explorer</li>
                </ul>
              </div>
            </div>
          </section>
        {/if}

        {#if activeSection === 'api-reference'}
          <section class="bg-brand-surface/30 rounded-2xl p-8 border border-white/10">
            <h1 class="text-3xl font-bold mb-6 gradient-text">API Reference</h1>
            
            <div class="space-y-8">
              <div>
                <h2 class="text-xl font-semibold mb-3 text-cyan-400">Base URL</h2>
                <div class="bg-black/50 rounded-lg p-4 font-mono text-sm text-green-400">
                  https://www.hecoinfo.com/api
                </div>
              </div>

              <div>
                <h2 class="text-xl font-semibold mb-3 text-cyan-400">Endpoints</h2>
                
                <div class="space-y-4">
                  <div class="border border-white/10 rounded-lg p-4">
                    <div class="flex items-start justify-between mb-2">
                      <span class="font-mono text-green-400">GET /blockchain/blocks</span>
                      <span class="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Public</span>
                    </div>
                    <p class="text-gray-400 text-sm">Returns list of recent blocks</p>
                  </div>
                  
                  <div class="border border-white/10 rounded-lg p-4">
                    <div class="flex items-start justify-between mb-2">
                      <span class="font-mono text-green-400">POST /mining/job</span>
                      <span class="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Authenticated</span>
                    </div>
                    <p class="text-gray-400 text-sm">Request a new mining job</p>
                    <div class="mt-2 bg-black/50 rounded p-2 font-mono text-xs">
                      {`{ "minerAddress": "0x..." }`}
                    </div>
                  </div>
                  
                  <div class="border border-white/10 rounded-lg p-4">
                    <div class="flex items-start justify-between mb-2">
                      <span class="font-mono text-green-400">POST /mining/submit</span>
                      <span class="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Authenticated</span>
                    </div>
                    <p class="text-gray-400 text-sm">Submit mining solution</p>
                    <div class="mt-2 bg-black/50 rounded p-2 font-mono text-xs">
                      {`{ "jobId": "...", "nonce": "...", "minerAddress": "0x..." }`}
                    </div>
                  </div>
                  
                  <div class="border border-white/10 rounded-lg p-4">
                    <div class="flex items-start justify-between mb-2">
                      <span class="font-mono text-green-400">GET /transactions</span>
                      <span class="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Public</span>
                    </div>
                    <p class="text-gray-400 text-sm">Get transaction list</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 class="text-xl font-semibold mb-3 text-cyan-400">JSON-RPC Methods</h2>
                <p class="text-gray-300 mb-4">
                  Ethereum-compatible JSON-RPC endpoint: <span class="font-mono text-cyan-400">/rpc</span>
                </p>
                
                <div class="bg-black/50 rounded-lg p-4 font-mono text-xs text-gray-400 overflow-x-auto">
                  eth_blockNumber<br/>
                  eth_getBalance<br/>
                  eth_getTransactionCount<br/>
                  eth_sendTransaction<br/>
                  eth_getBlockByNumber<br/>
                  eth_getTransactionByHash<br/>
                  eth_getTransactionReceipt<br/>
                  net_version<br/>
                  web3_clientVersion
                </div>
              </div>
            </div>
          </section>
        {/if}

        {#if activeSection === 'troubleshooting'}
          <section class="bg-brand-surface/30 rounded-2xl p-8 border border-white/10">
            <h1 class="text-3xl font-bold mb-6 gradient-text">Troubleshooting</h1>
            
            <div class="space-y-6">
              <div class="border border-red-500/30 rounded-lg p-4">
                <h3 class="font-semibold text-red-400 mb-2">Mining not starting</h3>
                <ul class="text-sm text-gray-300 space-y-1">
                  <li>• Ensure JavaScript is enabled in your browser</li>
                  <li>• Check that Web Workers are supported</li>
                  <li>• Try refreshing the page</li>
                  <li>• Clear browser cache and cookies</li>
                </ul>
              </div>
              
              <div class="border border-red-500/30 rounded-lg p-4">
                <h3 class="font-semibold text-red-400 mb-2">MetaMask connection issues</h3>
                <ul class="text-sm text-gray-300 space-y-1">
                  <li>• Make sure MetaMask is unlocked</li>
                  <li>• Check you're on the correct network</li>
                  <li>• Try disconnecting and reconnecting</li>
                  <li>• Verify the RPC URL is correct</li>
                </ul>
              </div>
              
              <div class="border border-red-500/30 rounded-lg p-4">
                <h3 class="font-semibold text-red-400 mb-2">Low hash rate</h3>
                <ul class="text-sm text-gray-300 space-y-1">
                  <li>• Close unnecessary browser tabs</li>
                  <li>• Disable browser extensions temporarily</li>
                  <li>• Use a more powerful device</li>
                  <li>• Ensure adequate cooling for your device</li>
                </ul>
              </div>
              
              <div class="border border-red-500/30 rounded-lg p-4">
                <h3 class="font-semibold text-red-400 mb-2">Transactions not confirming</h3>
                <ul class="text-sm text-gray-300 space-y-1">
                  <li>• Check if you have sufficient balance</li>
                  <li>• Verify the recipient address</li>
                  <li>• Ensure you're paying the minimum fee (1 starshar)</li>
                  <li>• Wait for next block (~5 seconds)</li>
                </ul>
              </div>
            </div>
          </section>
        {/if}

        {#if activeSection === 'faq'}
          <section class="bg-brand-surface/30 rounded-2xl p-8 border border-white/10">
            <h1 class="text-3xl font-bold mb-6 gradient-text">Frequently Asked Questions</h1>
            
            <div class="space-y-6">
              <div>
                <h3 class="font-semibold text-cyan-400 mb-2">Is STARS mining free?</h3>
                <p class="text-gray-300">
                  Yes! STARS mining is completely free. You only need a web browser and internet connection. 
                  There are no fees to start mining.
                </p>
              </div>
              
              <div>
                <h3 class="font-semibold text-cyan-400 mb-2">How much can I earn?</h3>
                <p class="text-gray-300">
                  Earnings depend on your hash rate and luck. Each block mined rewards 1 STARS. 
                  With average hardware, you might mine several blocks per day.
                </p>
              </div>
              
              <div>
                <h3 class="font-semibold text-cyan-400 mb-2">Can I mine on mobile?</h3>
                <p class="text-gray-300">
                  Yes, but desktop browsers typically provide better performance. Mobile mining works 
                  but may have lower hash rates and drain battery faster.
                </p>
              </div>
              
              <div>
                <h3 class="font-semibold text-cyan-400 mb-2">Is STARS a real cryptocurrency?</h3>
                <p class="text-gray-300">
                  STARS is a fully functional blockchain with real proof-of-work mining, transactions, 
                  and wallet support. However, it's currently experimental and has no fiat value.
                </p>
              </div>
              
              <div>
                <h3 class="font-semibold text-cyan-400 mb-2">What makes STARS different?</h3>
                <p class="text-gray-300">
                  STARS is unique in being completely browser-based. No downloads, no special hardware, 
                  no technical knowledge required. It's cryptocurrency for everyone.
                </p>
              </div>
              
              <div>
                <h3 class="font-semibold text-cyan-400 mb-2">Can I run multiple miners?</h3>
                <p class="text-gray-300">
                  Yes, you can run miners in multiple browser tabs or on different devices. 
                  Each miner works independently and earnings go to the wallet address you specify.
                </p>
              </div>
              
              <div>
                <h3 class="font-semibold text-cyan-400 mb-2">How do I convert STARS to other cryptocurrencies?</h3>
                <p class="text-gray-300">
                  Currently, STARS is not listed on exchanges. Future plans include DEX integration 
                  and cross-chain bridges to enable swapping with other cryptocurrencies.
                </p>
              </div>
              
              <div>
                <h3 class="font-semibold text-cyan-400 mb-2">Is the source code available?</h3>
                <p class="text-gray-300">
                  Yes! STARS is open source. You can view the code, contribute, or fork the project 
                  on our GitHub repository.
                </p>
              </div>
            </div>
          </section>
        {/if}
      </main>
    </div>
  </div>
</div>

<style>
  .gradient-text {
    background: linear-gradient(135deg, #00ffff, #ff00ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
</style>