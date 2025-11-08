import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform
} from "react-native";
import * as Clipboard from "expo-clipboard";
import KeyCard from "../components/KeyCard";
import useKeyStore from "../hooks/useKeyStore";
import type { WalletRecord, WalletBalance } from "../types/keys";

interface Props {
  onAddKey: () => void;
  onApprove: () => void;
}

interface WalletDetailProps {
  wallet: WalletRecord;
  balances?: WalletBalance[];
  onRefreshBalances: () => Promise<void>;
  onExportPrivateKey: () => Promise<void>;
  onLinkUsername: (username: string) => Promise<void>;
  onRemoveWallet: () => Promise<void>;
}

const WalletDetail: React.FC<WalletDetailProps> = ({
  wallet,
  balances,
  onRefreshBalances,
  onExportPrivateKey,
  onLinkUsername,
  onRemoveWallet
}) => {
  const [usernameDraft, setUsernameDraft] = useState<string>(wallet.username ?? "");
  const [linking, setLinking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setUsernameDraft(wallet.username ?? "");
  }, [wallet.username]);

  const handleCopyPublicKey = async () => {
    await Clipboard.setStringAsync(wallet.publicKey);
    Alert.alert("Copied", "Public key copied to clipboard.");
  };

  const handleExport = async () => {
    await onExportPrivateKey();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefreshBalances();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLinkUsername = async () => {
    if (!usernameDraft.trim()) {
      Alert.alert("Username required", "Enter a ledger username to link.");
      return;
    }
    setLinking(true);
    try {
      await onLinkUsername(usernameDraft.trim());
    } catch (error: any) {
      Alert.alert("Unable to link", error?.message ?? "Unknown error");
    } finally {
      setLinking(false);
    }
  };

  const handleRemove = async () => {
    Alert.alert(
      "Remove wallet",
      "This will delete the wallet from this device. Make sure you have exported the private key before continuing.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void onRemoveWallet();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.detailCard}>
      <Text style={styles.detailTitle}>{wallet.displayName}</Text>
      <Text style={styles.detailSubtitle}>
        {wallet.username ? `Linked to @${wallet.username}` : "Not linked to a ledger user"}
      </Text>

      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>Public key</Text>
        <Text style={styles.detailValue}>{wallet.publicKey}</Text>
        <View style={styles.detailActionsRow}>
          <Pressable style={styles.actionButton} onPress={handleCopyPublicKey}>
            <Text style={styles.actionButtonText}>Copy</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleExport}>
            <Text style={styles.actionButtonText}>Export private key</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, refreshing && styles.actionButtonDisabled]}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Text style={styles.actionButtonText}>
              {refreshing ? "Refreshing…" : "Refresh balances"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>Ledger username</Text>
        <View style={styles.usernameRow}>
          <TextInput
            style={styles.usernameInput}
            placeholder="@alice"
            placeholderTextColor="#5f7a90"
            autoCapitalize="none"
            value={usernameDraft}
            onChangeText={setUsernameDraft}
          />
          <Pressable
            style={[styles.linkButton, linking && styles.actionButtonDisabled]}
            onPress={handleLinkUsername}
            disabled={linking}
          >
            <Text style={styles.linkButtonText}>{linking ? "Linking…" : "Link"}</Text>
          </Pressable>
        </View>
        <Text style={styles.helperText}>
          Linking lets the wallet pull balances from the ledger for this account.
        </Text>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>Balances</Text>
        {balances && balances.length > 0 ? (
          balances.map((balance) => (
            <View key={`${balance.currencyCode}-${balance.updatedAt}`} style={styles.balanceItem}>
              <Text style={styles.balanceAmount}>{balance.amount}</Text>
              <Text style={styles.balanceCurrency}>{balance.currencyCode}</Text>
              <Text style={styles.balanceUpdated}>
                Updated {new Date(balance.updatedAt).toLocaleString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.helperText}>
            {wallet.userId
              ? "No balances reported for this account."
              : "Link a username to view balances from the ledger."}
          </Text>
        )}
      </View>

      <Pressable style={styles.dangerButton} onPress={handleRemove}>
        <Text style={styles.dangerButtonText}>Remove wallet</Text>
      </Pressable>
    </View>
  );
};

const VaultScreen: React.FC<Props> = ({ onAddKey, onApprove }) => {
  const {
    wallets,
    walletBalances,
    loading,
    removeWallet,
    refreshBalances,
    exportPrivateKey,
    linkWalletToUsername
  } = useKeyStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (wallets.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId) {
      setSelectedId(wallets[0].id);
      return;
    }
    const stillExists = wallets.some((wallet) => wallet.id === selectedId);
    if (!stillExists) {
      setSelectedId(wallets[0].id);
    }
  }, [selectedId, wallets]);

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === selectedId) ?? null,
    [selectedId, wallets]
  );

  const handleExport = async (walletId: string) => {
    const key = await exportPrivateKey(walletId);
    if (!key) {
      Alert.alert("Export failed", "The private key could not be retrieved.");
      return;
    }
    await Clipboard.setStringAsync(key);
    Alert.alert(
      "Private key copied",
      "Your private key has been copied to the clipboard. Store it securely."
    );
  };

  const handleRefresh = async (walletId: string) => {
    await refreshBalances(walletId);
  };

  const handleLinkUsername = async (walletId: string, username: string) => {
    const linked = await linkWalletToUsername(walletId, username);
    if (!linked) {
      throw new Error("User not found on ledger");
    }
    Alert.alert("Linked", `Wallet connected to @${linked.username}.`);
  };

  const handleRemoveWallet = async (walletId: string) => {
    await removeWallet(walletId);
  };

  const confirmRemoveWallet = (walletId: string) => {
    const wallet = wallets.find((item) => item.id === walletId);
    Alert.alert(
      "Remove wallet",
      `This will delete "${wallet?.displayName ?? "wallet"}" from this device. Export the private key first if you plan to restore it later.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void handleRemoveWallet(walletId);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.ctaRow}>
        <Pressable style={styles.primaryButton} onPress={onAddKey}>
          <Text style={styles.primaryButtonText}>Add wallet</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onApprove}>
          <Text style={styles.secondaryButtonText}>Approve request</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Wallets on this device</Text>
        <Text style={styles.sectionSubtitle}>
          Keys stay on device. Export and back them up before removing.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color="#efb08d" />
          <Text style={styles.loadingText}>Loading wallets…</Text>
        </View>
      ) : wallets.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No wallets yet</Text>
          <Text style={styles.emptySubtitle}>
            Generate a new wallet or import your existing private key.
          </Text>
        </View>
      ) : (
        <View style={styles.listAndDetail}>
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {wallets.map((wallet) => (
              <KeyCard
                key={wallet.id}
                wallet={wallet}
                balances={walletBalances[wallet.id]}
                selected={wallet.id === selectedId}
                onPress={() => setSelectedId(wallet.id)}
                onRemove={confirmRemoveWallet}
              />
            ))}
          </ScrollView>
          {selectedWallet ? (
            <ScrollView
              style={styles.detailContainer}
              contentContainerStyle={styles.detailContent}
              showsVerticalScrollIndicator={false}
            >
              <WalletDetail
                wallet={selectedWallet}
                balances={walletBalances[selectedWallet.id]}
                onRefreshBalances={() => handleRefresh(selectedWallet.id)}
                onExportPrivateKey={() => handleExport(selectedWallet.id)}
                onLinkUsername={(username) => handleLinkUsername(selectedWallet.id, username)}
                onRemoveWallet={() => handleRemoveWallet(selectedWallet.id)}
              />
            </ScrollView>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  ctaRow: {
    flexDirection: "row",
    marginBottom: 16
  },
  primaryButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#efb08d",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  primaryButtonText: {
    color: "#09202f",
    fontWeight: "700",
    fontSize: 14
  },
  secondaryButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#274155",
    paddingVertical: 12,
    alignItems: "center"
  },
  secondaryButtonText: {
    color: "#9db5c7",
    fontWeight: "600",
    fontSize: 14
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f3f5f9"
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6d879d"
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  loadingText: {
    marginTop: 8,
    color: "#9db5c7",
    fontSize: 13
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f3f5f9"
  },
  emptySubtitle: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 13,
    color: "#7e95a8"
  },
  listAndDetail: {
    flex: 1,
    flexDirection: "row",
    gap: 16
  },
  listContainer: {
    flex: 1
  },
  list: {
    paddingBottom: 16
  },
  detailContainer: {
    flex: 1
  },
  detailContent: {
    paddingBottom: 24
  },
  detailCard: {
    backgroundColor: "#132330",
    borderRadius: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#203447"
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f3f5f9"
  },
  detailSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#8aa1b6"
  },
  detailSection: {
    marginTop: 16
  },
  detailLabel: {
    fontSize: 13,
    color: "#6d879d",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6
  },
  detailValue: {
    fontSize: 14,
    color: "#dbe7f3",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" })
  },
  detailActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#30506b"
  },
  actionButtonText: {
    color: "#f3f5f9",
    fontSize: 13,
    fontWeight: "600"
  },
  actionButtonDisabled: {
    opacity: 0.6
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  usernameInput: {
    flex: 1,
    backgroundColor: "#0e1d29",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#264259",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f3f5f9",
    fontSize: 14
  },
  linkButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#1f3446"
  },
  linkButtonText: {
    color: "#f3f5f9",
    fontWeight: "600"
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: "#6a8299"
  },
  balanceItem: {
    backgroundColor: "#0e1d29",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#efb08d"
  },
  balanceCurrency: {
    fontSize: 13,
    color: "#9db5c7"
  },
  balanceUpdated: {
    marginTop: 4,
    fontSize: 11,
    color: "#637a8f"
  },
  dangerButton: {
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "rgba(246, 148, 120, 0.12)",
    borderRadius: 12,
    paddingVertical: 12
  },
  dangerButtonText: {
    color: "#f69478",
    fontWeight: "700"
  }
});

export default VaultScreen;
