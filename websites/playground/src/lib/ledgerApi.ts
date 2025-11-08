/**
 * Ledger API Client
 * Fetches blockchain state from the local ledger service
 */

const LEDGER_API_URL = import.meta.env.PUBLIC_LEDGER_API_URL || 'http://localhost:8080';

export interface User {
  id: string;
  publicKey: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarData: string | null;
  avatarHash: string | null;
  landingPageId: string | null;
  stateHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface Balance {
  id: string;
  ownerId: string;
  ownerType: 'user' | 'team';
  currencyCode: string;
  amount: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: string | null;
  currencyCode: string | null;
  type: string;
  contractId?: string | null;
  contractInput?: any;
  status: string;
  blockHeight: number | null;
  signature: string;
  createdAt: string;
  confirmedAt: string | null;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  type: 'fiat' | 'crypto';
}

export interface BlockchainState {
  users: User[];
  balances: Balance[];
  transactions: Transaction[];
  currencies: Currency[];
  lastUpdated: string;
  blockHeight?: number;
}

export class LedgerApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = LEDGER_API_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`Ledger API error: ${response.statusText}`);
    }
    return response.json();
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async getUserBalances(userId: string): Promise<Balance[]> {
    return this.request<Balance[]>(`/users/${userId}/balances`);
  }

  async getAllBalances(): Promise<Balance[]> {
    return this.request<Balance[]>('/balances');
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.request<Transaction[]>('/transactions');
  }

  async getCurrencies(): Promise<Currency[]> {
    return this.request<Currency[]>('/balances/currencies');
  }

  async getHealth(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }

  /**
   * Get complete blockchain state snapshot
   */
  async getBlockchainState(): Promise<BlockchainState> {
    try {
      const [users, balances, transactions, currencies] = await Promise.all([
        this.getUsers(),
        this.getAllBalances(),
        this.getTransactions(),
        this.getCurrencies(),
      ]);

      return {
        users,
        balances,
        transactions,
        currencies,
        lastUpdated: new Date().toISOString(),
        blockHeight: 0, // TODO: Get from actual blockchain when implemented
      };
    } catch (error) {
      console.error('Failed to fetch blockchain state:', error);
      // Return empty state if ledger is not available
      return {
        users: [],
        balances: [],
        transactions: [],
        currencies: [],
        lastUpdated: new Date().toISOString(),
        blockHeight: 0,
      };
    }
  }
}

// Export singleton instance
export const ledgerApi = new LedgerApiClient();
