import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator
} from "react-native";
import useKeyStore from "../hooks/useKeyStore";

type Mode = "generate" | "import";

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

const AddKeyScreen: React.FC<Props> = ({ onComplete, onCancel }) => {
  const { createWallet, importWallet } = useKeyStore();
  const [mode, setMode] = useState<Mode>("generate");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);

  const title = useMemo(
    () =>
      mode === "generate"
        ? "Create new wallet"
        : "Import existing wallet",
    [mode]
  );

  const description = useMemo(
    () =>
      mode === "generate"
        ? "Generate a new Ed25519 keypair and register on the Tana blockchain."
        : "Import an existing private key and register on the blockchain.",
    [mode]
  );

  const resetForm = () => {
    setDisplayName("");
    setUsername("");
    setPrivateKey("");
  };

  const normalizeUsername = (value: string) =>
    value.trim().replace(/^@+/, "").toLowerCase();

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      Alert.alert("Missing name", "Enter your display name.");
      return;
    }

    if (!username.trim()) {
      Alert.alert("Missing username", "Enter a username for the blockchain.");
      return;
    }

    if (mode === "import" && !privateKey.trim()) {
      Alert.alert("Missing private key", "Paste the ed25519 private key to import.");
      return;
    }

    const normalizedUsername = normalizeUsername(username);

    setLoading(true);
    setRegistering(true);

    try {
      if (mode === "generate") {
        await createWallet({
          displayName: displayName.trim(),
          username: normalizedUsername
        });
      } else {
        await importWallet({
          displayName: displayName.trim(),
          username: normalizedUsername,
          privateKey: privateKey.trim()
        });
      }

      Alert.alert(
        "Wallet created!",
        `Registration transaction submitted for @${normalizedUsername}.\n\nYour wallet is saved locally. The blockchain registration will complete when the next block is produced.`,
        [{ text: "OK", onPress: () => {
          resetForm();
          onComplete();
        }}]
      );
    } catch (error: any) {
      setRegistering(false);
      Alert.alert(
        "Error",
        error?.message ?? "Unable to create wallet. Make sure your ledger server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={styles.modeSwitcher}>
        <Pressable
          style={[styles.modeButton, mode === "generate" && styles.modeButtonActive]}
          onPress={() => setMode("generate")}
        >
          <Text
            style={[styles.modeText, mode === "generate" && styles.modeTextActive]}
          >
            Generate
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeButton, mode === "import" && styles.modeButtonActive]}
          onPress={() => setMode("import")}
        >
          <Text style={[styles.modeText, mode === "import" && styles.modeTextActive]}>
            Import
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{description}</Text>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Display name</Text>
            <TextInput
              style={styles.input}
              placeholder="Alice Smith"
              placeholderTextColor="#61798c"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <Text style={styles.helperText}>
              Your public name on the Tana blockchain.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="alice"
              placeholderTextColor="#61798c"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.helperText}>
              Unique username on the blockchain (without @).
            </Text>
          </View>

          {mode === "import" && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Private key</Text>
              <TextInput
                style={[styles.input, styles.privateKeyInput]}
                placeholder="ed25519_..."
                placeholderTextColor="#61798c"
                value={privateKey}
                onChangeText={setPrivateKey}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
              />
              <Text style={styles.helperText}>
                64-character hex string with ed25519_ prefix.
              </Text>
            </View>
          )}
        </View>

        {registering && (
          <View style={styles.statusCard}>
            <ActivityIndicator size="small" color="#efb08d" />
            <Text style={styles.statusText}>
              Registering on blockchain...
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.primaryButton, loading && styles.disabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.primaryText}>
            {loading ? "Creating..." : mode === "generate" ? "Generate & Register" : "Import & Register"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  modeSwitcher: {
    flexDirection: "row",
    backgroundColor: "#0f1c27",
    borderRadius: 16,
    padding: 4,
    marginBottom: 16
  },
  modeButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center"
  },
  modeButtonActive: {
    backgroundColor: "#1f3446"
  },
  modeText: {
    color: "#6f879d",
    fontWeight: "600"
  },
  modeTextActive: {
    color: "#f3f5f9"
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 24
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f3f5f9"
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#829ab2"
  },
  form: {
    marginTop: 16
  },
  fieldGroup: {
    marginBottom: 18
  },
  label: {
    fontSize: 13,
    color: "#7c93a7",
    fontWeight: "600",
    marginBottom: 8
  },
  input: {
    backgroundColor: "#101f2c",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#25384a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#f3f5f9",
    fontSize: 15
  },
  privateKeyInput: {
    minHeight: 100,
    textAlignVertical: "top"
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: "#6b849b"
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a2f42",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12
  },
  statusText: {
    color: "#efb08d",
    fontSize: 14,
    fontWeight: "600"
  },
  actions: {
    flexDirection: "row",
    marginTop: 16
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  cancelButton: {
    marginRight: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2a4257"
  },
  cancelText: {
    color: "#9db5c7",
    fontWeight: "600"
  },
  primaryButton: {
    marginLeft: 8,
    backgroundColor: "#efb08d"
  },
  primaryText: {
    color: "#091c2a",
    fontWeight: "700"
  },
  disabled: {
    opacity: 0.7
  }
});

export default AddKeyScreen;
