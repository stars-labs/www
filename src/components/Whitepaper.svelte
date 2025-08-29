<script lang="ts">
  import { navigateTo } from '../lib/router';
</script>

<div class="min-h-screen bg-black text-white pt-20 px-6 md:px-10">
  <div class="max-w-4xl mx-auto py-12">
    <!-- Header -->
    <div class="mb-12 text-center">
      <h1 class="text-4xl md:text-5xl font-bold mb-4 gradient-text">STARS Blockchain</h1>
      <p class="text-xl text-gray-400">A Browser-Based Proof-of-Work Cryptocurrency</p>
      <p class="text-sm text-gray-500 mt-2">Version 1.0 | December 2024</p>
    </div>

    <!-- Abstract -->
    <section class="mb-12 bg-brand-surface/50 rounded-2xl p-8 border border-white/10">
      <h2 class="text-2xl font-bold mb-4 text-cyan-400">Abstract</h2>
      <p class="text-gray-300 leading-relaxed">
        STARS is an innovative browser-based cryptocurrency that democratizes mining by enabling any web user to participate 
        in blockchain validation directly from their browser. By leveraging Web Workers for proof-of-work computation and 
        Cloudflare's edge network for consensus, STARS creates a truly decentralized and accessible blockchain ecosystem.
      </p>
    </section>

    <!-- Introduction -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-4 text-cyan-400">1. Introduction</h2>
      <p class="text-gray-300 leading-relaxed mb-4">
        Traditional cryptocurrencies require specialized hardware or software to participate in mining, creating barriers 
        to entry for average users. STARS removes these barriers by implementing a complete blockchain system that runs 
        entirely in web browsers, making cryptocurrency mining as simple as visiting a website.
      </p>
      <p class="text-gray-300 leading-relaxed">
        The STARS blockchain achieves this through a novel architecture that separates computation (performed in browsers) 
        from verification and storage (handled by edge servers), creating a system that is both accessible and secure.
      </p>
    </section>

    <!-- Technical Architecture -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-4 text-cyan-400">2. Technical Architecture</h2>
      
      <div class="space-y-6">
        <div>
          <h3 class="text-xl font-semibold mb-2 text-purple-400">2.1 Dual-Layer Design</h3>
          <ul class="list-disc list-inside space-y-2 text-gray-300">
            <li><strong>Browser Layer:</strong> Performs proof-of-work mining using Web Workers</li>
            <li><strong>Edge Layer:</strong> Validates blocks and maintains consensus via Cloudflare Workers</li>
          </ul>
        </div>

        <div>
          <h3 class="text-xl font-semibold mb-2 text-purple-400">2.2 Consensus Mechanism</h3>
          <p class="text-gray-300 mb-2">
            STARS uses SHA-256 proof-of-work with dynamic difficulty adjustment:
          </p>
          <div class="bg-black/50 rounded-lg p-4 font-mono text-sm text-green-400">
            Target Block Time: 5 seconds<br/>
            Difficulty Adjustment: Every 10 blocks<br/>
            Hash Algorithm: SHA-256<br/>
            Target Pattern: Leading zeros in hash
          </div>
        </div>

        <div>
          <h3 class="text-xl font-semibold mb-2 text-purple-400">2.3 Block Structure</h3>
          <div class="bg-black/50 rounded-lg p-4 font-mono text-sm text-cyan-400 overflow-x-auto">
            {`{
  "height": number,
  "hash": "0x...",
  "previousHash": "0x...",
  "merkleRoot": "0x...",
  "timestamp": number,
  "difficulty": number,
  "nonce": string,
  "miner": "0x...",
  "reward": "10000000000",
  "transactions": [...]
}`}
          </div>
        </div>
      </div>
    </section>

    <!-- Tokenomics -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-4 text-cyan-400">3. Tokenomics</h2>
      
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-brand-surface/30 rounded-xl p-6 border border-white/10">
          <h3 class="text-lg font-semibold mb-3 text-purple-400">Currency Units</h3>
          <ul class="space-y-2 text-gray-300">
            <li>• 1 STARS = 10^10 starshars</li>
            <li>• Smallest unit: 1 starshar</li>
            <li>• Precision: 10 decimal places</li>
          </ul>
        </div>

        <div class="bg-brand-surface/30 rounded-xl p-6 border border-white/10">
          <h3 class="text-lg font-semibold mb-3 text-purple-400">Mining Rewards</h3>
          <ul class="space-y-2 text-gray-300">
            <li>• Block reward: 1 STARS</li>
            <li>• Transaction fee: 1 starshar minimum</li>
            <li>• No maximum supply (inflationary)</li>
          </ul>
        </div>

        <div class="bg-brand-surface/30 rounded-xl p-6 border border-white/10">
          <h3 class="text-lg font-semibold mb-3 text-purple-400">Initial Distribution</h3>
          <ul class="space-y-2 text-gray-300">
            <li>• Genesis allocation: 1,000,000 STARS</li>
            <li>• Bot wallet for liquidity</li>
            <li>• Fair launch - no pre-mine</li>
          </ul>
        </div>

        <div class="bg-brand-surface/30 rounded-xl p-6 border border-white/10">
          <h3 class="text-lg font-semibold mb-3 text-purple-400">Economic Model</h3>
          <ul class="space-y-2 text-gray-300">
            <li>• Steady inflation via mining</li>
            <li>• Fee burning mechanism (future)</li>
            <li>• Staking rewards (planned)</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Mining Process -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-4 text-cyan-400">4. Mining Process</h2>
      
      <div class="space-y-4">
        <div class="flex items-start gap-4">
          <div class="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold">1</div>
          <div class="flex-1">
            <h4 class="font-semibold mb-1">Request Mining Job</h4>
            <p class="text-gray-400 text-sm">Browser requests a new block template from the edge server</p>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <div class="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold">2</div>
          <div class="flex-1">
            <h4 class="font-semibold mb-1">Compute Proof-of-Work</h4>
            <p class="text-gray-400 text-sm">Web Worker performs SHA-256 hashing to find valid nonce</p>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <div class="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold">3</div>
          <div class="flex-1">
            <h4 class="font-semibold mb-1">Submit Solution</h4>
            <p class="text-gray-400 text-sm">Valid solution sent to edge server for verification</p>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <div class="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold">4</div>
          <div class="flex-1">
            <h4 class="font-semibold mb-1">Block Validation</h4>
            <p class="text-gray-400 text-sm">Edge server validates and adds block to chain</p>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <div class="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold">5</div>
          <div class="flex-1">
            <h4 class="font-semibold mb-1">Reward Distribution</h4>
            <p class="text-gray-400 text-sm">Miner receives 1 STARS reward to their wallet</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Security Considerations -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-4 text-cyan-400">5. Security Model</h2>
      
      <div class="space-y-4">
        <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-2 text-yellow-400">Browser Security</h3>
          <ul class="list-disc list-inside space-y-1 text-gray-300 text-sm">
            <li>Web Workers prevent main thread blocking</li>
            <li>Cryptographic operations use native Web Crypto API</li>
            <li>No access to local file system or sensitive APIs</li>
          </ul>
        </div>

        <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-2 text-blue-400">Network Security</h3>
          <ul class="list-disc list-inside space-y-1 text-gray-300 text-sm">
            <li>All communications over HTTPS</li>
            <li>Edge validation prevents invalid blocks</li>
            <li>Rate limiting on mining job requests</li>
          </ul>
        </div>

        <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-2 text-green-400">Consensus Security</h3>
          <ul class="list-disc list-inside space-y-1 text-gray-300 text-sm">
            <li>SHA-256 proof-of-work prevents spam</li>
            <li>Difficulty adjustment maintains block time</li>
            <li>Merkle trees ensure transaction integrity</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- MetaMask Integration -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-4 text-cyan-400">6. Wallet Integration</h2>
      
      <p class="text-gray-300 mb-4">
        STARS provides full Ethereum JSON-RPC 2.0 compatibility, enabling seamless integration with MetaMask 
        and other Web3 wallets:
      </p>

      <div class="bg-black/50 rounded-lg p-6 space-y-3">
        <div class="flex items-center justify-between py-2 border-b border-white/10">
          <span class="text-gray-400">Network Name:</span>
          <span class="font-mono text-cyan-400">StarsLab Network</span>
        </div>
        <div class="flex items-center justify-between py-2 border-b border-white/10">
          <span class="text-gray-400">RPC URL:</span>
          <span class="font-mono text-cyan-400">https://www.hecoinfo.com/api/rpc</span>
        </div>
        <div class="flex items-center justify-between py-2 border-b border-white/10">
          <span class="text-gray-400">Chain ID:</span>
          <span class="font-mono text-cyan-400">1337</span>
        </div>
        <div class="flex items-center justify-between py-2 border-b border-white/10">
          <span class="text-gray-400">Currency Symbol:</span>
          <span class="font-mono text-cyan-400">STARS</span>
        </div>
        <div class="flex items-center justify-between py-2">
          <span class="text-gray-400">Block Explorer:</span>
          <span class="font-mono text-cyan-400">https://www.hecoinfo.com/explorer</span>
        </div>
      </div>
    </section>

    <!-- Roadmap -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-4 text-cyan-400">7. Development Roadmap</h2>
      
      <div class="space-y-4">
        <div class="border-l-4 border-green-500 pl-4">
          <h3 class="font-semibold text-green-400">Phase 1: Foundation (Complete)</h3>
          <ul class="text-sm text-gray-400 mt-1">
            <li>✓ Browser-based mining implementation</li>
            <li>✓ Edge server validation</li>
            <li>✓ MetaMask integration</li>
            <li>✓ Block explorer</li>
          </ul>
        </div>

        <div class="border-l-4 border-yellow-500 pl-4">
          <h3 class="font-semibold text-yellow-400">Phase 2: Enhancement (Current)</h3>
          <ul class="text-sm text-gray-400 mt-1">
            <li>• Smart contract support</li>
            <li>• Mobile mining optimization</li>
            <li>• Mining pool implementation</li>
            <li>• Advanced block explorer features</li>
          </ul>
        </div>

        <div class="border-l-4 border-purple-500 pl-4">
          <h3 class="font-semibold text-purple-400">Phase 3: Ecosystem (Future)</h3>
          <ul class="text-sm text-gray-400 mt-1">
            <li>• DEX integration</li>
            <li>• Staking mechanism</li>
            <li>• Governance tokens</li>
            <li>• Cross-chain bridges</li>
          </ul>
        </div>

        <div class="border-l-4 border-cyan-500 pl-4">
          <h3 class="font-semibold text-cyan-400">Phase 4: Scale (2025)</h3>
          <ul class="text-sm text-gray-400 mt-1">
            <li>• Layer 2 solutions</li>
            <li>• Enterprise partnerships</li>
            <li>• Mobile wallet app</li>
            <li>• Global edge node network</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Conclusion -->
    <section class="mb-12 bg-brand-surface/50 rounded-2xl p-8 border border-white/10">
      <h2 class="text-2xl font-bold mb-4 text-cyan-400">8. Conclusion</h2>
      <p class="text-gray-300 leading-relaxed mb-4">
        STARS represents a paradigm shift in cryptocurrency accessibility. By leveraging ubiquitous web browsers 
        for mining and edge computing for consensus, we've created a blockchain that anyone can participate in 
        without specialized knowledge or hardware.
      </p>
      <p class="text-gray-300 leading-relaxed">
        This democratization of blockchain technology opens new possibilities for decentralized applications, 
        financial inclusion, and community-driven innovation. As we continue to develop and expand the STARS 
        ecosystem, we invite developers, miners, and users worldwide to join us in building the future of 
        accessible cryptocurrency.
      </p>
    </section>

    <!-- Call to Action -->
    <div class="text-center">
      <button
        on:click={() => navigateTo('mining')}
        class="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-semibold hover:brightness-110 transition"
      >
        Start Mining STARS Now
      </button>
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