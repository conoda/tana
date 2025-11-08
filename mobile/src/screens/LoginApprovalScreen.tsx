import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
  Platform
} from "react-native";
import * as Clipboard from "expo-clipboard";
import useKeyStore from "../hooks/useKeyStore";
import type { ApprovalChallenge, WalletRecord } from "../types/keys";
import { shortenKey } from "../utils/crypto";

interface Props {
  onDone: () => void;
}

const SAMPLE_CHALLENGE: ApprovalChallenge = {
  id: "challenge_demo",
  service: "tana.network",
  action: "login",
  payload: JSON.stringify(
    {
      nonce: "123456",
      domain: "tana.network",
      timestamp: new Date().toISOString()
    },
    null,
    2
  )
};

const challengeToString = (challenge: ApprovalChallenge) =>
  JSON.stringify(challenge, null, 2);

const parseChallenge = (input: string): ApprovalChallenge | null => {
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    if (!parsed.payload || typeof parsed.payload !== "string") {
      return null;
    }
    return {
      id: typeof parsed.id === "string" ? parsed.id : "unknown",
      service: typeof parsed.service === "string" ? parsed.service : undefined,
      action: typeof parsed.action === "string" ? parsed.action : undefined,
      domain: typeof parsed.domain === "string" ? parsed.domain : undefined,
      payload: parsed.payload,
      issuedAt: typeof parsed.issuedAt === "string" ? parsed.issuedAt : undefined,
      expiresAt: typeof parsed.expiresAt === "string" ? parsed.expiresAt : undefined
    };
  } catch (error) {
    console.warn("Failed to parse challenge", error);
    return null;
  }
};

const LoginApprovalScreen: React.FC<Props> = ({ onDone }) => {
  const { wallets, signChallenge } = useKeyStore();
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [challengeInput, setChallengeInput] = useState<string>(() =>
    challengeToString(SAMPLE_CHALLENGE)
  );
  const [serializedSignature, setSerializedSignature] = useState<string | null>(null);
  const [signedMessage, setSignedMessage] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(wallets[0].id);
    }
  }, [selectedWalletId, wallets]);

  const selectedWallet = useMemo<WalletRecord | null>(
    () => wallets.find((wallet) => wallet.id === selectedWalletId) ?? null,
    [selectedWalletId, wallets]
  );

  const parsedChallenge = useMemo(
    () => parseChallenge(challengeInput),
    [challengeInput]
  );

  const handleSign = async () => {
    if (!selectedWallet) {
      Alert.alert("Select a wallet", "Choose a wallet to sign with.");
      return;
    }
    if (!parsedChallenge) {
      Alert.alert("Invalid challenge", "Paste a valid challenge payload to sign.");
      return;
    }
    setSigning(true);
    try {
      const result = await signChallenge(selectedWallet.id, parsedChallenge);
      setSerializedSignature(result.signature);
      setSignedMessage(result.message);
      Alert.alert("Challenge signed", "Signature ready to send back to the requester.");
    } catch (error: any) {
      Alert.alert(
        "Signing failed",
        error?.message ?? "Unable to sign the challenge with this wallet."
      );
    } finally {
      setSigning(false);
    }
  };

  const handleCopySignature = async () => {
    if (!serializedSignature) {
      return;
    }
    await Clipboard.setStringAsync(serializedSignature);
    Alert.alert("Copied", "Signature copied to clipboard.");
  };

  const handleSimulate = () => {
    setChallengeInput(challengeToString(SAMPLE_CHALLENGE));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Approve external request</Text>
      <Text style={styles.subtitle}>
        Scan a QR code or paste a challenge payload below. The wallet signs the payload and
        returns a signature the requesting service can verify.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. Challenge payload</Text>
        <Text style={styles.cardDescription}>
          Replace this sample with the payload from the QR code or deeplink request.
        </Text>
        <TextInput
          style={styles.challengeInput}
          value={challengeInput}
          onChangeText={setChallengeInput}
          placeholder="Paste JSON challenge"
          placeholderTextColor="#4d647a"
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.cardActions}>
          <Pressable style={styles.secondaryButton} onPress={handleSimulate}>
            <Text style={styles.secondaryButtonText}>Load sample</Text>
          </Pressable>
        </View>
        {parsedChallenge ? (
          <View style={styles.challengeMeta}>
            <Text style={styles.challengeMetaTitle}>Preview</Text>
            <Text style={styles.challengeMetaText}>
              ID: {parsedChallenge.id ?? "unknown"}{"\n"}
              Service: {parsedChallenge.service ?? "unknown"}{"\n"}
              Action: {parsedChallenge.action ?? "unknown"}
            </Text>
          </View>
        ) : (
          <Text style={styles.helperText}>
            Paste a JSON object with at least a string `payload` property.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>2. Select signing wallet</Text>
        {wallets.length === 0 ? (
          <Text style={styles.helperText}>Add a wallet in the vault first.</Text>
        ) : (
          <View style={styles.walletList}>
            {wallets.map((wallet) => {
              const active = wallet.id === selectedWalletId;
              return (
                <Pressable
                  key={wallet.id}
                  style={[styles.walletButton, active && styles.walletButtonActive]}
                  onPress={() => setSelectedWalletId(wallet.id)}
                >
                  <Text
                    style={[
                      styles.walletLabel,
                      active && styles.walletLabelActive
                    ]}
                  >
                    {wallet.displayName}
                  </Text>
                  <Text style={styles.walletKey}>{shortenKey(wallet.publicKey, 6)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>3. Review & sign</Text>
        <Text style={styles.cardDescription}>
          Signing produces an Ed25519 signature that the requesting service can validate.
        </Text>
        {parsedChallenge ? (
          <View style={styles.payloadPreview}>
            <Text style={styles.payloadTitle}>Payload</Text>
            <Text style={styles.payloadText}>{parsedChallenge.payload}</Text>
          </View>
        ) : null}
        <Pressable
          style={[styles.primaryButton, (signing || !parsedChallenge) && styles.primaryButtonDisabled]}
          onPress={handleSign}
          disabled={signing || !parsedChallenge}
        >
          <Text style={styles.primaryButtonText}>
            {signing ? "Signing…" : "Sign challenge"}
          </Text>
        </Pressable>
      </View>

      {serializedSignature ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Signature</Text>
          <Text style={styles.helperText}>
            Send this signature and the original payload back to the requesting service.
          </Text>
          <Text style={styles.signatureText}>{serializedSignature}</Text>
          {signedMessage ? (
            <View style={styles.payloadPreview}>
              <Text style={styles.payloadTitle}>Signed message</Text>
              <Text style={styles.payloadText}>{signedMessage}</Text>
            </View>
          ) : null}
          <View style={styles.cardActions}>
            <Pressable style={styles.secondaryButton} onPress={handleCopySignature}>
              <Text style={styles.secondaryButtonText}>Copy signature</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                setSerializedSignature(null);
                setSignedMessage(null);
                onDone();
              }}
            >
              <Text style={styles.secondaryButtonText}>Finish</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    paddingBottom: 24
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f3f5f9",
    marginBottom: 6
  },
  subtitle: {
    fontSize: 13,
    color: "#7f96aa",
    marginBottom: 16
  },
  card: {
    backgroundColor: "#132330",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#203447"
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f3f5f9",
    marginBottom: 8
  },
  cardDescription: {
    fontSize: 13,
    color: "#8ba3b9",
    marginBottom: 12
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12
  },
  challengeInput: {
    backgroundColor: "#0e1d29",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#274157",
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: "#f3f5f9",
    minHeight: 140,
    textAlignVertical: "top",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 13
  },
  helperText: {
    fontSize: 12,
    color: "#6d879d"
  },
  challengeMeta: {
    marginTop: 12,
    backgroundColor: "#0e1d29",
    borderRadius: 10,
    padding: 12
  },
  challengeMetaTitle: {
    fontWeight: "600",
    color: "#f3f5f9",
    marginBottom: 6
  },
  challengeMetaText: {
    color: "#8ea6ba",
    fontSize: 12
  },
  walletList: {
    gap: 10
  },
  walletButton: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#294157",
    padding: 12
  },
  walletButtonActive: {
    backgroundColor: "#21415a",
    borderColor: "#3b5e7a"
  },
  walletLabel: {
    color: "#f3f5f9",
    fontWeight: "600",
    fontSize: 15
  },
  walletLabelActive: {
    color: "#fbd5b8"
  },
  walletKey: {
    color: "#8099af",
    fontSize: 12,
    marginTop: 2
  },
  payloadPreview: {
    backgroundColor: "#0e1d29",
    borderRadius: 10,
    padding: 12,
    marginVertical: 12
  },
  payloadTitle: {
    color: "#f3f5f9",
    fontWeight: "600",
    marginBottom: 6
  },
  payloadText: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 12,
    color: "#9db5c7"
  },
  primaryButton: {
    backgroundColor: "#efb08d",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  primaryButtonDisabled: {
    opacity: 0.6
  },
  primaryButtonText: {
    color: "#09202f",
    fontWeight: "700",
    fontSize: 15
  },
  secondaryButton: {
    backgroundColor: "#1f3446",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16
  },
  secondaryButtonText: {
    color: "#f3f5f9",
    fontWeight: "600"
  },
  signatureText: {
    marginTop: 12,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 13,
    color: "#efb08d"
  }
});

export default LoginApprovalScreen;
