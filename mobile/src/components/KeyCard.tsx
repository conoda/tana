import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { WalletRecord, WalletBalance } from "../types/keys";
import { shortenKey } from "../utils/crypto";

interface Props {
  wallet: WalletRecord;
  balances?: WalletBalance[];
  selected?: boolean;
  onPress?: () => void;
  onRemove?: (id: string) => void;
}

const getPrimaryBalance = (balances?: WalletBalance[]) => {
  if (!balances || balances.length === 0) {
    return null;
  }
  return balances[0];
};

const KeyCard: React.FC<Props> = ({
  wallet,
  balances,
  selected = false,
  onPress,
  onRemove
}) => {
  const primaryBalance = getPrimaryBalance(balances);
  const username = wallet.username ? `@${wallet.username}` : undefined;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>{wallet.displayName}</Text>
          {username ? <Text style={styles.subtext}>{username}</Text> : null}
        </View>
        {onRemove ? (
          <Pressable
            onPress={() => onRemove(wallet.id)}
            style={styles.deleteButton}
            accessibilityRole="button"
            hitSlop={8}
          >
            <MaterialIcons name="delete-outline" size={18} color="#f69478" />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.keyLabel}>Public key</Text>
        <Text style={styles.keyValue}>{shortenKey(wallet.publicKey, 8)}</Text>
      </View>

      {primaryBalance ? (
        <View style={styles.balanceRow}>
          <Text style={styles.balanceAmount}>{primaryBalance.amount}</Text>
          <Text style={styles.balanceCurrency}>{primaryBalance.currencyCode}</Text>
        </View>
      ) : (
        <Text style={styles.emptyBalance}>Balances unavailable</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#132330",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#182b3a"
  },
  cardSelected: {
    borderColor: "#355b76",
    backgroundColor: "#12283a"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  label: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f3f5f9"
  },
  subtext: {
    marginTop: 2,
    fontSize: 13,
    color: "#8ea7bc"
  },
  deleteButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: "rgba(246, 148, 120, 0.12)"
  },
  body: {
    marginBottom: 12
  },
  keyLabel: {
    fontSize: 12,
    color: "#6c879d",
    marginBottom: 4
  },
  keyValue: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    color: "#d9e5f2",
    fontSize: 15,
    letterSpacing: 0.5
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#efb08d"
  },
  balanceCurrency: {
    fontSize: 13,
    color: "#9bb0c3"
  },
  emptyBalance: {
    fontSize: 13,
    color: "#6c879d"
  }
});

export default KeyCard;
