import { LEDGER_API_URL } from "../config";
import type { LedgerUser, WalletBalance } from "../types/keys";

const withBase = (path: string) =>
  `${LEDGER_API_URL.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;

const HTTP_TIMEOUT = 10_000;

const fetchJson = async <T>(
  input: string,
  init?: Parameters<typeof fetch>[1]
): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HTTP_TIMEOUT);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    if (!response.ok) {
      // Try to get error details from response body
      let errorMessage = `Ledger request failed (${response.status})`;
      try {
        const errorBody = await response.json();
        if (errorBody.error) {
          errorMessage = errorBody.error;
        }
      } catch {
        // Ignore JSON parse errors
      }
      const error: any = new Error(errorMessage);
      error.status = response.status;
      error.response = response;
      throw error;
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
};

export const getUserByUsername = async (
  username: string
): Promise<LedgerUser | null> => {
  const cleaned = username.startsWith("@") ? username.slice(1) : username;
  if (!cleaned) {
    return null;
  }
  try {
    return await fetchJson<LedgerUser>(
      withBase(`/users/username/${encodeURIComponent(cleaned)}`)
    );
  } catch (error: any) {
    // 404 is expected when user doesn't exist - not an error
    if (error.status === 404) {
      return null;
    }
    // Other errors should be logged
    console.warn("Ledger user lookup failed", error);
    throw error; // Re-throw for unexpected errors
  }
};

export const getBalancesForUser = async (
  userId: string
): Promise<WalletBalance[]> => {
  try {
    return await fetchJson<WalletBalance[]>(
      withBase(`/users/${encodeURIComponent(userId)}/balances`)
    );
  } catch (error: any) {
    // 404 means user has no balances - return empty array
    if (error.status === 404) {
      return [];
    }
    console.warn("Ledger balance fetch failed", error);
    return [];
  }
};

export interface CreateUserInput {
  publicKey: string;
  username: string; // Must start with @
  displayName: string;
  bio?: string;
  avatarData?: string;
}

export interface CreateUserResponse {
  transactionId: string;
  userId: string;
  status: string;
  message: string;
}

export const createUser = async (
  input: CreateUserInput
): Promise<CreateUserResponse> => {
  const url = withBase("/users");
  const body = JSON.stringify(input);
  console.log("Creating user:", { url, input });

  return await fetchJson<CreateUserResponse>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });
};

export const getUserByPublicKey = async (
  publicKey: string
): Promise<LedgerUser | null> => {
  try {
    // The API doesn't have a direct publicKey lookup, so we need to list users
    // and filter. For now, return null and rely on username lookup.
    // TODO: Add GET /users/publicKey/:publicKey endpoint to ledger API
    return null;
  } catch (error) {
    console.warn("Public key lookup failed", error);
    return null;
  }
};
