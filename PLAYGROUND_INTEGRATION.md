# Playground Developer Visibility

## 🎯 Purpose

The playground is designed for **end users to write smart contracts** in TypeScript, not for direct blockchain inspection. However, for local development, the playground provides a tabbed state viewer to give **developers** visibility into the blockchain during testing.

## 🔒 Security Model

### Smart Contract Sandbox

Smart contracts run in a heavily sandboxed iframe with **restricted permissions**:

✅ **Allowed APIs:**
- `tana:core` - console.log/error, version info
- `tana:utils` - whitelisted fetch (specific domains only)
- `tana:data` - localStorage-based key-value store with size limits

❌ **Not Allowed:**
- Direct blockchain queries (no `tana:ledger` module)
- Unrestricted network access
- IndexedDB, localStorage (except via tana:data)
- navigator, WebSocket, Workers

### Developer Visibility (Local Dev Only)

The StateViewer component provides tabs for **local development inspection**:

- **Results** - Smart contract execution output
- **Users** - All user accounts (dev visibility)
- **Balances** - Account balances (dev visibility)
- **Transactions** - Transaction history (dev visibility)
- **Currencies** - Supported currencies (dev visibility)

**Important:** These tabs fetch data from the **parent window context** using `ledgerApi.ts`, NOT from inside the sandboxed smart contract. This means:

1. Smart contracts **cannot** access this data
2. Only works in local dev (ledger service on localhost:8080)
3. Production playground won't have access to these endpoints

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   PLAYGROUND                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────┐         ┌──────────────────┐   │
│  │  Code Editor  │         │  State Viewer    │   │
│  │   (Monaco)    │         │                  │   │
│  │               │         │  [Results] Tab   │   │
│  │ import {...}  │         │  [Users] Tab*    │   │
│  │ from          │         │  [Balances] Tab* │   │
│  │ 'tana:core'   │         │  [Transactions]* │   │
│  │               │         │  [Currencies]*   │   │
│  │ const data =  │         │                  │   │
│  │ await data    │         │  * = Dev only    │   │
│  │ .get('key')   │         │                  │   │
│  └───────┬───────┘         └────────┬─────────┘   │
│          │                          │             │
│          │ Execute                  │ Fetch       │
│          ▼                          ▼             │
│  ┌───────────────────────────────────────────┐   │
│  │     Sandboxed Runtime (iframe)            │   │
│  │                                            │   │
│  │  ✅ tana:core (console, version)          │   │
│  │  ✅ tana:utils (whitelisted fetch)        │   │
│  │  ✅ tana:data (key-value storage)         │   │
│  │  ❌ NO blockchain query APIs              │   │
│  └───────────────────────────────────────────┘   │
│                                                   │
└───────────────────────────────────────────────────┘
                     │
                     │ (StateViewer tabs only)
                     ▼
          ┌──────────────────────┐
          │   Ledger Service     │
          │   localhost:8080     │
          │   (Local dev only)   │
          └──────────────────────┘
```

## 📝 Available Smart Contract APIs

### 1. `tana:core`

```typescript
import { console, version } from 'tana:core'

console.log('Hello from smart contract')
console.error('Error message')

console.log('Version:', version.tana)
```

### 2. `tana:utils` (Whitelisted Fetch)

```typescript
import { fetch } from 'tana:utils'

// Only whitelisted domains are allowed
const response = await fetch('https://pokeapi.co/api/v2/pokemon/ditto')
const data = await response.json()
console.log(data.name)

// Allowed domains:
// - pokeapi.co (testing)
// - *.tana.dev
// - tana.network
// - localhost (dev only)
```

### 3. `tana:data` (Key-Value Storage)

```typescript
import { data } from 'tana:data'

// Set a value
await data.set('myKey', 'myValue')
await data.set('myObject', { foo: 'bar' })

// Get a value
const value = await data.get('myKey')
const obj = await data.get('myObject')

// Other operations
await data.delete('myKey')
const exists = await data.has('myKey')
const keys = await data.keys('my*')  // Pattern matching
const all = await data.entries()

// Commit changes (apply to localStorage)
await data.commit()

// Limits:
// - Max key size: 256 bytes
// - Max value size: 10 KB
// - Max total size: 100 KB
// - Max keys: 1000
```

## 🧪 Testing the Playground

### 1. Start Development Environment

```bash
npm run dev
```

This starts:
- PostgreSQL (database)
- Redis (cache)
- Ledger service (port 8080)
- Website (port 4322)

### 2. Open the Playground

Navigate to: http://localhost:4322/playground

### 3. Write Smart Contracts

The default code demonstrates the available APIs:

```typescript
import { console, version } from 'tana:core'
import { fetch } from 'tana:utils'

console.log("hello. this is the tana playground.")
console.log("version:", version)

const response = await fetch('https://pokeapi.co/api/v2/pokemon/ditto')
const pokemon = await response.json()
console.log('Name:', pokemon.name)
```

### 4. View Results

- **Results tab** - See console output from your smart contract
- **Users/Balances/Transactions tabs** - Developer visibility (local dev only)

## 🔮 Future Smart Contract APIs

Planned additions for controlled blockchain access:

- [ ] `tana:block` - Access to current block data
- [ ] `tana:account` - Read account information (controlled)
- [ ] `tana:tx` - Submit transactions
- [ ] `tana:contract` - Inter-contract calls

These will be carefully designed to:
- Prevent unauthorized data access
- Ensure deterministic execution
- Maintain security boundaries

## 🚫 What Changed (Security Fix)

**Removed in recent commit:**
- `tana:ledger` module from sandbox (security hole)
- Direct blockchain query APIs from smart contracts
- Example code that queried entire blockchain state

**What this means:**
- Smart contracts can no longer query all users/balances/transactions
- Playground is now properly sandboxed for untrusted code
- Developer visibility still available via StateViewer tabs (local dev only)
- Production deployment will be secure

## 📚 For Developers

If you need to test smart contracts with specific blockchain state:

1. Use the ledger service API directly to set up test data
2. View the state in the StateViewer tabs
3. Write smart contracts that use the controlled APIs
4. Test deterministic execution

The playground is a **smart contract development environment**, not a blockchain explorer. For blockchain inspection, use dedicated tools or the StateViewer tabs during local development.
