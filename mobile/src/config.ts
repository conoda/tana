import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

export const LEDGER_API_URL: string =
  typeof extra.ledgerApiUrl === "string" && extra.ledgerApiUrl.length > 0
    ? extra.ledgerApiUrl
    : "http://localhost:8080";

export const KEY_PREFIX = "ed25519_";
export const SIGNATURE_PREFIX = "ed25519_sig_";

export const STORAGE_KEYS = {
  wallets: "tana_mobile_wallets",
  privateKey: (id: string) => `tana_mobile_private_${id}`
};
