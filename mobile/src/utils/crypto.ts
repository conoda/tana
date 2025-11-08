// IMPORTANT: Import polyfill first for React Native crypto support
import "react-native-get-random-values";

import * as Crypto from "expo-crypto";
import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2";
import { concatBytes } from "@noble/hashes/utils";
import { KEY_PREFIX, SIGNATURE_PREFIX } from "../config";

// Configure @noble/ed25519 v2 for React Native (no Node.js crypto available)
ed.etc.sha512Sync = (...m: Uint8Array[]) => sha512(concatBytes(...m));
ed.etc.sha512Async = (...m: Uint8Array[]) => Promise.resolve(ed.etc.sha512Sync!(...m));

const PRIVATE_KEY_BYTES = 32;

export interface GeneratedWallet {
  privateKey: string;
  publicKey: string;
}

export const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

export const fromHex = (hex: string): Uint8Array => {
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string must have an even length");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

const stripPrefix = (value: string): string =>
  value.startsWith(KEY_PREFIX) ? value.slice(KEY_PREFIX.length) : value;

export const normalizePrivateKey = (value: string): string => {
  const trimmed = value.trim();
  const cleaned = stripPrefix(trimmed);
  if (!/^[0-9a-fA-F]+$/.test(cleaned) || cleaned.length !== PRIVATE_KEY_BYTES * 2) {
    throw new Error("Private key must be a 64-character hex string (ed25519)");
  }
  return `${KEY_PREFIX}${cleaned.toLowerCase()}`;
};

export const derivePublicKey = async (privateKey: string): Promise<string> => {
  const raw = stripPrefix(privateKey);
  const privateBytes = fromHex(raw);
  const publicBytes = await ed.getPublicKey(privateBytes);
  return `${KEY_PREFIX}${toHex(publicBytes)}`;
};

export const generateWallet = async (): Promise<GeneratedWallet> => {
  const privateBytes = await Crypto.getRandomBytesAsync(PRIVATE_KEY_BYTES);
  const privateKey = `${KEY_PREFIX}${toHex(privateBytes)}`;
  const publicKey = await derivePublicKey(privateKey);
  return { privateKey, publicKey };
};

export const signMessage = async (
  privateKey: string,
  message: string
): Promise<string> => {
  const raw = stripPrefix(privateKey);
  const privateBytes = fromHex(raw);
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(message);
  const signature = await ed.sign(messageBytes, privateBytes);
  return `${SIGNATURE_PREFIX}${toHex(signature)}`;
};

export const formatPublicKey = (publicKey: string): string => {
  if (!publicKey.startsWith(KEY_PREFIX)) {
    return `${KEY_PREFIX}${publicKey}`;
  }
  return publicKey;
};

export const shortenKey = (value: string, keep: number = 6): string => {
  const raw = stripPrefix(value);
  if (raw.length <= keep * 2) {
    return raw;
  }
  return `${raw.slice(0, keep)}…${raw.slice(-keep)}`;
};

export const equalsPublicKey = (a: string, b: string): boolean =>
  stripPrefix(a).toLowerCase() === stripPrefix(b).toLowerCase();
