// API Service for backend communication

const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:43251/api"
  : "/api"; // Use relative path for same-origin requests

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
  status: "pending" | "confirmed" | "failed";
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

class APIService {
  private sessionId: string;

  constructor() {
    this.sessionId = this.getSessionId();
  }

  private getSessionId(): string {
    // localStorage (not sessionStorage) so the derived miner address — and
    // the Explorer's "You" highlight — survives new tabs and return visits.
    let sessionId = localStorage.getItem("minerSessionId");
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("minerSessionId", sessionId);
    }
    return sessionId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
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
      `/blockchain/blocks?${params}`,
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
    }>("/blockchain/stats");
  }

  // Submit visitor-mined blocks to the shared chain. The server assigns the
  // real height and links each block to the current tip.
  async submitMinedBlocks(
    blocks: Array<{
      hash: string;
      minerAddress: string;
      transactionCount?: number;
      difficulty?: number;
      nonce?: number;
    }>,
  ) {
    return this.request<{ inserted: number }>("/blockchain/blocks", {
      method: "POST",
      body: JSON.stringify({ blocks }),
    });
  }

  // Stable per-session miner address so visitors can spot their own blocks
  getMyMinerAddress(): string {
    const tail = this.sessionId.replace(/[^a-z0-9]/gi, "").slice(-10);
    return `0xstu${tail}`;
  }

  // Transaction endpoints
  async getTransactions(limit = 20, offset = 0, status?: string) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (status) params.append("status", status);

    return this.request<{ transactions: Transaction[]; count: number }>(
      `/transactions?${params}`,
    );
  }

  async getTransaction(hash: string) {
    return this.request<Transaction>(`/transactions/${hash}`);
  }

  async getMempool() {
    return this.request<{ mempool: Transaction[]; count: number }>(
      "/transactions/mempool/pending",
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
    }>("/transactions/stats/summary");
  }
}

// Export singleton instance
export const api = new APIService();
