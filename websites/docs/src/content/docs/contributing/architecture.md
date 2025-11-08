---
title: System Architecture
description: Learn how Tana's components work together
---

## Overview

Tana consists of **two compiled binaries** and integrated services working together to provide a complete blockchain platform.

## Binary Structure

### 1. `tana` (CLI Binary)

- **Built from:** `cli/` directory (TypeScript/Bun)
- **Compiled with:** `bun build --compile`
- **Purpose:** Main user interface and orchestrator

**Contains:**
- All commands (`new`, `deploy`, `start`, `stop`, `status`)
- Configuration management (`~/.config/tana/`)
- Service spawning and process management
- Network communication
- Most business logic

### 2. `tana-runtime` (Execution Binary)

- **Built from:** `runtime/` directory (Rust)
- **Compiled with:** `cargo build --release`
- **Purpose:** Sandboxed TypeScript contract execution
- **Invoked by:** CLI when running contracts
- **Not persistent:** One-shot execution per contract run

## Integrated Services

### Ledger Service

- **Built into:** The `tana` CLI binary
- **Started with:** `tana start` command
- **Purpose:** Blockchain state management (users, balances, transactions, blocks)
- **Port:** 8080
- **Persistent:** Runs until Ctrl+C or `tana stop`

**Stack:** TypeScript/Bun, Hono, Drizzle ORM, PostgreSQL

**Responsibilities:**
- User/Team account management
- Multi-currency balance tracking
- Transaction validation
- Block storage and queries
- REST API for all blockchain data

## Data Flow

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

## Configuration Structure

### Global Configuration

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
```

### Project Structure

```
my-app/
├── contract.ts             # Contract code
└── contract.json           # Contract metadata
```

## Component Details

### Ledger Service

**Endpoints:**
- `GET /health` - Health check
- `GET /users` - List users
- `POST /users` - Create user
- `GET /balances` - Query balances
- `POST /balances` - Set balance
- `GET /transactions` - List transactions
- `POST /transactions` - Create transaction
- `GET /blocks` - Query blocks
- `POST /blocks` - Create block
- `GET /contracts` - List contracts
- `POST /contracts` - Deploy contract

**Database Tables:**
- `users` - User accounts
- `balances` - Multi-currency balances
- `transactions` - Transaction history
- `currencies` - Supported currencies
- `blocks` - Blockchain blocks
- `contracts` - Deployed smart contracts

### Rust Runtime

**Purpose:** Sandboxed V8 TypeScript execution engine

- Execute smart contracts in isolated environment
- Provide `tana/core`, `tana/data`, `tana/utils`, `tana/block`, `tana/tx` APIs
- No network access, filesystem, or system calls
- Deterministic execution
- Gas metering

**Modules Provided:**
- `tana/core` - Console, version info
- `tana/data` - Key-value storage (staging + commit)
- `tana/utils` - Whitelisted fetch API
- `tana/block` - Block context (height, timestamp, executor, gas)
- `tana/tx` - Transaction staging and execution

## Monorepo Structure

```
tana/                        # Monorepo root
├── runtime/                 # Rust - V8 TypeScript execution engine
│   ├── src/                 # Rust source (deno_core)
│   └── Cargo.toml
│
├── ledger/                  # TypeScript/Bun - Account & balance service
│   ├── src/                 # Users, teams, transactions
│   ├── migrations/          # Database migrations
│   └── package.json
│
├── cli/                     # TypeScript/Bun - Command-line tools
│   ├── core/                # Core commands and logic
│   └── package.json
│
├── websites/                # Web applications
│   ├── playground/          # Interactive contract playground
│   ├── landing/             # Landing page
│   └── docs/                # Documentation site
│
├── types/                   # Shared TypeScript type definitions
│   ├── tana-core.d.ts
│   ├── tana-data.d.ts
│   ├── tana-utils.d.ts
│   ├── tana-block.d.ts
│   └── tana-tx.d.ts
│
├── examples/                # Example smart contracts
├── docs/                    # Technical documentation
├── mprocs.yaml              # Multi-process configuration
└── package.json             # Workspace management
```

## Development Workflow

### Database Setup

PostgreSQL stores all blockchain data:

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  public_key TEXT,
  bio TEXT,
  created_at TIMESTAMP
);

-- Balances
CREATE TABLE balances (
  owner_id TEXT,
  owner_type TEXT,
  currency_code TEXT,
  amount TEXT,
  updated_at TIMESTAMP
);

-- Transactions
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  from_id TEXT,
  to_id TEXT,
  amount TEXT,
  currency_code TEXT,
  type TEXT,
  status TEXT,
  metadata JSONB,
  created_at TIMESTAMP
);

-- Blocks
CREATE TABLE blocks (
  height INTEGER PRIMARY KEY,
  hash TEXT,
  parent_hash TEXT,
  state_root TEXT,
  timestamp TIMESTAMP,
  producer TEXT,
  transactions JSONB
);

-- Contracts
CREATE TABLE contracts (
  id TEXT PRIMARY KEY,
  code TEXT,
  owner_id TEXT,
  created_at TIMESTAMP
);
```

### Environment Configuration

All sensitive configuration is stored in `.env` files:

```bash
# .env
DATABASE_URL='postgres://tana:[PASSWORD]@localhost:5432/tana'
REDIS_URL='redis://localhost:6379'

# Service Ports
LEDGER_PORT=8080
CONTRACTS_PORT=8081
NODE_PORT=9933

# Environment
NODE_ENV=development
```

## Security Model

### Sandbox Isolation

The Rust runtime provides complete isolation:

- No filesystem access
- No network access (except whitelisted fetch via `tana/utils`)
- No process spawning
- No system calls
- Memory limits enforced
- Gas metering for execution costs

### API Security

- CORS enabled for allowed origins
- Rate limiting on all endpoints
- Input validation with Zod schemas
- SQL injection protection via Drizzle ORM
- Environment-based configuration

## Deployment Architecture

### Development

```
mprocs → Multiple services in one terminal
  ├── PostgreSQL (Docker)
  ├── Redis (Docker)
  ├── Ledger Service (Bun)
  └── Playground (Astro)
```

### Production

```
Single VPS or distributed:
  ├── Nginx (Reverse proxy, SSL)
  ├── Docker Compose
  │   ├── Ledger Service
  │   ├── PostgreSQL
  │   └── Redis
  └── tana-runtime (Binary)
```

## Next Steps

- [Quick Start Guide](/guides/quickstart/) - Set up your development environment
- [CLI Reference](/tana-cli/intro/) - Learn the CLI commands
- [API Reference](/tana-api/intro/) - Explore the REST API
