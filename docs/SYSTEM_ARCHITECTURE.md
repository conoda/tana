# System Architecture

## Repository Structure

```
conoda/
├── tana-runtime/          # THIS REPO - Core runtime + website
│   ├── src/               # Rust runtime (V8 + TypeScript execution)
│   ├── website/           # Main website (Astro/Svelte)
│   ├── types/             # Shared TypeScript definitions
│   └── examples/          # Example smart contracts
│
├── tana-cli/              # SEPARATE REPO - CLI tools
│   ├── commands/          # User-facing commands (deploy, query, etc.)
│   └── lib/               # Shared client library
│
├── tana-node/             # NEW REPO - Blockchain node
│   ├── validator/         # Block validation & consensus
│   ├── p2p/               # Network layer
│   ├── storage/           # Block/transaction storage
│   └── api/               # JSON-RPC API server
│
├── tana-ledger/           # NEW REPO - Ledger service
│   ├── accounts/          # User/Team account management
│   ├── balances/          # Multi-currency balance tracking
│   ├── transactions/      # Transaction processing
│   └── migrations/        # PostgreSQL schema
│
└── tana-contracts/        # NEW REPO - Contract executor service
    ├── executor/          # Sandboxed contract execution
    ├── storage/           # Contract state (Redis)
    └── api/               # Contract deployment & calls
```

---

## 🔧 Service Responsibilities

### 1. **tana-runtime** (This Repo)
**Purpose:** Sandboxed TypeScript execution engine + project website

**Responsibilities:**
- Execute smart contracts in isolated V8 runtime
- Provide `tana:core`, `tana:data`, `tana:utils` APIs
- Host main project website at `/website`
- TypeScript type definitions for contract development
- Browser playground for testing contracts

**Stack:** Rust (deno_core), Astro, Svelte, Monaco Editor

**NOT responsible for:**
- Block validation (→ tana-node)
- Balance tracking (→ tana-ledger)
- Network communication (→ tana-node)

---

### 2. **tana-cli** (Existing Separate Repo)
**Purpose:** Command-line tools for developers & users

**Responsibilities:**
- Deploy smart contracts (`tana deploy contract.ts`)
- Query balances (`tana balance @alice`)
- Send transactions (`tana send @bob 10 USD`)
- Manage keys (`tana keys generate`)
- Interact with node API

**Stack:** TypeScript/Bun or Rust

**NOT responsible for:**
- Running nodes (→ tana-node)
- Executing contracts (→ tana-contracts)

---

### 3. **tana-node** (New Service)
**Purpose:** Blockchain node (validator/observer)

**Responsibilities:**
- P2P network communication
- Block production & validation
- Transaction mempool
- Consensus mechanism (PoS, PoA, etc.)
- JSON-RPC API for clients
- Sync with network

**Stack:** Rust (libp2p, tokio), PostgreSQL

**Docker Services:**
- `tana-node` (main binary)
- `postgres` (block/tx storage)

---

### 4. **tana-ledger** (New Service)
**Purpose:** Account & balance management

**Responsibilities:**
- User/Team account CRUD
- Multi-currency balance tracking
- Transaction validation (sufficient funds, etc.)
- Account state hashing
- Currency registry

**Stack:** Rust or Go, PostgreSQL

**Database Tables:**
- `accounts` (users, teams, balances)
- `transactions` (pending & confirmed)
- `currencies` (supported currencies)

---

### 5. **tana-contracts** (New Service)
**Purpose:** Smart contract deployment & execution

**Responsibilities:**
- Deploy contracts (store code + hash)
- Execute contract calls (via tana-runtime)
- Manage contract state (Redis KV store)
- Gas metering & limits
- Contract versioning

**Stack:** Rust, Redis, tana-runtime (as library)

**Docker Services:**
- `tana-contracts` (executor)
- `redis` (contract state storage)