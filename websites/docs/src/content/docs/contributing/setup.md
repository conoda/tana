---
title: Development Setup
description: Build Tana from source for development
sidebar:
  order: 2
---

This guide is for **contributors** who want to build Tana from source. If you just want to use Tana, see the [Quick Start](/guides/quickstart/) instead.

## Prerequisites

- [Bun](https://bun.sh) >= 1.0 (TypeScript runtime)
- [Rust](https://rustup.rs) >= 1.70 (for runtime binary)
- [Docker](https://docker.com) (for PostgreSQL and Redis)
- [mprocs](https://github.com/pvolok/mprocs) (optional, for multi-process management)

## Clone Repository

```bash
git clone https://github.com/conoda/tana.git
cd tana
```

## Install Dependencies

```bash
# Install all workspace dependencies
bun install
```

## Build Rust Runtime

```bash
cd runtime
cargo build --release
cd ..
```

This creates the `tana-runtime` binary at `runtime/target/release/tana-runtime`.

## Build CLI (Optional)

```bash
cd cli
bun run make
cd ..
```

This creates a standalone `tana` binary at `cli/dist/tana`.

## Start Development Environment

### Option 1: All Services with mprocs (Recommended)

```bash
npm run dev
# or
./dev.sh
```

This starts:
- ✅ PostgreSQL (auto)
- ✅ Redis (auto)
- ✅ Ledger Service (auto) - http://localhost:8080
- ✅ Playground (auto) - http://localhost:4321
- ⏸️ Contracts Service (manual)
- ⏸️ Node Service (manual)

**mprocs shortcuts:**
- `Tab` - Switch between processes
- `Space` - Start/stop a process
- `Ctrl+A` then `Q` - Quit all processes
- `Ctrl+A` then `K` - Kill a process
- `Arrow keys` - Navigate

### Option 2: Individual Services

```bash
# Start database infrastructure
npm run db:up

# Start individual services
bun cli/main.ts start      # Ledger service (port 8080)
npm run dev:contracts       # Contracts (port 8081)
npm run dev:node            # Blockchain node (port 9933)
npm run dev:playground      # Playground (port 4321)
```

## Environment Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` to configure:

```bash
# Database
DATABASE_URL='postgres://tana:[PASSWORD]@localhost:5432/tana'

# Redis
REDIS_URL='redis://localhost:6379'

# Service Ports
LEDGER_PORT=8080
CONTRACTS_PORT=8081
NODE_PORT=9933

# Environment
NODE_ENV=development
```

## Testing

```bash
# Run all tests
bun test

# Test specific service
bun run --filter @tana/ledger test

# Test Rust runtime
cd runtime && cargo test
```

## Common Development Tasks

### Database Management

```bash
# Start databases
npm run db:up

# Stop databases
npm run db:down

# View logs
npm run db:logs

# Reset databases (warning: deletes all data)
docker compose down -v && npm run db:up
```

### Building

```bash
# Build all services
npm run build

# Build Rust runtime
npm run build:runtime

# Build CLI binary
cd cli && bun run make
```

### Running Examples

```bash
# Test the runtime
bun run chaintest

# Run a contract
cd runtime
cargo run -- ../examples/default.ts
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Check what's using a port
lsof -i :8080
```

### Database Connection Errors

```bash
# Restart PostgreSQL
docker compose restart postgres

# Check logs
docker compose logs postgres

# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules
bun install

# Rust
cd runtime
cargo clean
cargo build --release
```

## Project Structure

```
tana/
├── cli/             # CLI binary (TypeScript/Bun)
├── runtime/         # Contract execution (Rust)
├── ledger/          # Ledger service (TypeScript/Bun)
├── contracts/       # Contract executor (TypeScript/Bun)
├── node/            # Blockchain node (TypeScript/Bun)
├── websites/
│   ├── docs/        # Documentation (Astro/Starlight)
│   ├── playground/  # Contract playground (Astro/Svelte)
│   └── landing/     # Landing page (Next.js)
├── types/           # Shared TypeScript types
├── examples/        # Example contracts
└── docs/            # Technical documentation
```

## Next Steps

- Read [System Architecture](/contributing/architecture/) to understand how Tana works
- Explore [Core Concepts](/contributing/core/data-model/) for technical details
- Check out [Testing Guide](/contributing/testing/) for writing tests
