# Tana Ledger

Account and balance management service for the Tana blockchain.

## Features

- **User Accounts**: Create and manage user accounts
- **Team Management**: Team creation, membership, and treasury
- **Multi-Currency Balances**: Track balances across multiple currencies
- **Transaction Processing**: Validate and process transactions
- **REST API**: HTTP API for account operations

## Development

```bash
# Install dependencies
bun install

# Run database migrations
bun run db:migrate

# Run in development mode
bun run dev

# Build for production
bun run build

# Run tests
bun test
```

## Block Production (Development)

Transactions are processed into blocks. During development, you need to manually produce blocks to finalize pending transactions:

```bash
# From project root:
npm run pending    # Process pending transactions
npm run block      # Same as above (alias)

# From ledger directory:
npm run pending    # Short command
npm run blockchain:produce  # Full command name
```

**When to run:**
- After creating users on the mobile app
- After submitting transactions
- When you want to finalize pending operations

**What it does:**
- Finds all pending transactions
- Executes them (user creation, transfers, contract calls, etc.)
- Creates a new block with those transactions
- Updates transaction status from "pending" → "confirmed"

**Example output:**
```
🔨 Producing new block...
Latest block: 6
Found 3 pending transaction(s)

Processing transaction ... (user_creation)...
  ✓ Created user: @alice (uuid)

✅ Block produced successfully!
Block Details:
  Height: 7
  Transactions: 3
  Gas Used: 63000 / 1000000
```

## Architecture

```
src/
├── index.ts          # Main API server (Hono)
├── accounts/         # User/Team account management
├── balances/         # Multi-currency balance tracking
├── transactions/     # Transaction validation & processing
└── api/              # REST API routes
```

## API Endpoints

```
GET  /accounts/:id              # Get account details
POST /accounts                  # Create account
GET  /accounts/:id/balances     # Get balances
POST /transactions              # Submit transaction
GET  /transactions/:id          # Get transaction details
```

## Environment Variables

```env
PORT=8080
DATABASE_URL=postgres://...
NODE_ENV=development
```
