# Ledger Service - Local Setup Guide

Since this environment doesn't have Bun or Docker, follow these steps on your local machine:

## ✅ Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://docker.com) (for PostgreSQL)
- Or PostgreSQL installed locally

---

## 🚀 Quick Start

### 1. Pull the latest changes

```bash
git pull origin claude/ledger-service-011CUiT8hDHiPYaWMpU8SgY6
```

### 2. Install dependencies

```bash
cd ledger
bun install
```

### 3. Start PostgreSQL

**Option A: Using Docker Compose (from project root)**
```bash
cd ..
docker compose up postgres -d
```

**Option B: Using local PostgreSQL**
```bash
# Make sure PostgreSQL is running on localhost:5432
# Create database: createdb tana
```

### 4. Run migrations

```bash
cd ledger
bun run db:push
```

Or if you prefer migration files:
```bash
bun run db:generate  # Already done - migration exists
bun run db:migrate
```

### 5. Start the ledger service

```bash
bun run dev
```

The service will start on `http://localhost:8080`

---

## 📋 Verify It's Working

### Check health
```bash
curl http://localhost:8080/health
```

### Seed currencies
```bash
curl -X POST http://localhost:8080/balances/currencies/seed
```

### Create a user
```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{
    "publicKey": "test_key_123",
    "username": "@alice",
    "displayName": "Alice Johnson",
    "bio": "Test user"
  }'
```

### List users
```bash
curl http://localhost:8080/users
```

---

## 🔧 Troubleshooting

### "bun: command not found"
Install Bun: `curl -fsSL https://bun.sh/install | bash`

### Database connection errors
Check your `.env` file or create one:
```bash
cp .env.example .env
# Edit .env with your database URL
```

### Port 8080 already in use
Change the port in `.env`:
```
PORT=8081
```

---

## 📊 Database Management

### View database with Drizzle Studio
```bash
bun run db:studio
```
Opens a web UI at `http://localhost:4983`

### Reset database
```bash
# Drop all tables and re-run migrations
docker compose down -v postgres
docker compose up postgres -d
bun run db:push
```

---

## 🧪 Testing the API

See the main [README.md](README.md) for full API documentation.

Quick test script:
```bash
# Seed currencies
curl -X POST http://localhost:8080/balances/currencies/seed

# Create user
USER_ID=$(curl -s -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"publicKey":"key1","username":"@alice","displayName":"Alice"}' \
  | jq -r '.id')

# Set balance
curl -X POST http://localhost:8080/balances \
  -H "Content-Type: application/json" \
  -d "{\"ownerId\":\"$USER_ID\",\"ownerType\":\"user\",\"currencyCode\":\"USD\",\"amount\":\"1000.00\"}"

# Get balances
curl "http://localhost:8080/users/$USER_ID/balances"
```

---

## 🐛 Known Issues

- **Bun not available in CI**: Use `npm run dev:node` as fallback
- **Docker not available**: Install PostgreSQL locally

---

**Need help?** Check the logs: `docker compose logs postgres`
