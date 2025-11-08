import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import type {
  WalletRecord,
  WalletBalance,
  CreateWalletInput,
  ImportWalletInput,
  ApprovalChallenge
} from "../types/keys";
import { STORAGE_KEYS } from "../config";
import {
  derivePublicKey,
  generateWallet,
  normalizePrivateKey,
  signMessage
} from "../utils/crypto";
import { getBalancesForUser, getUserByUsername, createUser } from "../lib/ledgerApi";

export interface SignedChallenge {
  signature: string;
  message: string;
}

interface KeyStoreContextValue {
  wallets: WalletRecord[];
  walletBalances: Record<string, WalletBalance[]>;
  loading: boolean;
  createWallet: (input: CreateWalletInput) => Promise<WalletRecord>;
  importWallet: (input: ImportWalletInput) => Promise<WalletRecord>;
  removeWallet: (id: string) => Promise<void>;
  exportPrivateKey: (id: string) => Promise<string | null>;
  linkWalletToUsername: (id: string, username: string) => Promise<WalletRecord | null>;
  refreshBalances: (id: string) => Promise<void>;
  signChallenge: (id: string, challenge: ApprovalChallenge) => Promise<SignedChallenge>;
  reload: () => Promise<void>;
}

export const KeyStoreContext = createContext<KeyStoreContextValue | undefined>(
  undefined
);

interface ProviderProps {
  children: React.ReactNode;
}

const makeWalletId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

const persistMetadata = async (wallets: WalletRecord[]) => {
  await AsyncStorage.setItem(STORAGE_KEYS.wallets, JSON.stringify(wallets));
};

const loadMetadata = async (): Promise<WalletRecord[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.wallets);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.warn("Failed to parse wallet metadata", error);
    return [];
  }
};

export const KeyStoreProvider: React.FC<ProviderProps> = ({ children }) => {
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [walletBalances, setWalletBalances] = useState<Record<string, WalletBalance[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await loadMetadata();
      setWallets(stored);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveWallets = useCallback(async (next: WalletRecord[]) => {
    setWallets(next);
    await persistMetadata(next);
  }, []);

  const getPrivateKey = useCallback(async (walletId: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.privateKey(walletId));
    } catch (error) {
      console.warn("Unable to read private key", error);
      return null;
    }
  }, []);

  const setPrivateKey = useCallback(async (walletId: string, value: string) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.privateKey(walletId), value);
  }, []);

  const removePrivateKey = useCallback(async (walletId: string) => {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.privateKey(walletId));
  }, []);

  const attachLedgerUser = useCallback(
    (wallet: WalletRecord, username: string, userId: string): WalletRecord => ({
      ...wallet,
      username,
      userId,
      updatedAt: new Date().toISOString()
    }),
    []
  );

  const createWallet = useCallback(
    async ({ displayName, username }: CreateWalletInput): Promise<WalletRecord> => {
      const { privateKey, publicKey } = await generateWallet();
      const id = makeWalletId();

      // Ensure username starts with @
      const normalizedUsername = username.startsWith('@') ? username : `@${username}`;

      // Try to find existing user first
      let ledgerUser = await getUserByUsername(normalizedUsername);
      let userId: string;

      // If user doesn't exist, create them on blockchain
      if (!ledgerUser) {
        const createResponse = await createUser({
          publicKey,
          username: normalizedUsername,
          displayName: displayName.trim()
        });

        // User creation is async - use the pre-generated userId
        userId = createResponse.userId;
      } else {
        // User already exists - throw error
        throw new Error(`Username ${normalizedUsername} is already taken`);
      }

      const record: WalletRecord = {
        id,
        displayName: displayName.trim(),
        publicKey,
        username: normalizedUsername,
        userId,
        createdAt: new Date().toISOString()
      };

      await setPrivateKey(id, privateKey);
      const next = [...wallets, record];
      await saveWallets(next);
      return record;
    },
    [saveWallets, setPrivateKey, wallets]
  );

  const importWallet = useCallback(
    async ({ displayName, username, privateKey }: ImportWalletInput) => {
      const normalized = normalizePrivateKey(privateKey);
      const publicKey = await derivePublicKey(normalized);
      if (wallets.some((wallet) => wallet.publicKey === publicKey)) {
        throw new Error("Wallet already exists in vault");
      }

      // Ensure username starts with @
      const normalizedUsername = username.startsWith('@') ? username : `@${username}`;

      // Try to find existing user first
      let ledgerUser = await getUserByUsername(normalizedUsername);
      let userId: string;

      // If user doesn't exist, create them on blockchain
      if (!ledgerUser) {
        const createResponse = await createUser({
          publicKey,
          username: normalizedUsername,
          displayName: displayName.trim()
        });

        // User creation is async - use the pre-generated userId
        userId = createResponse.userId;
      } else {
        // User already exists - throw error
        throw new Error(`Username ${normalizedUsername} is already taken`);
      }

      const id = makeWalletId();
      const record: WalletRecord = {
        id,
        displayName: displayName.trim(),
        publicKey,
        username: normalizedUsername,
        userId,
        createdAt: new Date().toISOString()
      };

      await setPrivateKey(id, normalized);
      const next = [...wallets, record];
      await saveWallets(next);
      return record;
    },
    [saveWallets, setPrivateKey, wallets]
  );

  const removeWallet = useCallback(
    async (id: string) => {
      const next = wallets.filter((wallet) => wallet.id !== id);
      await saveWallets(next);
      await removePrivateKey(id);
      setWalletBalances((prev) => {
        const clone = { ...prev };
        delete clone[id];
        return clone;
      });
    },
    [removePrivateKey, saveWallets, wallets]
  );

  const exportPrivateKey = useCallback(
    async (id: string) => {
      const key = await getPrivateKey(id);
      return key ?? null;
    },
    [getPrivateKey]
  );

  const linkWalletToUsername = useCallback(
    async (id: string, username: string) => {
      const ledgerUser = await getUserByUsername(username);
      if (!ledgerUser) {
        return null;
      }
      const next = wallets.map((wallet) =>
        wallet.id === id ? attachLedgerUser(wallet, ledgerUser.username, ledgerUser.id) : wallet
      );
      await saveWallets(next);
      void getBalancesForUser(ledgerUser.id).then((balances) =>
        setWalletBalances((prev) => ({ ...prev, [id]: balances }))
      );
      return next.find((wallet) => wallet.id === id) ?? null;
    },
    [attachLedgerUser, saveWallets, wallets]
  );

  const refreshBalances = useCallback(
    async (id: string) => {
      const target = wallets.find((wallet) => wallet.id === id);
      if (!target || !target.userId) {
        return;
      }
      const balances = await getBalancesForUser(target.userId);
      setWalletBalances((prev) => ({ ...prev, [id]: balances }));
    },
    [wallets]
  );

  useEffect(() => {
    wallets.forEach((wallet) => {
      if (wallet.userId) {
        void refreshBalances(wallet.id);
      }
    });
  }, [wallets, refreshBalances]);

  const signChallenge = useCallback(
    async (id: string, challenge: ApprovalChallenge): Promise<SignedChallenge> => {
      const key = await getPrivateKey(id);
      if (!key) {
        throw new Error("Private key not available");
      }
      const message = challenge.payload ?? JSON.stringify(challenge);
      const signature = await signMessage(key, message);
      return { signature, message };
    },
    [getPrivateKey]
  );

  const value = useMemo<KeyStoreContextValue>(
    () => ({
      wallets,
      walletBalances,
      loading,
      createWallet,
      importWallet,
      removeWallet,
      exportPrivateKey,
      linkWalletToUsername,
      refreshBalances,
      signChallenge,
      reload
    }),
    [
      wallets,
      walletBalances,
      loading,
      createWallet,
      importWallet,
      removeWallet,
      exportPrivateKey,
      linkWalletToUsername,
      refreshBalances,
      signChallenge,
      reload
    ]
  );

  return (
    <KeyStoreContext.Provider value={value}>{children}</KeyStoreContext.Provider>
  );
};
