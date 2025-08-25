// API Service for backend communication

const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8787/api' 
  : '/api'; // Use relative path for same-origin requests

export interface Transaction {
  id: number;
  hash: string;
  blockHash?: string;
  fromAddress: string;
  toAddress: string;
  value: number;
  fee?: number;
  status: 'pending' | 'confirmed' | 'failed';
  userCreated?: boolean;
  createdAt: Date;
}

export interface Block {
  id: number;
  hash: string;
  previousHash: string;
  height: number;
  chainId: string;
  transactionCount?: number;
  minerAddress?: string;
  difficulty?: number;
  nonce?: number;
  timestamp: Date;
}

export interface ChainFork {
  id: number;
  forkId: string;
  parentChainId: string;
  forkHeight: number;
  totalBlocks: number;
  isMainChain: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface MiningStats {
  sessionId: string;
  speedMultiplier: number;
  blocksMinedCount?: number;
  totalClicks?: number;
  averageMiningTime?: number;
  peakSpeedMultiplier?: number;
  timestamp?: Date;
}

export interface Interaction {
  id: number;
  sessionId: string;
  type: 'click' | 'transaction' | 'mining_boost';
  data?: string;
  positionX?: number;
  positionY?: number;
  timestamp: Date;
}

export interface NetworkNode {
  id: number;
  nodeId: string;
  type: 'validator' | 'miner' | 'peer' | 'smart-contract';
  address: string;
  isActive: boolean;
  consensusParticipation: number;
  lastSeen: Date;
}

class APIService {
  private sessionId: string;

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getSessionId();
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Blockchain endpoints
  async getBlocks(limit = 10, offset = 0, chainId?: string) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (chainId) params.append('chainId', chainId);
    
    return this.request<{ blocks: Block[]; count: number }>(
      `/blockchain/blocks?${params}`
    );
  }

  async getBlock(hash: string) {
    return this.request<Block>(`/blockchain/blocks/${hash}`);
  }

  async createBlock(block: Omit<Block, 'id' | 'timestamp'>) {
    return this.request<Block>('/blockchain/blocks', {
      method: 'POST',
      body: JSON.stringify(block),
    });
  }

  async getChainStats() {
    return this.request<{
      totalBlocks: number;
      chains: Array<{ chainId: string; blockCount: number; maxHeight: number }>;
      recentBlocks: Block[];
      timestamp: string;
    }>('/blockchain/stats');
  }

  async getChainForks() {
    return this.request<ChainFork[]>('/blockchain/forks');
  }

  async createFork(fork: {
    forkId: string;
    parentChainId: string;
    forkHeight: number;
    isMainChain?: boolean;
  }) {
    return this.request<ChainFork>('/blockchain/forks', {
      method: 'POST',
      body: JSON.stringify(fork),
    });
  }

  async resolveFork(forkId: string) {
    return this.request<ChainFork>(`/blockchain/forks/${forkId}/resolve`, {
      method: 'PUT',
    });
  }

  // Transaction endpoints
  async getTransactions(limit = 20, offset = 0, status?: string, userCreated?: boolean) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (status) params.append('status', status);
    if (userCreated !== undefined) params.append('userCreated', userCreated.toString());
    
    return this.request<{ transactions: Transaction[]; count: number }>(
      `/transactions?${params}`
    );
  }

  async getTransaction(hash: string) {
    return this.request<Transaction>(`/transactions/${hash}`);
  }

  async createTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>) {
    return this.request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(tx),
    });
  }

  async updateTransactionStatus(hash: string, updates: {
    blockHash?: string;
    status?: 'pending' | 'confirmed' | 'failed';
  }) {
    return this.request<Transaction>(`/transactions/${hash}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getMempool() {
    return this.request<{ mempool: Transaction[]; count: number }>(
      '/transactions/mempool/pending'
    );
  }

  async getTransactionStats() {
    return this.request<{
      totalTransactions: number;
      pendingCount: number;
      confirmedCount: number;
      failedCount: number;
      userCreatedCount: number;
      totalValue: number;
      totalFees: number;
      recentTransactions: Transaction[];
      timestamp: string;
    }>('/transactions/stats/summary');
  }

  // Analytics endpoints
  async recordInteraction(interaction: {
    type: 'click' | 'transaction' | 'mining_boost';
    data?: string;
    positionX?: number;
    positionY?: number;
  }) {
    return this.request<Interaction>('/analytics/interactions', {
      method: 'POST',
      body: JSON.stringify({
        ...interaction,
        sessionId: this.sessionId,
      }),
    });
  }

  async getSessionInteractions(limit = 100) {
    return this.request<{
      sessionId: string;
      interactions: Interaction[];
      count: number;
    }>(`/analytics/interactions/${this.sessionId}?limit=${limit}`);
  }

  async updateMiningStats(stats: {
    speedMultiplier: number;
    blocksMinedCount?: number;
    totalClicks?: number;
    averageMiningTime?: number;
    peakSpeedMultiplier?: number;
  }) {
    return this.request<MiningStats>('/analytics/mining-stats', {
      method: 'POST',
      body: JSON.stringify({
        ...stats,
        sessionId: this.sessionId,
      }),
    });
  }

  async getMiningStats(): Promise<MiningStats | null> {
    try {
      return await this.request<MiningStats>(`/analytics/mining-stats/${this.sessionId}`);
    } catch (error) {
      // Return null for 404 (stats not found for new sessions) - this is expected behavior
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async getGlobalAnalytics(hoursAgo = 24) {
    return this.request<{
      timeRange: { hours: number; from: string; to: string };
      interactions: any;
      mining: any;
      activityByHour: Array<{ hour: string; interactions: number }>;
    }>(`/analytics/global?hoursAgo=${hoursAgo}`);
  }

  async getClickHeatmap(hoursAgo = 1) {
    return this.request<{
      heatmap: Array<{ x: number; y: number; count: number }>;
      timeRange: { hours: number; from: string; to: string };
    }>(`/analytics/heatmap?hoursAgo=${hoursAgo}`);
  }

  // Node endpoints
  async getNodes(type?: string, isActive?: boolean) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (isActive !== undefined) params.append('active', isActive.toString());
    
    return this.request<{ nodes: NetworkNode[]; count: number }>(
      `/nodes?${params}`
    );
  }

  async getNode(nodeId: string) {
    return this.request<NetworkNode>(`/nodes/${nodeId}`);
  }

  async registerNode(node: {
    nodeId: string;
    type: 'validator' | 'miner' | 'peer' | 'smart-contract';
    address: string;
    isActive?: boolean;
  }) {
    return this.request<NetworkNode>('/nodes', {
      method: 'POST',
      body: JSON.stringify(node),
    });
  }

  async updateNodeStatus(nodeId: string, updates: {
    isActive?: boolean;
    consensusParticipation?: number;
  }) {
    return this.request<NetworkNode>(`/nodes/${nodeId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async sendHeartbeat(nodeId: string) {
    return this.request<{
      success: boolean;
      nodeId: string;
      lastSeen: Date;
    }>(`/nodes/${nodeId}/heartbeat`, {
      method: 'POST',
    });
  }

  async getNetworkStats() {
    return this.request<{
      network: {
        totalNodes: number;
        activeNodes: number;
        validators: number;
        miners: number;
        peers: number;
        smartContracts: number;
        totalConsensusParticipation: number;
      };
      topValidators: NetworkNode[];
      timestamp: string;
    }>('/nodes/stats/network');
  }

  async deactivateInactiveNodes(hoursInactive = 24) {
    return this.request<{
      deactivated: number;
      nodes: NetworkNode[];
    }>(`/nodes/maintenance/deactivate-inactive?hours=${hoursInactive}`, {
      method: 'POST',
    });
  }
}

// Export singleton instance
export const api = new APIService();