# Tana Mobile MVP

Expo React Native application that focuses on secure wallet storage, balance visibility, and signing approvals for the Tana ecosystem.

## Goals

- Store and manage Ed25519 wallet keys entirely on-device (secure storage).
- Display current ledger balances after linking a wallet to a user account.
- Authorize external requests (web, CLI, etc.) by signing challenge payloads (QR/manual).

## Getting Started

```bash
cd mobile
npm install    # or bun install / pnpm install
npm run start  # opens Expo Dev Tools
```

Use `npm run ios` / `npm run android` / `npm run web` to launch directly on a platform.

### Environment Configuration

**By default, the app connects to your local development server at `http://localhost:8080`.**

Make sure your local ledger service is running before starting the app:

```bash
# Start the app (defaults to localhost:8080)
npm start
```

Then press `i` for iOS simulator or `a` for Android emulator.

**To connect to production instead:**

```bash
# Option 1: Use the convenience script
npm run start:prod

# Option 2: Set LEDGER_API_URL manually
LEDGER_API_URL=https://blockchain.tana.network npm start
```

> **Note:** This folder is self-contained. No files outside `mobile/` were touched so that concurrent work in other packages remains unaffected.

## Troubleshooting

### White Screen on Launch

If you see a white screen, ensure all dependencies are installed:

```bash
npx expo-doctor  # Check for issues
npx expo install --fix  # Fix package versions
```

Common fixes:
- Install `expo-font`: `npx expo install expo-font` (required by @expo/vector-icons)
- Remove `@types/react-native` if installed (types are included with react-native)

### Xcode Version

Expo SDK 51 requires Xcode ≤16.2.0. If you have Xcode 26+, you may need to:
- Downgrade Xcode for iOS builds
- Use Expo Go app for testing instead of building locally

## Project Structure

```
mobile/
├── App.tsx                     # Entry point with simple navigation
├── app.config.js               # Expo configuration + environment variables
├── babel.config.js             # Babel preset for Expo
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript configuration
└── src/
    ├── components/
    │   └── KeyCard.tsx         # Wallet summary row (label, key, balance preview)
    ├── contexts/
    │   └── KeyStoreContext.tsx # Wallet vault + secure storage + ledger integration
    ├── hooks/
    │   └── useKeyStore.ts      # Convenience hook for the context
    ├── lib/
    │   └── ledgerApi.ts        # Minimal REST helpers for the ledger service
    ├── screens/
    │   ├── AddKeyScreen.tsx    # Generate/import wallets
    │   ├── LoginApprovalScreen.tsx # Challenge signing workflow
    │   └── VaultScreen.tsx     # Wallet list, balances, username linking
    ├── utils/
    │   └── crypto.ts           # Ed25519 helpers (generate, sign, format)
    └── types/
        └── keys.ts             # Shared domain types
```

## Key Management Flow

1. **Vault screen** lists wallets, allows copying/exporting keys, and shows balances.
2. **Add wallet screen** - SIMPLIFIED FLOW:
   - Generate a new Ed25519 keypair OR import existing private key
   - Enter display name (your public blockchain name)
   - Enter username (unique blockchain handle)
   - Click "Generate & Register" or "Import & Register"
   - **Wallet is automatically registered on the blockchain** with your public key
3. **Approval screen** accepts QR/manual challenges, signs payloads with the chosen wallet, and returns an Ed25519 signature.

### Blockchain Registration

**Every wallet creation automatically registers on the blockchain:**
- No optional checkboxes or extra steps
- Username must be unique (app will error if taken or pending)
- Display name and username are required fields
- Backend creates a `user_creation` transaction immediately
- **Registration completes when the next block is produced**

**Transaction-based user creation:**
- Wallet is saved locally immediately with the pre-assigned user ID
- The user creation transaction is marked as "pending"
- User appears on blockchain after running: `cd ledger && bun run src/scripts/produce-block.ts`
- In production, blocks would be produced automatically (e.g., every 6 seconds)

Wallet metadata is stored in `AsyncStorage`, while private keys live in secure storage (`expo-secure-store`). Export keys before uninstalling the app.

## Next Steps

- Swap to `expo-secure-store` biometric variants or platform Keychain/Keystore bindings for stronger security policies.
- Wire `expo-barcode-scanner` into the approval screen for real QR-powered challenges.
- Add push/deep link handling so the wallet opens automatically when approvals arrive.
- Build encrypted backup/export flows to move wallets between devices safely.
- Support multiple networks/environments via configurable ledger base URLs.

## Compatibility

- React Native 0.81 / Expo SDK 54
- TypeScript strict mode enabled
- Ed25519 implemented with `@noble/ed25519`
- QR scanning via `expo-camera` (replaces deprecated `expo-barcode-scanner`)

## Recent Changes

- Upgraded to Expo SDK 54 for better macOS/Xcode compatibility
- Migrated from `expo-barcode-scanner` to `expo-camera` (barcode scanner was deprecated in SDK 52+)
- Added environment variable support - **defaults to localhost:8080 for dev**, use `npm run start:prod` for production
- Fixed missing `expo-font` dependency that was causing white screen on launch
- Fixed crypto issues: Using `@noble/ed25519` v2 with React Native polyfills (`react-native-get-random-values`, `@noble/hashes`)
- Fixed TypeScript type errors in ledgerApi.ts for React Native compatibility
- Fixed SecureStore key validation errors (removed special characters from storage keys)
- **Simplified wallet creation flow** - removed redundant fields (label/notes), merged label→displayName
- **Mandatory blockchain registration** - every wallet automatically registers on blockchain with unique username
- **Duplicate username protection** - backend rejects transactions if username already exists or is pending
