<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../services/api';

  let canvas: HTMLCanvasElement;
  let animationId: number;
  let time = 0;
  let apiSyncEnabled = true;

  interface Node {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    type: 'validator' | 'miner' | 'peer' | 'smart-contract' | 'user-transaction';
    active: boolean;
    lastActivity: number;
    connections: number[];
    hash: string;
    consensusState: 'idle' | 'proposing' | 'voting' | 'finalizing';
    createdByUser?: boolean;
  }

  interface Block {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    size: number;
    hash: string;
    timestamp: number;
    transactions: number;
    mined: boolean;
    opacity: number;
    height: number;
    chainId: number;
    prevHash: string;
    dying?: boolean;
  }

  interface Chain {
    id: number;
    blocks: Block[];
    color: string;
    isMain: boolean;
    forkPoint: number;
  }

  interface Transaction {
    fromNode: number;
    toNode: number;
    progress: number;
    value: number;
    id: string;
    color: string;
    particles: {x: number, y: number, vx: number, vy: number}[];
    userCreated?: boolean;
  }

  interface MempoolTx {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    targetBlock: Block | null;
    hash: string;
    userCreated?: boolean;
  }

  class BlockchainNetwork {
    ctx: CanvasRenderingContext2D | null = null;
    width = 0;
    height = 0;
    nodes: Node[] = [];
    chains: Chain[] = [];
    transactions: Transaction[] = [];
    mempool: MempoolTx[] = [];
    chainHeight = 0;
    miningProgress = 0;
    nextBlockTime = Date.now() + 5000; // Initialize with normal mining time
    lastBlockTime = 0; // Track last block mining time
    consensusRounds: {x: number, y: number, radius: number, opacity: number}[] = [];
    userTransactions: Node[] = [];
    
    // Mining speed control
    baseMiningTime = 5000; // Base time: 5 seconds when idle
    currentMiningTime = 5000;
    miningSpeedMultiplier = 1;
    userActivityLevel = 0;
    lastUserActivity = 0;
    clicksInLastPeriod = 0;
    miningBoostEffects: {x: number, y: number, size: number, opacity: number}[] = [];
    
    constructor(canvas: HTMLCanvasElement) {
      this.ctx = canvas.getContext('2d', { alpha: true });
      this.resize();
      this.initNetwork();
      this.initChains();
    }

    resize() {
      if (!canvas) return;
      this.width = canvas.width = window.innerWidth;
      this.height = canvas.height = window.innerHeight;
    }

    initNetwork() {
      // Create network nodes in a distributed pattern
      const nodeCount = 25;
      this.nodes = [];
      
      // Create validator nodes (larger, more important)
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5;
        const radius = Math.min(this.width, this.height) * 0.3;
        this.nodes.push({
          x: this.width / 2 + Math.cos(angle) * radius,
          y: this.height / 2 + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
          radius: 12,
          type: 'validator',
          active: true,
          lastActivity: Date.now(),
          connections: [],
          hash: this.generateHash(),
          consensusState: 'idle'
        });
      }
      
      // Create miner nodes
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8 + Math.PI / 8;
        const radius = Math.min(this.width, this.height) * 0.25;
        this.nodes.push({
          x: this.width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
          y: this.height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 50,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: 8,
          type: 'miner',
          active: Math.random() > 0.3,
          lastActivity: Date.now(),
          connections: [],
          hash: this.generateHash(),
          consensusState: 'idle'
        });
      }
      
      // Create peer nodes
      for (let i = 0; i < nodeCount - 13; i++) {
        this.nodes.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: 5,
          type: Math.random() > 0.7 ? 'smart-contract' : 'peer',
          active: Math.random() > 0.5,
          lastActivity: Date.now(),
          connections: [],
          hash: this.generateHash(),
          consensusState: 'idle'
        });
      }
      
      // Establish connections
      this.nodes.forEach((node, i) => {
        const connectionCount = node.type === 'validator' ? 5 : 3;
        const potentialConnections = this.nodes
          .map((_, j) => j)
          .filter(j => j !== i)
          .sort((a, b) => {
            const distA = this.getDistance(node, this.nodes[a]);
            const distB = this.getDistance(node, this.nodes[b]);
            return distA - distB;
          });
        
        node.connections = potentialConnections.slice(0, connectionCount);
      });
      
      // Start with normal mining timing 
      this.nextBlockTime = Date.now() + this.baseMiningTime;
    }

    initChains() {
      // Start with main chain
      this.chains = [
        {
          id: 0,
          blocks: [],
          color: '#00FFFF',
          isMain: true,
          forkPoint: -1
        }
      ];
    }

    generateHash() {
      return '0x' + Array.from({length: 8}, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
    }

    getDistance(a: {x: number, y: number}, b: {x: number, y: number}) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    boostMiningSpeed() {
      // Each click boosts mining speed
      this.clicksInLastPeriod++;
      this.lastUserActivity = Date.now();
      
      // Calculate new speed multiplier based on clicks
      // More clicks = faster mining (up to 20x speed)
      this.userActivityLevel = Math.min(this.clicksInLastPeriod, 20);
      this.miningSpeedMultiplier = 1 + (this.userActivityLevel * 0.95); // Up to 20x speed
      
      // Update mining time (inverse relationship - higher multiplier = less time)
      this.currentMiningTime = this.baseMiningTime / this.miningSpeedMultiplier;
      
      // Adjust next block time if we're speeding up, but maintain minimum intervals
      const now = Date.now();
      if (this.nextBlockTime > now) {
        const remainingTime = this.nextBlockTime - now;
        const adjustedTime = Math.max(500, remainingTime / this.miningSpeedMultiplier); // Minimum 500ms
        const earliestNextTime = this.lastBlockTime + 1000; // Minimum 1 second from last block
        this.nextBlockTime = Math.max(earliestNextTime, now + adjustedTime);
      }
    }

    async createUserTransaction(x: number, y: number) {
      // Boost mining speed on click
      this.boostMiningSpeed();
      
      // Create mining boost visual effect
      this.miningBoostEffects.push({
        x,
        y,
        size: 5,
        opacity: 1
      });
      
      // Create a visual transaction node at click position
      const userNode: Node = {
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 10,
        type: 'user-transaction',
        active: true,
        lastActivity: Date.now(),
        connections: [],
        hash: this.generateHash(),
        consensusState: 'idle',
        createdByUser: true
      };
      
      this.userTransactions.push(userNode);
      
      // Sync with backend API if enabled
      if (apiSyncEnabled) {
        try {
          // Record interaction
          await api.recordInteraction({
            type: 'click',
            positionX: x,
            positionY: y
          });
          
          // Create transaction in backend
          const tx = await api.createTransaction({
            hash: userNode.hash,
            fromAddress: `0x${this.generateHash().substring(0, 40)}`,
            toAddress: `0x${this.generateHash().substring(0, 40)}`,
            value: Math.random() * 100 + 10,
            fee: Math.random() * 10,
            status: 'pending',
            userCreated: true
          });
          
          // Update mining stats
          const validSpeedMultiplier = Math.max(Number(this.miningSpeedMultiplier) || 1, 1);
          await api.updateMiningStats({
            speedMultiplier: validSpeedMultiplier,
            totalClicks: Math.max(Number(this.clicksInLastPeriod) || 0, 0),
            peakSpeedMultiplier: Math.max(validSpeedMultiplier, 1)
          });
        } catch (error) {
          console.error('API sync failed:', error);
        }
      }
      
      // Add to mempool with special visual
      const mempoolTx: MempoolTx = {
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        size: 8,
        color: '#FFD700',
        targetBlock: null,
        hash: userNode.hash,
        userCreated: true
      };
      
      this.mempool.push(mempoolTx);
      
      // Create visual transaction to nearest node
      const nearestNode = this.nodes.reduce((nearest, node, index) => {
        const dist = this.getDistance({x, y}, node);
        if (dist < nearest.dist) {
          return {dist, index};
        }
        return nearest;
      }, {dist: Infinity, index: 0});
      
      if (nearestNode.index >= 0) {
        // Find a random target node
        const targetIndex = Math.floor(Math.random() * this.nodes.length);
        
        this.transactions.push({
          fromNode: nearestNode.index,
          toNode: targetIndex,
          progress: 0,
          value: Math.random() * 1000 + 100,
          id: userNode.hash,
          color: '#FFD700',
          particles: [],
          userCreated: true
        });
      }
      
      // Create explosion effect
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = Math.random() * 5 + 2;
        this.consensusRounds.push({
          x: x + Math.cos(angle) * speed,
          y: y + Math.sin(angle) * speed,
          radius: Math.random() * 10 + 5,
          opacity: 0.8
        });
      }
      
      // Activate more miners when user is active
      this.nodes.forEach(node => {
        if (node.type === 'miner' && !node.active && Math.random() > 0.7) {
          node.active = true;
          node.lastActivity = Date.now();
        }
      });
    }

    createTransaction() {
      if (this.transactions.length > 15) return;
      
      const activeNodes = this.nodes
        .map((_, i) => i)
        .filter(i => this.nodes[i].active);
      
      if (activeNodes.length < 2) return;
      
      const from = activeNodes[Math.floor(Math.random() * activeNodes.length)];
      let to = activeNodes[Math.floor(Math.random() * activeNodes.length)];
      while (to === from) {
        to = activeNodes[Math.floor(Math.random() * activeNodes.length)];
      }
      
      this.transactions.push({
        fromNode: from,
        toNode: to,
        progress: 0,
        value: Math.random() * 100 + 10,
        id: this.generateHash(),
        color: Math.random() > 0.5 ? '#E94560' : '#00FFFF',
        particles: []
      });
      
      // Add to mempool
      const fromNode = this.nodes[from];
      this.mempool.push({
        x: fromNode.x,
        y: fromNode.y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 2,
        color: Math.random() > 0.5 ? '#E94560' : '#00FFFF',
        targetBlock: null,
        hash: this.generateHash(),
        userCreated: false
      });
    }

    async mineBlock() {
      // Decide which chain mines the block (compete)
      const miningChain = Math.random() > 0.7 && this.chains.length > 1 ? 
        this.chains[Math.floor(Math.random() * this.chains.length)] :
        this.chains.find(c => c.isMain);
      
      if (!miningChain) return;
      
      const chainBlocks = miningChain.blocks;
      const prevBlock = chainBlocks[chainBlocks.length - 1];
      const blockHeight = chainBlocks.length;
      
      // Position blocks in a grid pattern with wrap-around
      const blocksPerRow = 12;
      const maxRows = Math.floor((this.height - 200) / 60); // Available rows on screen
      const blockX = 100 + (blockHeight % blocksPerRow) * 70;
      // Use modulo to wrap around when reaching max rows
      const effectiveRow = Math.floor(blockHeight / blocksPerRow) % maxRows;
      const blockY = this.height - 150 - effectiveRow * 60;
      
      const newBlock: Block = {
        x: this.width / 2,
        y: this.height / 2,
        targetX: blockX,
        targetY: blockY,
        size: 35,
        hash: this.generateHash(),
        timestamp: Date.now(),
        transactions: this.mempool.length > 0 ? Math.min(this.mempool.length, Math.floor(Math.random() * 30) + 10) : 5,
        mined: false,
        opacity: 0,
        height: blockHeight,
        chainId: miningChain.id,
        prevHash: prevBlock ? prevBlock.hash : '0x00000000'
      };
      
      miningChain.blocks.push(newBlock);
      
      // Sync with backend API if enabled
      if (apiSyncEnabled) {
        try {
          // Create block in backend
          await api.createBlock({
            hash: newBlock.hash,
            previousHash: newBlock.prevHash,
            height: newBlock.height,
            chainId: `chain-${miningChain.id}`,
            transactionCount: newBlock.transactions,
            minerAddress: `0x${this.generateHash().substring(0, 40)}`,
            difficulty: Math.floor(Math.random() * 100) + 1,
            nonce: Math.floor(Math.random() * 1000000)
          });
          
          // Update confirmed transactions
          const confirmedTxs = this.mempool.filter(tx => tx.targetBlock === newBlock);
          for (const tx of confirmedTxs.slice(0, 5)) { // Limit API calls
            try {
              await api.updateTransactionStatus(tx.hash, {
                blockHash: newBlock.hash,
                status: 'confirmed'
              });
            } catch (error) {
              // Transaction might not exist in backend
            }
          }
          
          // Record mining boost interaction
          await api.recordInteraction({
            type: 'mining_boost',
            data: JSON.stringify({ 
              blockHash: newBlock.hash, 
              chainId: miningChain.id,
              speedMultiplier: this.miningSpeedMultiplier 
            })
          });
          
          // Update mining stats
          const validSpeedMultiplier = Math.max(Number(this.miningSpeedMultiplier) || 1, 1);
          await api.updateMiningStats({
            speedMultiplier: validSpeedMultiplier,
            blocksMinedCount: Math.max(this.chains.reduce((acc, chain) => acc + chain.blocks.length, 0) || 0, 0),
            averageMiningTime: Math.max(Number(this.currentMiningTime) || 5000, 1)
          });
        } catch (error) {
          console.error('API block sync failed:', error);
        }
      }
      
      // Include user transactions with priority
      const userTxs = this.mempool.filter(tx => tx.userCreated);
      const regularTxs = this.mempool.filter(tx => !tx.userCreated);
      
      // Assign transactions to this block
      [...userTxs, ...regularTxs].forEach(tx => {
        if (!tx.targetBlock) {
          tx.targetBlock = newBlock;
        }
      });
      
      // Check if we should create a fork (more likely when user is active)
      const forkChance = this.miningSpeedMultiplier > 5 ? 0.7 : 0.85;
      if (Math.random() > forkChance && this.chains.length < 3) {
        this.createFork(miningChain);
      }
      
      // Check for chain reorganization
      this.checkChainReorg();
      
      // Create consensus visualization
      const validators = this.nodes.filter(n => n.type === 'validator');
      validators.forEach(v => {
        v.consensusState = 'proposing';
        this.consensusRounds.push({
          x: v.x,
          y: v.y,
          radius: 0,
          opacity: 0.5
        });
      });
      
      // Reset for next block with dynamic timing
      this.miningProgress = 0;
      this.nextBlockTime = Date.now() + this.currentMiningTime + Math.random() * 1000;
      
      // Create more transactions when mining is fast
      if (this.miningSpeedMultiplier > 5) {
        for (let i = 0; i < Math.floor(this.miningSpeedMultiplier / 5); i++) {
          this.createTransaction();
        }
      }
    }

    createFork(parentChain: Chain) {
      const forkPoint = Math.max(0, parentChain.blocks.length - 2);
      const newChain: Chain = {
        id: this.chains.length,
        blocks: [...parentChain.blocks.slice(0, forkPoint)],
        color: ['#E94560', '#FFD700', '#00FF00'][this.chains.length % 3],
        isMain: false,
        forkPoint
      };
      
      this.chains.push(newChain);
    }

    checkChainReorg() {
      // Find longest chain
      let longestChain = this.chains[0];
      let maxLength = longestChain.blocks.length;
      
      this.chains.forEach(chain => {
        if (chain.blocks.length > maxLength) {
          maxLength = chain.blocks.length;
          longestChain = chain;
        }
      });
      
      // Reorganize if needed
      this.chains.forEach(chain => {
        if (chain !== longestChain) {
          chain.isMain = false;
          
          // Mark shorter chains for death if too far behind
          if (chain.blocks.length < maxLength - 3) {
            chain.blocks.forEach(block => {
              if (block.height > longestChain.forkPoint) {
                block.dying = true;
                block.opacity *= 0.95;
              }
            });
          }
        } else {
          chain.isMain = true;
        }
      });
      
      // Remove dead chains
      this.chains = this.chains.filter(chain => {
        const hasLiveBlocks = chain.blocks.some(b => !b.dying || b.opacity > 0.1);
        return hasLiveBlocks || chain.isMain;
      });
    }

    update() {
      time += 0.016;
      
      // Decay mining speed over time
      const now = Date.now();
      const timeSinceLastActivity = now - this.lastUserActivity;
      if (timeSinceLastActivity > 1000) { // Start decay after 1 second
        this.clicksInLastPeriod = Math.max(0, this.clicksInLastPeriod - 0.05);
        this.userActivityLevel = Math.max(0, this.userActivityLevel - 0.02);
        this.miningSpeedMultiplier = Math.max(1, 1 + (this.userActivityLevel * 0.95));
        this.currentMiningTime = this.baseMiningTime / this.miningSpeedMultiplier;
      }
      
      // Update mining progress with dynamic speed
      // Prevent burst mining: ensure minimum 1 second between blocks, allow first block
      if (now >= this.nextBlockTime && (this.lastBlockTime === 0 || now - this.lastBlockTime > 1000)) {
        this.mineBlock();
        this.lastBlockTime = now;
      } else if (this.nextBlockTime > now) {
        this.miningProgress = 1 - (this.nextBlockTime - now) / this.currentMiningTime;
      }
      
      // More frequent random transactions when user is active
      const txChance = this.miningSpeedMultiplier > 5 ? 0.85 : 0.95;
      if (Math.random() > txChance) {
        this.createTransaction();
      }
      
      // Update mining boost effects
      this.miningBoostEffects = this.miningBoostEffects.filter(effect => {
        effect.size += 5;
        effect.opacity -= 0.02;
        return effect.opacity > 0;
      });
      
      // Update user transaction nodes
      this.userTransactions = this.userTransactions.filter(node => {
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.98;
        node.vy *= 0.98;
        node.radius *= 0.98;
        
        return node.radius > 0.5;
      });
      
      // Update nodes (faster when user is active)
      const nodeSpeed = 1 + (this.miningSpeedMultiplier - 1) * 0.1;
      this.nodes.forEach((node, i) => {
        // Gentle floating motion
        node.x += node.vx * nodeSpeed;
        node.y += node.vy * nodeSpeed;
        
        // Add slight orbital motion for validators
        if (node.type === 'validator') {
          const centerX = this.width / 2;
          const centerY = this.height / 2;
          const angle = Math.atan2(node.y - centerY, node.x - centerX);
          node.x += Math.cos(angle + Math.PI / 2) * 0.3 * nodeSpeed;
          node.y += Math.sin(angle + Math.PI / 2) * 0.3 * nodeSpeed;
        }
        
        // Boundary bounce
        if (node.x < node.radius || node.x > this.width - node.radius) {
          node.vx *= -0.8;
        }
        if (node.y < node.radius || node.y > this.height - node.radius) {
          node.vy *= -0.8;
        }
        
        // Keep nodes on screen
        node.x = Math.max(node.radius, Math.min(this.width - node.radius, node.x));
        node.y = Math.max(node.radius, Math.min(this.height - node.radius, node.y));
        
        // More activity when user is active
        const activityChance = this.miningSpeedMultiplier > 5 ? 0.99 : 0.995;
        if (Math.random() > activityChance) {
          node.active = !node.active;
          node.lastActivity = Date.now();
        }
        
        // Faster consensus when mining is fast
        const consensusSpeed = this.miningSpeedMultiplier > 5 ? 0.95 : 0.98;
        if (node.consensusState === 'proposing' && Math.random() > consensusSpeed) {
          node.consensusState = 'voting';
        } else if (node.consensusState === 'voting' && Math.random() > consensusSpeed - 0.01) {
          node.consensusState = 'finalizing';
        } else if (node.consensusState === 'finalizing' && Math.random() > consensusSpeed - 0.02) {
          node.consensusState = 'idle';
        }
      });
      
      // Update transactions (faster when user is active)
      const txSpeed = this.miningSpeedMultiplier > 5 ? 0.06 : 0.025;
      this.transactions = this.transactions.filter(tx => {
        tx.progress += tx.userCreated ? txSpeed * 1.5 : txSpeed;
        
        // Create particle trail
        if (tx.progress < 1 && Math.random() > 0.6) {
          const from = this.nodes[tx.fromNode];
          const to = this.nodes[tx.toNode];
          const x = from.x + (to.x - from.x) * tx.progress;
          const y = from.y + (to.y - from.y) * tx.progress;
          
          tx.particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2
          });
        }
        
        // Update particles
        tx.particles = tx.particles.filter(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.98;
          p.vy *= 0.98;
          return Math.abs(p.vx) > 0.01 || Math.abs(p.vy) > 0.01;
        });
        
        return tx.progress < 1;
      });
      
      // Update blocks
      this.chains.forEach(chain => {
        chain.blocks.forEach(block => {
          const moveSpeed = 0.15 * (1 + (this.miningSpeedMultiplier - 1) * 0.1);
          block.x += (block.targetX - block.x) * moveSpeed;
          block.y += (block.targetY - block.y) * moveSpeed;
          
          if (!block.mined && Math.abs(block.x - block.targetX) < 5) {
            block.mined = true;
          }
          
          if (!block.dying && block.opacity < 1) {
            block.opacity += 0.03 * (1 + (this.miningSpeedMultiplier - 1) * 0.1);
          } else if (block.dying) {
            block.opacity *= 0.95;
            block.size *= 0.98;
          }
        });
      });
      
      // Update mempool
      this.mempool = this.mempool.filter(tx => {
        if (tx.targetBlock) {
          // Move towards target block faster when mining is fast
          const poolSpeed = 0.08 * (1 + (this.miningSpeedMultiplier - 1) * 0.1);
          tx.x += (tx.targetBlock.x - tx.x) * poolSpeed;
          tx.y += (tx.targetBlock.y - tx.y) * poolSpeed;
          
          const dist = this.getDistance(tx, tx.targetBlock);
          return dist > 5;
        } else {
          // Float around
          tx.x += tx.vx;
          tx.y += tx.vy;
          tx.vx *= 0.99;
          tx.vy *= 0.99;
          
          // Add some randomness
          tx.vx += (Math.random() - 0.5) * 0.1;
          tx.vy += (Math.random() - 0.5) * 0.1;
          
          return tx.x > 0 && tx.x < this.width && tx.y > 0 && tx.y < this.height;
        }
      });
      
      // Update consensus rounds
      this.consensusRounds = this.consensusRounds.filter(round => {
        round.radius += 3;
        round.opacity -= 0.015;
        return round.opacity > 0;
      });
    }

    draw() {
      if (!this.ctx) return;
      
      this.ctx.clearRect(0, 0, this.width, this.height);
      
      // Draw mining boost effects
      this.miningBoostEffects.forEach(effect => {
        this.ctx!.strokeStyle = `rgba(255, 215, 0, ${effect.opacity})`;
        this.ctx!.lineWidth = 3;
        this.ctx!.beginPath();
        this.ctx!.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
        this.ctx!.stroke();
        
        // Inner glow
        const gradient = this.ctx!.createRadialGradient(
          effect.x, effect.y, 0,
          effect.x, effect.y, effect.size
        );
        gradient.addColorStop(0, `rgba(255, 215, 0, ${effect.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 215, 0, 0)`);
        this.ctx!.fillStyle = gradient;
        this.ctx!.beginPath();
        this.ctx!.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
        this.ctx!.fill();
      });
      
      // Draw consensus rounds
      this.consensusRounds.forEach(round => {
        this.ctx!.strokeStyle = `rgba(0, 255, 255, ${round.opacity})`;
        this.ctx!.lineWidth = 2;
        this.ctx!.beginPath();
        this.ctx!.arc(round.x, round.y, round.radius, 0, Math.PI * 2);
        this.ctx!.stroke();
      });
      
      // Draw connections
      this.nodes.forEach((node, i) => {
        node.connections.forEach(j => {
          const other = this.nodes[j];
          const dist = this.getDistance(node, other);
          
          if (dist < 300) {
            const opacity = (1 - dist / 300) * 0.2 * (0.5 + this.miningSpeedMultiplier * 0.05);
            
            // Draw data flow on connections (faster when mining is fast)
            const flowSpeed = 50 * (1 + (this.miningSpeedMultiplier - 1) * 0.2);
            const flowOffset = (time * flowSpeed) % dist;
            const segments = 5;
            
            for (let s = 0; s < segments; s++) {
              const segmentPos = (s / segments) * dist;
              const pos = (flowOffset + segmentPos) / dist;
              
              if (pos <= 1) {
                const x = node.x + (other.x - node.x) * pos;
                const y = node.y + (other.y - node.y) * pos;
                
                this.ctx!.fillStyle = `rgba(0, 255, 255, ${opacity * 2})`;
                this.ctx!.beginPath();
                this.ctx!.arc(x, y, 1, 0, Math.PI * 2);
                this.ctx!.fill();
              }
            }
            
            // Connection line
            this.ctx!.strokeStyle = `rgba(100, 200, 255, ${opacity})`;
            this.ctx!.lineWidth = 0.5;
            this.ctx!.beginPath();
            this.ctx!.moveTo(node.x, node.y);
            this.ctx!.lineTo(other.x, other.y);
            this.ctx!.stroke();
          }
        });
      });
      
      // Draw mempool
      this.mempool.forEach(tx => {
        const gradient = this.ctx!.createRadialGradient(
          tx.x, tx.y, 0,
          tx.x, tx.y, tx.size * 2
        );
        
        if (tx.userCreated) {
          // Special effect for user transactions
          gradient.addColorStop(0, '#FFD700FF');
          gradient.addColorStop(0.5, '#FFD70080');
          gradient.addColorStop(1, '#FFD70000');
          
          // Extra glow
          this.ctx!.shadowBlur = 20;
          this.ctx!.shadowColor = '#FFD700';
        } else {
          gradient.addColorStop(0, tx.color + '80');
          gradient.addColorStop(1, tx.color + '00');
        }
        
        this.ctx!.fillStyle = gradient;
        this.ctx!.beginPath();
        this.ctx!.arc(tx.x, tx.y, tx.size * 2, 0, Math.PI * 2);
        this.ctx!.fill();
        
        this.ctx!.fillStyle = tx.userCreated ? '#FFD700' : tx.color;
        this.ctx!.beginPath();
        this.ctx!.arc(tx.x, tx.y, tx.size, 0, Math.PI * 2);
        this.ctx!.fill();
        
        this.ctx!.shadowBlur = 0;
        
        // Show hash for user transactions
        if (tx.userCreated) {
          this.ctx!.fillStyle = 'rgba(255, 215, 0, 0.8)';
          this.ctx!.font = '10px monospace';
          this.ctx!.textAlign = 'center';
          this.ctx!.fillText(tx.hash, tx.x, tx.y - tx.size - 5);
        }
      });
      
      // Draw user transaction nodes
      this.userTransactions.forEach(node => {
        const glowGradient = this.ctx!.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.radius * 3
        );
        glowGradient.addColorStop(0, '#FFD70060');
        glowGradient.addColorStop(1, '#FFD70000');
        
        this.ctx!.fillStyle = glowGradient;
        this.ctx!.beginPath();
        this.ctx!.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
        this.ctx!.fill();
        
        this.ctx!.fillStyle = '#FFD700';
        this.ctx!.beginPath();
        this.ctx!.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        this.ctx!.fill();
      });
      
      // Draw transactions
      this.transactions.forEach(tx => {
        const from = this.nodes[tx.fromNode];
        const to = this.nodes[tx.toNode];
        const x = from.x + (to.x - from.x) * tx.progress;
        const y = from.y + (to.y - from.y) * tx.progress;
        
        // Draw transaction path
        const gradient = this.ctx!.createLinearGradient(from.x, from.y, to.x, to.y);
        gradient.addColorStop(0, tx.color + '00');
        gradient.addColorStop(tx.progress, tx.color + 'FF');
        gradient.addColorStop(Math.min(1, tx.progress + 0.1), tx.color + '00');
        
        this.ctx!.strokeStyle = gradient;
        this.ctx!.lineWidth = tx.userCreated ? 3 : 2;
        this.ctx!.beginPath();
        this.ctx!.moveTo(from.x, from.y);
        this.ctx!.lineTo(to.x, to.y);
        this.ctx!.stroke();
        
        // Draw transaction packet
        const packetGradient = this.ctx!.createRadialGradient(x, y, 0, x, y, tx.userCreated ? 15 : 10);
        packetGradient.addColorStop(0, '#FFFFFF');
        packetGradient.addColorStop(0.5, tx.color);
        packetGradient.addColorStop(1, tx.color + '00');
        
        this.ctx!.fillStyle = packetGradient;
        this.ctx!.beginPath();
        this.ctx!.arc(x, y, tx.userCreated ? 15 : 10, 0, Math.PI * 2);
        this.ctx!.fill();
        
        // Draw particles
        tx.particles.forEach(p => {
          this.ctx!.fillStyle = tx.color + '40';
          this.ctx!.beginPath();
          this.ctx!.arc(p.x, p.y, 2, 0, Math.PI * 2);
          this.ctx!.fill();
        });
      });
      
      // Draw nodes (pulse faster when mining is fast)
      const pulseSpeed = 5 * (1 + (this.miningSpeedMultiplier - 1) * 0.2);
      this.nodes.forEach(node => {
        const pulseSize = node.active ? 
          node.radius + Math.sin(time * pulseSpeed) * 2 : 
          node.radius;
        
        // Node glow (brighter when mining is fast)
        if (node.active) {
          const glowGradient = this.ctx!.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, pulseSize * 2
          );
          
          const color = node.type === 'validator' ? '#E94560' :
                       node.type === 'miner' ? '#00FFFF' :
                       node.type === 'smart-contract' ? '#FFD700' : '#00FF00';
          
          const glowOpacity = 0.4 + (this.miningSpeedMultiplier - 1) * 0.02;
          glowGradient.addColorStop(0, color + Math.floor(glowOpacity * 255).toString(16).padStart(2, '0'));
          glowGradient.addColorStop(1, color + '00');
          
          this.ctx!.fillStyle = glowGradient;
          this.ctx!.beginPath();
          this.ctx!.arc(node.x, node.y, pulseSize * 2, 0, Math.PI * 2);
          this.ctx!.fill();
        }
        
        // Node body
        const nodeGradient = this.ctx!.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, pulseSize
        );
        
        if (node.type === 'validator') {
          nodeGradient.addColorStop(0, '#FF6B6B');
          nodeGradient.addColorStop(1, '#E94560');
        } else if (node.type === 'miner') {
          nodeGradient.addColorStop(0, '#4ECDC4');
          nodeGradient.addColorStop(1, '#00FFFF');
        } else if (node.type === 'smart-contract') {
          nodeGradient.addColorStop(0, '#FFE66D');
          nodeGradient.addColorStop(1, '#FFD700');
        } else {
          nodeGradient.addColorStop(0, '#95E77E');
          nodeGradient.addColorStop(1, '#00FF00');
        }
        
        this.ctx!.fillStyle = nodeGradient;
        this.ctx!.beginPath();
        this.ctx!.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
        this.ctx!.fill();
        
        // Node hash label
        if (node.type === 'validator' || node.type === 'miner') {
          this.ctx!.fillStyle = 'rgba(255, 255, 255, 0.5)';
          this.ctx!.font = '10px monospace';
          this.ctx!.textAlign = 'center';
          this.ctx!.fillText(node.hash, node.x, node.y - pulseSize - 5);
        }
        
        // Consensus state indicator
        if (node.consensusState !== 'idle') {
          this.ctx!.strokeStyle = node.consensusState === 'proposing' ? '#FFD700' :
                                 node.consensusState === 'voting' ? '#00FFFF' : '#00FF00';
          this.ctx!.lineWidth = 2;
          this.ctx!.beginPath();
          this.ctx!.arc(node.x, node.y, pulseSize + 5, 0, Math.PI * 2);
          this.ctx!.stroke();
        }
      });
      
      // Draw blockchain chains
      this.chains.forEach(chain => {
        chain.blocks.forEach((block, i) => {
          // Block connection to previous
          if (i > 0) {
            const prevBlock = chain.blocks[i - 1];
            this.ctx!.strokeStyle = chain.isMain ? 
              `rgba(0, 255, 255, ${block.opacity * 0.6})` :
              `${chain.color}${Math.floor(block.opacity * 0.4 * 255).toString(16).padStart(2, '0')}`;
            this.ctx!.lineWidth = chain.isMain ? 3 : 2;
            this.ctx!.setLineDash(block.dying ? [2, 4] : [5, 5]);
            this.ctx!.beginPath();
            this.ctx!.moveTo(prevBlock.x, prevBlock.y);
            this.ctx!.lineTo(block.x, block.y);
            this.ctx!.stroke();
            this.ctx!.setLineDash([]);
          }
          
          // Block body
          const blockGradient = this.ctx!.createLinearGradient(
            block.x - block.size / 2, block.y - block.size / 2,
            block.x + block.size / 2, block.y + block.size / 2
          );
          
          if (chain.isMain) {
            blockGradient.addColorStop(0, `rgba(0, 255, 255, ${block.opacity})`);
            blockGradient.addColorStop(1, `rgba(233, 69, 96, ${block.opacity})`);
          } else {
            const rgb = chain.color.match(/\w\w/g)!.map(x => parseInt(x, 16));
            blockGradient.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${block.opacity})`);
            blockGradient.addColorStop(1, `rgba(${rgb[0]/2}, ${rgb[1]/2}, ${rgb[2]/2}, ${block.opacity})`);
          }
          
          this.ctx!.fillStyle = blockGradient;
          this.ctx!.fillRect(
            block.x - block.size / 2,
            block.y - block.size / 2,
            block.size,
            block.size
          );
          
          // Block border - thicker for main chain
          this.ctx!.strokeStyle = chain.isMain ? 
            `rgba(255, 255, 255, ${block.opacity * 0.9})` :
            `rgba(255, 255, 255, ${block.opacity * 0.5})`;
          this.ctx!.lineWidth = chain.isMain ? 3 : 1;
          this.ctx!.strokeRect(
            block.x - block.size / 2,
            block.y - block.size / 2,
            block.size,
            block.size
          );
          
          // Block info
          if (block.mined && block.opacity > 0.5) {
            this.ctx!.fillStyle = `rgba(255, 255, 255, ${block.opacity * 0.9})`;
            this.ctx!.font = chain.isMain ? 'bold 11px monospace' : '10px monospace';
            this.ctx!.textAlign = 'center';
            this.ctx!.fillText(`#${block.height}`, block.x, block.y - 2);
            this.ctx!.font = '8px monospace';
            this.ctx!.fillText(block.hash, block.x, block.y + 8);
            this.ctx!.fillText(`${block.transactions} tx`, block.x, block.y + 18);
          }
        });
      });
      
      // Draw chain labels
      this.chains.forEach(chain => {
        if (chain.blocks.length > 0) {
          const lastBlock = chain.blocks[chain.blocks.length - 1];
          this.ctx!.fillStyle = chain.isMain ? '#00FFFF' : chain.color;
          this.ctx!.font = chain.isMain ? 'bold 12px monospace' : '11px monospace';
          this.ctx!.textAlign = 'center';
          this.ctx!.fillText(
            chain.isMain ? 'MAIN CHAIN' : `FORK ${chain.id}`,
            lastBlock.x,
            lastBlock.y + lastBlock.size / 2 + 20
          );
        }
      });
      
      // Draw mining progress bar with speed indicator
      const barWidth = 250;
      const barHeight = 8;
      const barX = this.width - barWidth - 20;
      const barY = 20;
      
      // Background
      this.ctx!.fillStyle = 'rgba(255, 255, 255, 0.1)';
      this.ctx!.fillRect(barX, barY, barWidth, barHeight);
      
      // Progress bar (color changes with speed)
      const progressGradient = this.ctx!.createLinearGradient(barX, 0, barX + barWidth * this.miningProgress, 0);
      if (this.miningSpeedMultiplier > 10) {
        // Super fast - rainbow
        progressGradient.addColorStop(0, '#FF0000');
        progressGradient.addColorStop(0.3, '#FFD700');
        progressGradient.addColorStop(0.6, '#00FF00');
        progressGradient.addColorStop(1, '#00FFFF');
      } else if (this.miningSpeedMultiplier > 5) {
        // Fast - gold to cyan
        progressGradient.addColorStop(0, '#FFD700');
        progressGradient.addColorStop(1, '#00FFFF');
      } else {
        // Normal - red to cyan
        progressGradient.addColorStop(0, '#E94560');
        progressGradient.addColorStop(1, '#00FFFF');
      }
      
      this.ctx!.fillStyle = progressGradient;
      this.ctx!.fillRect(barX, barY, barWidth * this.miningProgress, barHeight);
      
      // Border
      this.ctx!.strokeStyle = this.miningSpeedMultiplier > 5 ? 
        'rgba(255, 215, 0, 0.6)' : 'rgba(255, 255, 255, 0.3)';
      this.ctx!.lineWidth = this.miningSpeedMultiplier > 5 ? 2 : 1;
      this.ctx!.strokeRect(barX, barY, barWidth, barHeight);
      
      // Text
      this.ctx!.fillStyle = this.miningSpeedMultiplier > 5 ? 
        'rgba(255, 215, 0, 0.9)' : 'rgba(255, 255, 255, 0.6)';
      this.ctx!.font = this.miningSpeedMultiplier > 5 ? 'bold 11px monospace' : '11px monospace';
      this.ctx!.textAlign = 'right';
      this.ctx!.fillText(
        `Mining Speed: ${this.miningSpeedMultiplier.toFixed(1)}x`, 
        barX - 10, 
        barY + 6
      );
      
      // Draw stats
      const totalBlocks = this.chains.reduce((sum, chain) => sum + chain.blocks.length, 0);
      const mainChain = this.chains.find(c => c.isMain);
      
      this.ctx!.fillStyle = 'rgba(255, 255, 255, 0.6)';
      this.ctx!.font = '12px monospace';
      this.ctx!.textAlign = 'left';
      this.ctx!.fillText(`Main Chain: ${mainChain ? mainChain.blocks.length : 0} blocks`, 20, 30);
      this.ctx!.fillText(`Total Blocks: ${totalBlocks}`, 20, 50);
      this.ctx!.fillText(`Active Forks: ${this.chains.length - 1}`, 20, 70);
      this.ctx!.fillText(`Mempool: ${this.mempool.length} tx`, 20, 90);
      this.ctx!.fillText(`Network Hash: ${this.generateHash()}`, 20, 110);
      this.ctx!.fillText(`Activity Level: ${Math.floor(this.userActivityLevel * 5)}`, 20, 130);
      
      // Instructions (changes based on speed)
      if (this.miningSpeedMultiplier > 10) {
        this.ctx!.fillStyle = 'rgba(255, 0, 255, 0.9)';
        this.ctx!.font = 'bold 14px monospace';
        this.ctx!.textAlign = 'center';
        this.ctx!.fillText('⚡ MAXIMUM MINING SPEED! ⚡', this.width / 2, 30);
      } else if (this.miningSpeedMultiplier > 5) {
        this.ctx!.fillStyle = 'rgba(255, 215, 0, 0.8)';
        this.ctx!.font = 'bold 12px monospace';
        this.ctx!.textAlign = 'center';
        this.ctx!.fillText('🔥 RAPID MINING MODE - KEEP CLICKING! 🔥', this.width / 2, 30);
      } else if (this.miningSpeedMultiplier > 2) {
        this.ctx!.fillStyle = 'rgba(255, 215, 0, 0.7)';
        this.ctx!.font = 'bold 11px monospace';
        this.ctx!.textAlign = 'center';
        this.ctx!.fillText('MINING ACCELERATED - CLICK MORE!', this.width / 2, 30);
      } else {
        this.ctx!.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx!.font = '11px monospace';
        this.ctx!.textAlign = 'center';
        this.ctx!.fillText('CLICK TO BOOST MINING SPEED', this.width / 2, 30);
      }
    }
  }

  let network: BlockchainNetwork | null = null;

  function animate() {
    if (network) {
      network.update();
      network.draw();
    }
    animationId = requestAnimationFrame(animate);
  }

  function handleClick(e: MouseEvent) {
    if (network) {
      network.createUserTransaction(e.clientX, e.clientY);
    }
  }

  function handleResize() {
    if (network) {
      network.resize();
    }
  }

  onMount(() => {
    if (canvas) {
      network = new BlockchainNetwork(canvas);
      animate();
      window.addEventListener('resize', handleResize);
      window.addEventListener('click', handleClick);
    }
  });

  onDestroy(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('click', handleClick);
  });
</script>

<canvas
  bind:this={canvas}
  class="fixed inset-0 w-full h-full"
  style="z-index: 0; opacity: 0.3; pointer-events: auto;"
/>

<style>
  canvas {
    mix-blend-mode: screen;
  }
</style>