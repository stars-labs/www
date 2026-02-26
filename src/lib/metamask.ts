import { writable, derived, get } from 'svelte/store';

// MetaMask state stores
export const isConnected = writable(false);
export const account = writable<string | null>(null);
export const chainId = writable<string | null>(null);
export const balance = writable<string>('0');
export const isMetaMaskInstalled = writable(false);

// Network configuration
const STARS_NETWORK = {
  chainId: '0x1e93', // 7827 in hex (STARS network)
  chainName: 'STARS Blockchain',
  nativeCurrency: {
    name: 'STARS',
    symbol: 'STARS',
    decimals: 18 // MetaMask requires 18 for EVM compatibility
  },
  rpcUrls: ['https://starslab-app.freeman-xiong.workers.dev/rpc'],
  blockExplorerUrls: ['http://localhost:5173/explorer']
};

// Ethereum provider type
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Format balance for display (now uses 18 decimals for MetaMask compatibility)
export const balanceFormatted = derived(balance, $balance => {
  if ($balance === '0') return '0 STARS';
  
  // Balance is now in 18 decimals (MetaMask standard)
  const stars = BigInt($balance) / BigInt(10 ** 18);
  const remainder = BigInt($balance) % BigInt(10 ** 18);
  
  if (remainder === 0n) {
    return `${stars} STARS`;
  }
  
  // Show up to 4 decimal places
  const decimal = Number(remainder) / (10 ** 18);
  return `${stars}.${decimal.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} STARS`;
});

export class MetaMaskManager {
  private ethereum: any;
  
  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.ethereum = window.ethereum;
      isMetaMaskInstalled.set(true);
      this.setupEventListeners();
      this.checkConnection();
    }
  }
  
  private setupEventListeners() {
    if (!this.ethereum) return;
    
    // Listen for account changes
    this.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        account.set(accounts[0]);
        this.updateBalance(accounts[0]);
      }
    });
    
    // Listen for chain changes
    this.ethereum.on('chainChanged', (chainId: string) => {
      chainId.set(chainId);
      // Reload the page as recommended by MetaMask
      window.location.reload();
    });
    
    // Listen for disconnect
    this.ethereum.on('disconnect', () => {
      this.disconnect();
    });
  }
  
  private async checkConnection() {
    if (!this.ethereum) return;
    
    try {
      const accounts = await this.ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      if (accounts.length > 0) {
        isConnected.set(true);
        account.set(accounts[0]);
        
        const chain = await this.ethereum.request({ 
          method: 'eth_chainId' 
        });
        chainId.set(chain);
        
        await this.updateBalance(accounts[0]);
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  }
  
  async connect(): Promise<boolean> {
    if (!this.ethereum) {
      alert('Please install MetaMask to use this feature!');
      window.open('https://metamask.io/download/', '_blank');
      return false;
    }
    
    try {
      // Request account access
      const accounts = await this.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        isConnected.set(true);
        account.set(accounts[0]);
        
        // Get chain ID
        const chain = await this.ethereum.request({ 
          method: 'eth_chainId' 
        });
        chainId.set(chain);
        
        // Check if we need to add/switch to STARS network
        if (chain !== STARS_NETWORK.chainId) {
          await this.addNetwork();
        }
        
        await this.updateBalance(accounts[0]);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Failed to connect:', error);
      
      if (error.code === 4001) {
        // User rejected the request
        alert('Please connect to MetaMask to continue');
      }
      
      return false;
    }
  }
  
  async addNetwork(): Promise<boolean> {
    if (!this.ethereum) return false;
    
    try {
      await this.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [STARS_NETWORK]
      });
      
      return true;
    } catch (error: any) {
      // Error code 4902 means the chain hasn't been added to MetaMask
      if (error.code === 4902) {
        try {
          await this.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [STARS_NETWORK]
          });
          return true;
        } catch (addError) {
          console.error('Failed to add network:', addError);
        }
      } else {
        console.error('Failed to switch network:', error);
      }
      
      return false;
    }
  }
  
  async updateBalance(address: string) {
    if (!this.ethereum) return;
    
    try {
      const bal = await this.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      // Convert from hex to decimal string
      const balanceInStarshars = BigInt(bal).toString();
      balance.set(balanceInStarshars);
    } catch (error) {
      console.error('Failed to get balance:', error);
      balance.set('0');
    }
  }
  
  async sendTransaction(to: string, amount: string): Promise<string | null> {
    if (!this.ethereum) {
      alert('MetaMask not installed');
      return null;
    }
    
    const currentAccount = get(account);
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return null;
    }
    
    try {
      // Convert STARS to starshars (18 decimals, like ETH wei)
      const amountInStarshars = BigInt(Math.floor(parseFloat(amount) * (10 ** 18)));
      const valueHex = '0x' + amountInStarshars.toString(16);
      
      console.log('Sending transaction:', {
        from: currentAccount,
        to: to,
        value: valueHex,
        gas: '0x5208',
        gasPrice: '0x1'
      });
      
      // First estimate gas to ensure transaction is valid
      try {
        const gasEstimate = await this.ethereum.request({
          method: 'eth_estimateGas',
          params: [{
            from: currentAccount,
            to: to,
            value: valueHex
          }]
        });
        console.log('Gas estimate:', gasEstimate);
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        // Continue anyway as our blockchain has fixed gas
      }
      
      const txHash = await this.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: currentAccount,
          to: to,
          value: valueHex,
          gas: '0x5208', // 21000 in hex
          gasPrice: '0x1' // 1 starshars
          // Note: chainId is not a valid parameter for eth_sendTransaction
        }]
      });
      
      console.log('Transaction sent successfully:', txHash);
      
      // Update balance after a delay
      setTimeout(() => this.updateBalance(currentAccount), 3000);
      
      return txHash;
    } catch (error: any) {
      console.error('Transaction failed:', error);
      
      // Check for specific error codes
      if (error.code === 4001) {
        alert('Transaction cancelled');
      } else if (error.code === -32603) {
        // Internal JSON-RPC error - likely a MetaMask issue
        console.error('MetaMask internal error. Full error:', error);
        
        // Try alternative approach - use eth_sendRawTransaction
        alert('Transaction failed due to MetaMask error. Please try again or check if MetaMask is properly connected to the STARS network.');
      } else if (error.message?.includes('insufficient funds')) {
        alert('Insufficient balance for transaction');
      } else {
        alert('Transaction failed: ' + (error.message || 'Unknown error'));
      }
      
      return null;
    }
  }
  
  disconnect() {
    isConnected.set(false);
    account.set(null);
    balance.set('0');
  }
  
  async watchAsset(): Promise<boolean> {
    if (!this.ethereum) return false;
    
    try {
      const wasAdded = await this.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: '0x0000000000000000000000000000000000000000', // Native token
            symbol: 'STARS',
            decimals: 10,
            image: 'https://www.hecoinfo.com/favicon.png'
          }
        }
      });
      
      return wasAdded;
    } catch (error) {
      console.error('Failed to add token:', error);
      return false;
    }
  }
}