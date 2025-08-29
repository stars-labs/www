import { writable, derived } from 'svelte/store';

// Mining state stores
export const isMining = writable(false);
export const hashRate = writable(0);
export const blocksFound = writable(0);
export const totalHashes = writable(0);
export const currentDifficulty = writable(4);
export const minerAddress = writable('');
export const miningReward = writable('10000000000'); // 1 STARS in starshars
export const earnings = writable('0');

// Derived stores
export const hashRateFormatted = derived(hashRate, $rate => {
  if ($rate < 1000) return `${$rate} H/s`;
  if ($rate < 1000000) return `${($rate / 1000).toFixed(2)} KH/s`;
  return `${($rate / 1000000).toFixed(2)} MH/s`;
});

export const earningsFormatted = derived(earnings, $earnings => {
  const stars = BigInt($earnings) / BigInt(10 ** 10);
  const remainder = BigInt($earnings) % BigInt(10 ** 10);
  
  if (remainder === 0n) {
    return `${stars} STARS`;
  }
  
  // Show up to 4 decimal places
  const decimal = Number(remainder) / (10 ** 10);
  return `${stars}.${decimal.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} STARS`;
});

// Mining manager class
export class MiningManager {
  private worker: Worker | null = null;
  private currentJob: any = null;
  private jobTimeout: number | null = null;
  private api: any;
  
  constructor(api: any) {
    this.api = api;
  }
  
  // Generate or get miner address
  async getMinerAddress(): Promise<string> {
    let address = localStorage.getItem('minerAddress');
    
    if (!address) {
      // Generate a random address for this browser
      // In production, this should be a proper wallet
      const array = new Uint8Array(20);
      crypto.getRandomValues(array);
      address = '0x' + Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      localStorage.setItem('minerAddress', address);
    }
    
    minerAddress.set(address);
    return address;
  }
  
  // Start mining
  async startMining() {
    if (this.worker) {
      console.log('Mining already in progress');
      return;
    }
    
    const address = await this.getMinerAddress();
    console.log('Starting mining with address:', address);
    
    isMining.set(true);
    
    // Create worker
    this.worker = new Worker('/mining-worker.js');
    
    // Handle worker messages
    this.worker.onmessage = async (e) => {
      const { type, ...data } = e.data;
      
      switch (type) {
        case 'ready':
          console.log('Mining worker ready');
          await this.requestNewJob();
          break;
          
        case 'progress':
          hashRate.set(data.hashRate);
          totalHashes.update(n => n + 10000);
          break;
          
        case 'solution':
          console.log('Solution found!', data);
          await this.submitSolution(data.nonce, data.hash);
          break;
          
        case 'stopped':
          console.log('Mining stopped');
          break;
          
        case 'error':
          console.error('Worker error:', data.message);
          break;
      }
    };
    
    // Handle worker errors
    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
      this.stopMining();
    };
  }
  
  // Request new mining job
  async requestNewJob() {
    if (!this.worker) return;
    
    try {
      const address = await this.getMinerAddress();
      const response = await this.api.request('/mining/job', {
        method: 'POST',
        body: JSON.stringify({ minerAddress: address })
      });
      
      this.currentJob = response;
      currentDifficulty.set(response.blockTemplate.difficulty);
      
      console.log('Got mining job:', response.jobId);
      console.log('Difficulty:', response.blockTemplate.difficulty);
      console.log('Target:', response.target);
      
      // Send job to worker
      this.worker.postMessage({
        type: 'start',
        data: {
          blockTemplate: response.blockTemplate,
          target: response.target
        }
      });
      
      // Set timeout for job expiry (get new job before expiry)
      if (this.jobTimeout) {
        clearTimeout(this.jobTimeout);
      }
      
      this.jobTimeout = window.setTimeout(() => {
        console.log('Job expired, requesting new one');
        this.requestNewJob();
      }, 25000); // Request new job 5 seconds before expiry
      
    } catch (error) {
      console.error('Failed to get mining job:', error);
      
      // Retry after delay
      setTimeout(() => {
        if (this.worker) {
          this.requestNewJob();
        }
      }, 5000);
    }
  }
  
  // Submit mining solution
  async submitSolution(nonce: string, hash: string) {
    if (!this.currentJob) {
      console.error('No current job');
      return;
    }
    
    try {
      const address = await this.getMinerAddress();
      const response = await this.api.request('/mining/submit', {
        method: 'POST',
        body: JSON.stringify({
          jobId: this.currentJob.jobId,
          nonce,
          minerAddress: address
        })
      });
      
      if (response.accepted) {
        console.log('Block accepted!', response.block);
        
        // Update stats
        blocksFound.update(n => n + 1);
        earnings.update(e => {
          const current = BigInt(e);
          const reward = BigInt(response.block.reward);
          return (current + reward).toString();
        });
        
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Block Found!', {
            body: `You mined block #${response.block.height} and earned 1 STARS!`,
            icon: '/favicon.png'
          });
        }
      } else {
        console.log('Block rejected:', response.reason);
      }
      
    } catch (error) {
      console.error('Failed to submit solution:', error);
    }
    
    // Request new job regardless of outcome
    await this.requestNewJob();
  }
  
  // Stop mining
  stopMining() {
    if (this.worker) {
      this.worker.postMessage({ type: 'stop' });
      this.worker.terminate();
      this.worker = null;
    }
    
    if (this.jobTimeout) {
      clearTimeout(this.jobTimeout);
      this.jobTimeout = null;
    }
    
    this.currentJob = null;
    isMining.set(false);
    hashRate.set(0);
  }
  
  // Get mining stats from server
  async getStats() {
    try {
      const stats = await this.api.request('/mining/stats');
      return stats;
    } catch (error) {
      console.error('Failed to get mining stats:', error);
      return null;
    }
  }
  
  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }
}

// Format STARS amount
export function formatStars(starshars: string | bigint): string {
  const amount = typeof starshars === 'string' ? BigInt(starshars) : starshars;
  const stars = amount / BigInt(10 ** 10);
  const remainder = amount % BigInt(10 ** 10);
  
  if (remainder === 0n) {
    return `${stars} STARS`;
  }
  
  const decimal = Number(remainder) / (10 ** 10);
  return `${stars}.${decimal.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} STARS`;
}