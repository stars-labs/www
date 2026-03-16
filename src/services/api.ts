// API Service for backend communication

const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:43251/api'
  : '/api'; // Use relative path for same-origin requests

export interface Transaction {
  hash: string;
  blockHeight?: number;
  fromAddress: string;
  toAddress: string;
  value: string;
  gasLimit?: number;
  gasPrice?: string;
  gasUsed?: number;
  nonce?: number;
  signature?: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: number;
}

export interface Block {
  height: number;
  hash: string;
  previousHash: string;
  merkleRoot?: string;
  timestamp: number;
  difficulty: number;
  nonce: string;
  minerAddress: string;
  reward: string;
  txCount: number;
  gasUsed?: string;
  createdAt: number;
}

export interface ChainState {
  id: number;
  latestHeight: number;
  latestHash: string;
  totalSupply: string;
  currentDifficulty: number;
  nextDifficultyAdjust: number;
  averageBlockTime: number;
  updatedAt: number;
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
  async getBlocks(limit = 10, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return this.request<{ blocks: Block[]; count: number }>(
      `/blockchain/blocks?${params}`
    );
  }

  async getBlock(hash: string) {
    return this.request<Block>(`/blockchain/blocks/${hash}`);
  }

  async getChainStats() {
    return this.request<{
      totalBlocks: number;
      latestHeight: number;
      recentBlocks: Block[];
      chainState: ChainState | null;
      timestamp: string;
    }>('/blockchain/stats');
  }

  // Transaction endpoints
  async getTransactions(limit = 20, offset = 0, status?: string) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (status) params.append('status', status);

    return this.request<{ transactions: Transaction[]; count: number }>(
      `/transactions?${params}`
    );
  }

  async getTransaction(hash: string) {
    return this.request<Transaction>(`/transactions/${hash}`);
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
      totalValue: number;
      recentTransactions: Transaction[];
      timestamp: string;
    }>('/transactions/stats/summary');
  }

  // Analytics endpoints (stub — tables don't exist in DB yet)
  async recordInteraction(_interaction: {
    type: 'click' | 'transaction' | 'mining_boost';
    data?: string;
    positionX?: number;
    positionY?: number;
  }) {
    // No-op: analytics tables not in DB
    return null;
  }

  async updateMiningStats(_stats: {
    speedMultiplier: number;
    blocksMinedCount?: number;
    totalClicks?: number;
    averageMiningTime?: number;
    peakSpeedMultiplier?: number;
  }) {
    // No-op: mining_stats table not in DB
    return null;
  }

  async getMiningStats(): Promise<MiningStats | null> {
    return null;
  }

  async getGlobalAnalytics(_hoursAgo = 24) {
    return {
      timeRange: { hours: _hoursAgo, from: '', to: '' },
      interactions: { totalInteractions: 0, uniqueSessions: 0, clickCount: 0, transactionCount: 0, miningBoostCount: 0 },
      mining: { avgSpeedMultiplier: 0, maxSpeedMultiplier: 0, totalBlocksMined: 0, totalClicks: 0, avgMiningTime: 0, activeSessions: 0 },
      activityByHour: []
    };
  }

  async getClickHeatmap(_hoursAgo = 1) {
    return { heatmap: [], timeRange: { hours: _hoursAgo, from: '', to: '' } };
  }

  // Node endpoints (stub — nodes table not in DB)
  async getNetworkStats() {
    return {
      network: { totalNodes: 0, activeNodes: 0, validators: 0, miners: 0, peers: 0, smartContracts: 0, totalConsensusParticipation: 0 },
      topValidators: [],
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const api = new APIService();
