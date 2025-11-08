# tana

A blockchain with smart contracts written in TypeScript.

Tana is designed to be user-owned and operated - anyone can start their own blockchain or join existing networks as a validator node. Smart contracts are written in familiar TypeScript and executed in a sandboxed V8 environment.

**Key Features:**
- TypeScript smart contracts (not a new language to learn)
- Multi-currency support (no native token required)
- CLI-first design (everything controllable from terminal)
- Decentralized node operation (start your own chain or join others)
- Sandboxed contract execution (security by design)

**Status:** Early development - Not production ready

---

## ⚠️ Security Status

**CRITICAL: This system is NOT secure and should NOT be used with real assets.**

### Transaction Signing (NOT IMPLEMENTED)

All API operations **require cryptographic signatures** in the final design, but signature verification is **not yet implemented**. Currently:

- ❌ **No signature verification** - Anyone can submit transactions claiming to be any user
- ❌ **No keypair cryptography** - Ed25519 keypairs are placeholders (random bytes)
- ❌ **No replay protection** - No nonce or timestamp validation

**Intended Design (To Be Implemented):**

All transactions must include a cryptographic signature proving ownership:

```typescript
// Client-side (CLI)
const transaction = {
  from: "usr_alice",
  to: "usr_bob",
  amount: "100",
  currencyCode: "USD",
  timestamp: Date.now(),
  nonce: 42
}

const hash = sha256(JSON.stringify(transaction))
const signature = ed25519.sign(hash, alicePrivateKey)

// Send to API with signature
POST /transactions {
  ...transaction,
  signature: "0x1a2b3c..."
}

// Server-side (API)
const publicKey = getUser(transaction.from).publicKey
const valid = ed25519.verify(signature, hash, publicKey)
if (!valid) reject()
```

**What This Means:**
- 🚨 Contracts: Anyone can deploy as any user (`POST /contracts/deploy`)
- 🚨 Transactions: Anyone can transfer funds from any account (`POST /transactions`)
- 🚨 Users: Anyone can create users with any identity (`POST /users`)

**Before Production:**
- [ ] Implement real Ed25519 keypair generation (replace `randomBytes`)
- [ ] CLI signs all transactions with user's private key
- [ ] API verifies signatures before accepting transactions
- [ ] Add nonce/timestamp to prevent replay attacks
- [ ] Add transaction expiry mechanism

See [Active Development → Transaction Signing](#active-development---blockchain-completion) roadmap below.

---

## 🏗️ Architecture

### Binary Structure

Tana consists of **two compiled binaries** and one service:

**1. `tana` (CLI Binary)**
- **Built from:** `cli/` directory (TypeScript/Bun)
- **Compiled with:** `bun build --compile`
- **Purpose:** Main user interface and orchestrator
- **Contains:**
  - All commands (`new`, `deploy`, `start`, `stop`, `status`)
  - Configuration management (`~/.config/tana/`)
  - Service spawning and process management
  - Network communication
  - Most business logic

**2. `tana-runtime` (Execution Binary)**
- **Built from:** `runtime/` directory (Rust)
- **Compiled with:** `cargo build --release`
- **Purpose:** Sandboxed TypeScript contract execution
- **Invoked by:** CLI when running contracts
- **Not persistent:** One-shot execution per contract run

**Integrated Services:**
- **Ledger Service (Integrated):**
  - Built into the `tana` CLI binary
  - Started with `tana start` command
  - Purpose: Blockchain state management (users, balances, transactions, blocks)
  - Runs HTTP server on port 8080
  - Persistent: Runs until Ctrl+C or `tana stop`

### Data Flow

```
User runs: tana deploy contract
          ↓
    [tana CLI binary]
          ↓
    1. Read config from ~/.config/tana/
    2. Determine deployment target (local/remote)
    3. Validate contract code
          ↓
    [Ledger API] ← HTTP request
          ↓
    Create pending transaction
          ↓
    [tana CLI] runs: tana start (if not running)
          ↓
    [Ledger Service] produces block
          ↓
    Invokes: ./tana-runtime contract.ts
          ↓
    [tana-runtime binary]
          ↓
    Execute contract in sandbox
          ↓
    Return state changes
          ↓
    [Ledger Service] commits to database
```

### Configuration Structure

```
~/.config/tana/
├── config.json              # Global settings (default chain, user)
├── chains/
│   ├── local.json          # Local chain config
│   └── mainnet.json        # Remote chain configs
├── nodes/
│   └── node-xyz.json       # Node participation configs
└── users/
    └── alice.json          # User credentials (keys)

Project directory:
my-app/
├── contract.ts             # Contract code
└── contract.json           # Contract metadata
```

---

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/tana.git
cd tana

# Install dependencies
bun install

# Build CLI binary
cd cli
bun run make
# Creates: cli/dist/tana

# Build runtime binary
cd ../runtime
cargo build --release
# Creates: runtime/target/release/tana-runtime

# Install binaries (optional)
sudo ln -s $(pwd)/cli/dist/tana /usr/local/bin/tana
sudo ln -s $(pwd)/runtime/target/release/tana-runtime /usr/local/bin/tana-runtime
```

### Usage

```bash
# Create a new blockchain (you become genesis leader)
tana new chain my-chain

# Start your chain
tana start

# Create a user account
tana new user @alice --name "Alice Johnson"

# Deploy user to blockchain
tana deploy user @alice

# Create a smart contract
tana new contract token-transfer

# Deploy contract
tana deploy contract ./contract.ts

# Test run a contract locally
tana run examples/alice-to-bob.ts

# Check chain status
tana status

# Stop services
tana stop
```

### Commands Reference

```bash
# Creation commands
tana new chain <name>       # Start new blockchain
tana new node --connect <url>  # Join existing chain
tana new user <username>    # Create user account
tana new contract [name]    # Scaffold contract

# Deployment commands
tana deploy user <username>     # Deploy user to chain
tana deploy contract <path>     # Deploy contract to chain

# Service management
tana start                  # Start local services
tana stop                   # Stop all services
tana status                 # Show service status

# Utilities
tana run <contract>         # Test contract locally
tana balance <user>         # Check user balance
tana transfer <from> <to> <amount> <currency>
tana check                  # Validate system requirements
```

---

## 📋 Development Roadmap

### Current Sprint: CLI-First Architecture

**In Progress:**
- [x] Config management system (JSON-based)
- [x] `tana new chain` - Create genesis blockchain
- [x] `tana start` - Integrated ledger server
- [x] `tana status` - Show running services
- [x] `tana new user` - User account creation
- [x] `tana deploy user` - Deploy to blockchain
- [x] `tana new contract` - Contract scaffolding
- [ ] `tana deploy contract` - Smart contract deployment

**Next:**
- [ ] Smart deployment targeting (local → config → prompt)
- [ ] `tana new node` - Join existing chains
- [ ] Process management (PID tracking, graceful shutdown)
- [ ] Contract execution via runtime binary
- [ ] Integration tests for full flow

## to do list / feature progression

### ✅ Core Infrastructure (Complete)
- [x] rust-based javascript runtime built on deno_core/V8
  - [x] typescript support
  - [x] security lockdown
  - [x] tana:* module imports
- [x] web-based read-only smart contract playground
  - [x] typescript support
  - [x] security lockdown
  - [x] tana:* module imports
- [x] tana modules (MVP complete)
  - [x] tana:core - console, version
  - [x] tana:utils - fetch()
  - [x] tana:data - key-value storage with staging
  - [x] tana:block - blockchain queries (getBalance, getUser, getTransaction, getBlock, getLatestBlock)
  - [x] tana:tx - transaction staging (transfer, setBalance, execute)
- [x] blockchain foundation
  - [x] blocks table and schema
  - [x] genesis block (Block #0)
  - [x] block query API endpoints
  - [x] blockchain management scripts (flush, genesis)

### 🚧 Active Development - Blockchain Completion

**Priority Items:**

- [ ] **0. Transaction Signing & Security** 🚨 **CRITICAL**
  - [ ] Replace random keypair generation with real Ed25519 (`@noble/ed25519`)
  - [ ] Implement transaction signing in CLI
  - [ ] Implement signature verification in API
  - [ ] Add nonce/timestamp for replay protection
  - [ ] Hash standardization for transaction payloads
  - [ ] Add signature verification to all endpoints
  - [ ] Document signature requirements in API docs

**Feature Completion:**

- [x] **1. Transaction-based User Creation** ✅
  - [x] Add user_creation transaction type
  - [x] Convert POST /users to create transactions instead of direct DB writes
  - [x] Users only exist after transaction is included in a block
- [x] **2. Block Production** ✅
  - [x] Manual block production script (dev-friendly: `bun run blockchain:produce`)
  - [x] Include pending transactions in new blocks
  - [x] Update block height incrementally
  - [x] Calculate proper state roots and block hashes
- [ ] **3. Smart Contracts on Blockchain** 👈 IN PROGRESS
  - [x] Add contract_deployment transaction type
  - [x] Create contracts table
  - [ ] Modify Rust runtime to return execution validity
  - [ ] Contract deployment API (create transactions)
  - [ ] Contract execution in block producer
  - [ ] Contract queries and management
- [ ] **4. Transaction Queue (Mempool)**
  - [ ] Pending transactions table/storage
  - [ ] Transaction validation before acceptance
  - [ ] Transaction selection for block inclusion
- [ ] **5. Automated Block Production**
  - [ ] Block producer service
  - [ ] 6-second block interval timer
  - [ ] Automatic transaction inclusion
  - [ ] Gas optimization

### 📋 Future Features
- [ ] content delivery system
  - [ ] users can deploy assets to the network for deployment
  - [ ] mechanism for uploading assets once transaction is successful
  - [ ] need plan for distribution/storage of assets
  - [ ] generic js/ts tana integration to provide tools for frameworks
  - [ ] framework support: Astro, Nextjs, Vue, SvelteKit, Angular
- [ ] dns resolution, dns and dns over http. maps subdomain to landing pages on the network

## Monorepo Structure

```
tana/                    # Monorepo root
├── runtime/                     # Rust - V8 TypeScript execution engine
│   ├── src/                     # Rust source (deno_core)
│   └── Cargo.toml
│
├── node/                        # TypeScript/Bun - Blockchain node
│   ├── src/                     # P2P, consensus, storage
│   └── package.json
│
├── ledger/                      # TypeScript/Bun - Account & balance service
│   ├── src/                     # Users, teams, transactions
│   └── package.json
│
├── contracts/                   # TypeScript/Bun - Contract executor
│   ├── src/                     # Deployment & execution
│   └── package.json
│
├── cli/                         # TypeScript/Bun - Command-line tools
│   ├── src/                     # User-facing commands
│   └── package.json
│
├── website/                     # Astro/Svelte - Main website & playground
│   └── src/
│
├── types/                       # Shared TypeScript type definitions
│   ├── tana-core.d.ts
│   ├── tana-data.d.ts
│   └── tana-utils.d.ts
│
├── docs/                        # Documentation
│   ├── DATA_STORAGE.md
│   ├── FEATURE_PARITY.md
│   └── STORAGE_*.md
│
├── TODO.md                      # Project roadmap & architecture
├── docker-compose.yml           # All services orchestration
└── package.json                 # Workspace management
```

---

## 🚀 Quick Start

> **See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions**

### Prerequisites

- [Bun](https://bun.sh) >= 1.0 (for TypeScript services)
- [Rust](https://rustup.rs) >= 1.70 (for runtime only)
- [Docker](https://docker.com) (for databases)
- [mprocs](https://github.com/pvolok/mprocs) (optional, for multi-process management)

### Installation

```bash
# Install all dependencies
bun install

# Build Rust runtime
cd runtime && cargo build --release && cd ..

# Install mprocs (optional but recommended)
brew install mprocs  # macOS
cargo install mprocs # or via Cargo
```

### Development

**Option 1: All services with mprocs (Recommended)**

```bash
npm run dev  # or ./dev.sh
```

This starts PostgreSQL, Redis, Ledger, and Website in one terminal with easy process management.

**Option 2: Individual services**

```bash
# Start databases
npm run db:up

# Start services individually
bun cli/main.ts start   # Ledger service (port 8080)
npm run dev:contracts   # Contract executor (port 8081)
npm run dev:node        # Blockchain node (port 9933)
npm run dev:website     # Website (port 4322)
npm run dev:runtime     # Rust runtime (CLI)
```

### Testing

```bash
# Run all tests
bun test

# Test specific service
bun run --filter @tana/ledger test

# Test Rust runtime
cd runtime && cargo test
```

---

## 🏗️ Service Overview

### Runtime (Rust)
**Purpose:** Sandboxed V8 TypeScript execution engine

- Execute smart contracts in isolated environment
- Provide `tana:core`, `tana:data`, `tana:utils` APIs
- No network access, filesystem, or system calls
- Deterministic execution

📖 [Full Runtime Documentation](./runtime/README.md)

### Node (TypeScript/Bun)
**Purpose:** Blockchain node with P2P networking

- Block production & validation
- P2P networking (libp2p)
- JSON-RPC API
- Consensus mechanism

📖 [Node Documentation](./node/README.md)

### Ledger (TypeScript/Bun)
**Purpose:** Account and balance management

- User/Team account CRUD
- Multi-currency balances
- Transaction validation
- REST API

📖 [Ledger Documentation](./ledger/README.md)

### Contracts (TypeScript/Bun)
**Purpose:** Smart contract deployment & execution

- Deploy contracts on-chain
- Execute via runtime (subprocess or FFI)
- Redis state storage
- Gas metering

📖 [Contracts Documentation](./contracts/README.md)

### CLI (TypeScript/Bun)
**Purpose:** Command-line tools for users

```bash
tana account create
tana send @bob 10 USD
tana deploy contract.ts
tana call @contract/counter increment
```

📖 [CLI Documentation](./cli/README.md)

### Website (Astro/Svelte)
**Purpose:** Main website & browser playground

- Interactive code editor (Monaco)
- Run contracts in browser
- Documentation
- Block explorer (future)

---

## 📚 Documentation

- [TODO.md](./TODO.md) - Project roadmap and architecture decisions
- [Data Storage](./docs/DATA_STORAGE.md) - Storage API design
- [Feature Parity](./docs/FEATURE_PARITY.md) - Cross-environment compatibility

---

## 🔧 Development Workflow

### Working on a Service

```bash
# Navigate to service
cd ledger

# Install dependencies (if needed)
bun install

# Run in development mode
bun run dev

# Run tests
bun test

# Build for production
bun run build
```

### Adding a New Dependency

```bash
# Add to specific service
cd ledger
bun add postgres

# Add to root (shared dev tools)
cd ..
bun add -D typescript
```

### Database Migrations

```bash
# Ledger service (PostgreSQL)
cd ledger
bun run db:generate   # Generate migration
bun run db:migrate    # Run migrations

# Contracts service (Redis)
# No migrations needed - key-value store
```

---

## 🐳 Docker Setup

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Reset everything (including volumes)
docker compose down -v
```

**Services:**
- `postgres` - PostgreSQL database (port 5432)
- `redis` - Redis cache (port 6379)
- `tana-ledger` - Ledger API (port 8080)
- `tana-contracts` - Contracts API (port 8081)
- `tana-node` - Node RPC (port 9933)
- `tana-website` - Website (port 4322)

---

## 🧪 Example Smart Contract

```typescript
import { console } from 'tana:core'
import { data } from 'tana:data'

// Simple counter contract
const current = await data.get('counter')
const count = current ? parseInt(current) : 0

console.log('Current count:', count)

await data.set('counter', String(count + 1))
await data.commit()

console.log('Counter incremented!')
```

**Run it:**

```bash
# Via CLI
tana deploy examples/counter.ts

# Via Rust runtime
cd runtime
cargo run -- example.ts

# Via browser playground
open http://localhost:4322
```

---

## 🤝 Contributing

This is an experimental project. Contributions welcome!

1. Pick an issue or feature from [TODO.md](./TODO.md)
2. Create a branch
3. Make changes and test
4. Submit a PR

---

## 📝 License

MIT (or your chosen license)

---

## 🔗 Links

- [Architecture & Roadmap](./TODO.md)
- [Runtime Documentation](./runtime/README.md)
- [Data Storage Design](./docs/DATA_STORAGE.md)

---

**Status:** Early development - Not production ready

Built with Rust (deno_core), TypeScript, Bun, PostgreSQL, Redis, and Astro.
