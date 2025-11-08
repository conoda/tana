# Quick Start Guide

## 🚀 Starting Development

### Option 1: All services with mprocs (Recommended)

```bash
# Start all services in one terminal with process management
npm run dev
# or
./dev.sh
```

This starts:
- ✅ PostgreSQL (auto)
- ✅ Redis (auto)
- ✅ Ledger Service (auto) - http://localhost:8080
- ✅ Website (auto) - http://localhost:4322
- ⏸️ Contracts Service (manual)
- ⏸️ Node Service (manual)

**mprocs shortcuts:**
- `Tab` - Switch between processes
- `Space` - Start/stop a process
- `Ctrl+A` then `Q` - Quit all processes
- `Ctrl+A` then `K` - Kill a process
- `Arrow keys` - Navigate

### Option 2: Individual services

```bash
# Start database infrastructure
npm run db:up

# Start individual services
npm run dev:ledger      # Ledger API (port 8080)
npm run dev:contracts   # Contracts (port 8081)
npm run dev:node        # Blockchain node (port 9933)
npm run dev:website     # Website (port 4322)
npm run dev:runtime     # Rust runtime (CLI)
```

## 🧪 Testing the Ledger API

```bash
# Health check
curl http://localhost:8080/health

# Seed currencies
curl -X POST http://localhost:8080/balances/currencies/seed

# Create a user
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{
    "publicKey": "test_key_123",
    "username": "@alice",
    "displayName": "Alice Johnson"
  }'

# List users
curl http://localhost:8080/users

# Set a balance
curl -X POST http://localhost:8080/balances \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": "USER_ID_HERE",
    "ownerType": "user",
    "currencyCode": "USD",
    "amount": "1000.00"
  }'
```

## 📁 Project Structure

```
tana/
├── ledger/          # Account & balance service (TypeScript/Bun)
├── contracts/       # Smart contract executor (TypeScript/Bun)
├── node/            # Blockchain node (TypeScript/Bun)
├── runtime/         # V8 TypeScript runtime (Rust)
├── cli/             # Command-line tools (TypeScript/Bun)
├── website/         # Main website & playground (Astro)
├── mprocs.yaml      # Multi-process configuration
└── dev.sh           # Development startup script
```

## 🔧 Common Commands

```bash
# Database management
npm run db:up        # Start PostgreSQL & Redis
npm run db:down      # Stop databases
npm run db:logs      # View database logs

# Development
npm run dev          # Start all services (mprocs)
npm run dev:ledger   # Start only ledger
npm run dev:website  # Start only website

# Building
npm run build              # Build all services
npm run build:runtime      # Build Rust runtime

# Testing
npm test                   # Run all tests
npm run test:runtime       # Test Rust runtime
```

## ⚠️ Troubleshooting

### Ledger service won't start

If you see "password authentication failed for user conoda", you have a global DATABASE_URL set in your shell.

**Fix:**
```bash
# Temporarily override
DATABASE_URL='postgres://tana:tana_dev_password@localhost:5432/tana' bun run dev:ledger

# Or permanently remove from ~/.zshrc or ~/.bashrc
# Comment out: export DATABASE_URL=...
```

### Port already in use

```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Check what's using a port
lsof -i :8080
```

### Database not ready

```bash
# Restart PostgreSQL
docker compose restart postgres

# Check logs
docker compose logs postgres
```

## 📚 Next Steps

1. ✅ Ledger service is working
2. 🔨 Build CLI commands to interact with ledger
3. 🔨 Implement smart contracts service
4. 🔨 Create blockchain node with P2P
5. 🔨 Build landing pages feature

See [TODO.md](./TODO.md) for full roadmap.
