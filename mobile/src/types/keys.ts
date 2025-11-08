export interface WalletRecord {
  id: string;
  displayName: string; // Used for both local label and blockchain display name
  publicKey: string;
  username?: string;
  userId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WalletBalance {
  currencyCode: string;
  amount: string;
  updatedAt: string;
}

export interface CreateWalletInput {
  displayName: string;
  username: string;
}

export interface ImportWalletInput {
  displayName: string;
  username: string;
  privateKey: string;
}

export interface LedgerUser {
  id: string;
  username: string;
  displayName?: string;
  publicKey: string;
}

export interface ApprovalChallenge {
  id: string;
  payload: string;
  service?: string;
  action?: string;
  domain?: string;
  issuedAt?: string;
  expiresAt?: string;
}
