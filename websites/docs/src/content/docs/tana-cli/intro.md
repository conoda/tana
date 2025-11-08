---
title: CLI Overview
description: Introduction to the Tana command-line interface
sidebar:
  order: 1
---

The Tana CLI is your primary tool for managing blockchains, user accounts, and TypeScript smart contracts. It provides everything you need to create, deploy, and interact with the Tana blockchain.

## Installation

```bash
# Clone repository
git clone https://github.com/conoda/tana.git
cd tana

# Install dependencies
bun install

# Build CLI (optional - for standalone binary)
cd cli
bun run make
```

## Usage

```bash
# Development (from project root)
bun cli/main.ts <command> [options]

# Or after building standalone binary
./cli/dist/tana <command> [options]
```

## Quick Start

```bash
# 1. Start the ledger service
bun cli/main.ts start

# 2. Create a new user
bun cli/main.ts new user @alice --name "Alice Johnson"

# 3. Deploy the user to blockchain
bun cli/main.ts deploy user @alice

# 4. Check status
bun cli/main.ts status
```

## Command Categories

The CLI is organized into logical groups:

- **Service Management** - Start, stop, and monitor the ledger service
- **Creation** - Create chains, users, nodes, and contracts
- **Deployment** - Deploy users and contracts to the blockchain
- **Blockchain Operations** - Run contracts, check balances, transfer funds
- **System** - Validate configuration and requirements

See the [Commands](/tana-cli/commands/) reference for detailed documentation of all available commands.

## Configuration

Tana stores its configuration in `~/.config/tana/`:

```
~/.config/tana/
├── config.json              # Global settings (default chain, user)
├── chains/
│   └── *.json              # Chain configurations
├── users/
│   └── *.json              # User credentials and keys
└── nodes/
    └── *.json              # Node configurations
```

**Environment Variables:**

```bash
DATABASE_URL='postgres://tana:[PASSWORD]@localhost:5432/tana'
LEDGER_PORT=8080
NODE_ENV=development
```

## Next Steps

- **[Commands Reference](/tana-cli/commands/)** - Complete command documentation
- **[API Reference](/tana-api/intro/)** - REST API endpoints
- **[Quick Start Guide](/guides/quickstart/)** - Get up and running
- **[System Architecture](/guides/architecture/)** - Understand how Tana works
