// Type definitions for the tana:block virtual module
declare module "tana:block" {
  export interface BlockUser {
    id: string;
    username: string;
    displayName: string;
    publicKey: string;
    createdAt: string;
    bio?: string | null;
    metadata?: Record<string, unknown> | null;
  }

  export interface BalanceEntry {
    ownerId: string;
    ownerType: "user" | "team";
    currencyCode: string;
    amount: string;
    updatedAt: string;
  }

  export type TransactionType =
    | "transfer"
    | "deposit"
    | "withdrawal"
    | "contract_call"
    | "user_creation"
    | "contract_deployment";

  export type TransactionStatus = "pending" | "confirmed" | "failed";

  export interface TransactionRecord {
    id: string;
    fromId: string | null;
    toId: string | null;
    amount: string;
    currencyCode: string;
    type: TransactionType;
    status: TransactionStatus;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    blockId?: string | null;
  }

  export interface BlockInfo {
    height: number;
    hash: string;
    previousHash: string | null;
    timestamp: number;
    producer: string;
    gasLimit: number;
    gasUsed: number;
    stateRoot: string;
    txCount: number;
    metadata?: Record<string, unknown> | null;
  }

  interface BlockModule {
    readonly height: number;
    readonly timestamp: number;
    readonly hash: string;
    readonly previousHash: string | null;
    readonly executor: string;
    readonly contractId: string | null;
    readonly gasLimit: number;
    readonly gasUsed: number;
    readonly MAX_BATCH_QUERY: 10;

    getBalance(userId: string, currencyCode: string): Promise<number>;
    getBalance(userIds: string[], currencyCode: string): Promise<number[]>;

    getUser(userId: string): Promise<BlockUser | null>;
    getUser(userIds: string[]): Promise<(BlockUser | null)[]>;

    getTransaction(txId: string): Promise<TransactionRecord | null>;
    getTransaction(txIds: string[]): Promise<(TransactionRecord | null)[]>;

    getBlock(height: number): Promise<BlockInfo | null>;
    getBlock(heights: number[]): Promise<(BlockInfo | null)[]>;

    getLatestBlock(): Promise<BlockInfo | null>;
  }

  export const block: BlockModule;
}

declare module "tana/block" {
  export * from "tana:block";
}
