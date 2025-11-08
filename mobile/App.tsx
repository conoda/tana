// IMPORTANT: Polyfill must be imported first for crypto support
import "react-native-get-random-values";

import React, { useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet
} from "react-native";
import Constants from "expo-constants";
import { KeyStoreProvider } from "./src/contexts/KeyStoreContext";
import VaultScreen from "./src/screens/VaultScreen";
import AddKeyScreen from "./src/screens/AddKeyScreen";
import LoginApprovalScreen from "./src/screens/LoginApprovalScreen";

type Screen = "vault" | "add" | "approval";

const NAV_ITEMS: Array<{ key: Screen; label: string }> = [
  { key: "vault", label: "Vault" },
  { key: "add", label: "Add Wallet" },
  { key: "approval", label: "Approve" }
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("vault");

  const screenComponent = useMemo(() => {
    switch (screen) {
      case "add":
        return (
          <AddKeyScreen
            onComplete={() => setScreen("vault")}
            onCancel={() => setScreen("vault")}
          />
        );
      case "approval":
        return <LoginApprovalScreen onDone={() => setScreen("vault")} />;
      case "vault":
      default:
        return (
          <VaultScreen
            onAddKey={() => setScreen("add")}
            onApprove={() => setScreen("approval")}
          />
        );
    }
  }, [screen]);

  return (
    <KeyStoreProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Tana Mobile</Text>
            <Text style={styles.subtitle}>
              Generate wallets, view balances, and approve requests securely.
            </Text>
          </View>
          <View style={styles.content}>{screenComponent}</View>
          <View style={styles.navBar}>
            {NAV_ITEMS.map((item) => {
              const active = item.key === screen;
              return (
                <Pressable
                  key={item.key}
                  style={[styles.navButton, active && styles.navButtonActive]}
                  onPress={() => setScreen(item.key)}
                >
                  <Text
                    style={[styles.navButtonText, active && styles.navButtonTextActive]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    </KeyStoreProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#040b11"
  },
  container: {
    flex: 1,
    paddingTop: Constants.statusBarHeight > 0 ? Constants.statusBarHeight / 3 : 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#040b11"
  },
  header: {
    paddingVertical: 12
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f3f5f9"
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#88a0b5"
  },
  content: {
    flex: 1,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#0d1720",
    padding: 16
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#0d1720",
    borderRadius: 20,
    padding: 8
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 16
  },
  navButtonActive: {
    backgroundColor: "#1d2f3f"
  },
  navButtonText: {
    color: "#7f94a6",
    fontSize: 14,
    fontWeight: "600"
  },
  navButtonTextActive: {
    color: "#f3f5f9"
  }
});
