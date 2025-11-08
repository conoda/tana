// Type definitions for the tana:tx virtual module
declare module "tana:tx" {
  export type TransactionChangeType =
    | "transfer"
    | "balance_update"
    | "data_update";

  export interface TransactionChange {
    type: TransactionChangeType;
    from?: string;
    to?: string;
    amount?: number;
    currency?: string;
    key?: string;
    value?: unknown;
  }

  export interface TransactionResult {
    success: boolean;
    changes: TransactionChange[];
    gasUsed: number;
    error?: string;
  }

  interface TransactionModule {
    transfer(
      fromId: string,
      toId: string,
      amount: number,
      currencyCode: string
    ): void;

    setBalance(
      ownerId: string,
      amount: number,
      currencyCode: string
    ): void;

    getChanges(): TransactionChange[];

    execute(): Promise<TransactionResult>;
  }

  export const tx: TransactionModule;
}

declare module "tana/tx" {
  export * from "tana:tx";
}
