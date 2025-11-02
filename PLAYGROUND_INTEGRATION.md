# Playground + Blockchain Integration

## 🎉 What Was Built

The playground now provides a complete **state → code → results** feedback loop, allowing you to query and interact with the actual blockchain ledger in real-time during development.

## ✨ New Features

### 1. Tabbed State Viewer

The right panel now has **5 tabs**:

- **Results** - Code execution output (console.log)
- **Users** - All user accounts on the blockchain
- **Balances** - All account balances (multi-currency)
- **Transactions** - Transaction history
- **Currencies** - Supported currencies (USD, BTC, ETH, etc.)

### 2. New `tana:ledger` Module

Smart contracts can now query blockchain state:

```typescript
import { ledger } from 'tana:ledger'

// Get all users
const users = await ledger.getUsers()

// Get specific user
const user = await ledger.getUser(userId)

// Get user balances
const balances = await ledger.getUserBalances(userId)

// Get all balances
const allBalances = await ledger.getBalances()

// Get all transactions
const transactions = await ledger.getTransactions()

// Get supported currencies
const currencies = await ledger.getCurrencies()
```

### 3. Auto-Refreshing State

- State refreshes **every 5 seconds** automatically
- Manual refresh button in the tab bar
- Shows last update timestamp

### 4. Full TypeScript Support

Complete IntelliSense for the ledger API with type definitions:

```typescript
interface User {
  id: string
  publicKey: string
  username: string
  displayName: string
  bio: string | null
  // ... more fields
}

interface Balance {
  id: string
  ownerId: string
  ownerType: 'user' | 'team'
  currencyCode: string
  amount: string
  updatedAt: string
}

// ... more types
```

## 🏗️ Architecture

### Files Created/Modified

**New Files:**
- `website/src/lib/ledgerApi.ts` - TypeScript ledger API client
- `website/src/components/StateViewer.svelte` - Tabbed state viewer component
- `website/src/defaultCode_ledger.ts` - Example code demonstrating ledger API

**Modified Files:**
- `website/src/components/Editor.svelte` - Integrated StateViewer, added type definitions
- `website/src/pages/sandbox.astro` - Added `tana:ledger` module to runtime

### Data Flow

```
┌─────────────────────────────────────────────────────┐
│                   PLAYGROUND                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────┐         ┌──────────────────┐   │
│  │  Code Editor  │         │  State Viewer    │   │
│  │   (Monaco)    │         │                  │   │
│  │               │         │  [Results] Tab   │   │
│  │ import {...}  │         │  [Users] Tab     │   │
│  │ from          │         │  [Balances] Tab  │   │
│  │ 'tana:ledger' │         │  [Transactions]  │   │
│  │               │         │  [Currencies]    │   │
│  │ const users = │         │                  │   │
│  │ await ledger  │         │  Auto-refresh    │   │
│  │ .getUsers()   │         │  every 5s        │   │
│  └───────┬───────┘         └────────┬─────────┘   │
│          │                          │             │
│          │ Execute                  │ Fetch       │
│          ▼                          ▼             │
│  ┌───────────────────────────────────────────┐   │
│  │     Sandboxed Runtime (iframe)            │   │
│  │                                            │   │
│  │  tana:ledger module                        │   │
│  │  → whitelistedFetch(localhost:8080/...)   │   │
│  └─────────────────┬─────────────────────────┘   │
│                    │                              │
└────────────────────┼──────────────────────────────┘
                     │
                     │ HTTP Requests
                     ▼
          ┌──────────────────────┐
          │   Ledger Service     │
          │   localhost:8080     │
          │                      │
          │  GET /users          │
          │  GET /balances       │
          │  GET /transactions   │
          │  GET /currencies     │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   PostgreSQL         │
          │   (Blockchain State) │
          └──────────────────────┘
```

## 🧪 Testing the Integration

### 1. Start the Development Environment

```bash
npm run dev
```

This starts:
- PostgreSQL (database)
- Redis (cache)
- Ledger service (port 8080)
- Website (port 4322)

### 2. Seed Test Data (if empty)

```bash
# Seed currencies
curl -X POST http://localhost:8080/balances/currencies/seed

# Create a test user
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{
    "publicKey": "test_key_alice",
    "username": "@alice",
    "displayName": "Alice Johnson",
    "bio": "First user on Tana blockchain"
  }'

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

### 3. Open the Playground

Navigate to: http://localhost:4322/playground

The default code will automatically:
1. Query all users
2. Display all balances
3. Show supported currencies
4. Show detailed info for the first user

### 4. Explore the Tabs

- **Results tab** - See the execution output
- **Users tab** - Browse all user accounts
- **Balances tab** - View all balances
- **Transactions tab** - See transaction history
- **Currencies tab** - View supported currencies

### 5. Write Your Own Queries

Try modifying the code:

```typescript
import { console } from 'tana:core'
import { ledger } from 'tana:ledger'

// Find users with specific criteria
const users = await ledger.getUsers()
const richUsers = users.filter(user => {
  // Your logic here
  return true
})

console.log(`Found ${richUsers.length} rich users`)

// Calculate total supply
const balances = await ledger.getBalances()
const usdTotal = balances
  .filter(b => b.currencyCode === 'USD')
  .reduce((sum, b) => sum + parseFloat(b.amount), 0)

console.log(`Total USD in system: $${usdTotal.toFixed(2)}`)
```

## 🎯 Benefits for Development

### 1. Immediate Feedback Loop

**Before:** Write code → Deploy → Check logs → Debug
**Now:** Write code → See results immediately → See state changes in tabs

### 2. Visual State Inspection

No need to manually curl the API or check the database. All state is visible in tabs with auto-refresh.

### 3. Rapid Prototyping

Test smart contract logic against real blockchain data without deploying anything.

### 4. Debugging

See exactly what data contracts are working with. Compare execution results with blockchain state.

### 5. Learning

New developers can explore the blockchain state and experiment with queries interactively.

## 🔮 Future Enhancements

- [ ] Add "Block Explorer" tab showing block history
- [ ] Add ability to **submit** transactions from playground
- [ ] Add network stats (block height, TPS, etc.)
- [ ] Add "Contract State" tab showing deployed contracts
- [ ] Add diff view showing state changes after execution
- [ ] Add time-travel debugging (view state at specific block)
- [ ] Add GraphQL query builder for complex queries
- [ ] Add ability to impersonate users for testing

## 📊 Usage Examples

### Example 1: User Directory

```typescript
import { console } from 'tana:core'
import { ledger } from 'tana:ledger'

const users = await ledger.getUsers()

console.log('👥 User Directory')
console.log('================')

for (const user of users) {
  const balances = await ledger.getUserBalances(user.id)
  const totalUSD = balances
    .filter(b => b.currencyCode === 'USD')
    .reduce((sum, b) => sum + parseFloat(b.amount), 0)

  console.log(`${user.username} - $${totalUSD.toFixed(2)} USD`)
}
```

### Example 2: Currency Stats

```typescript
import { console } from 'tana:core'
import { ledger } from 'tana:ledger'

const balances = await ledger.getBalances()
const currencies = await ledger.getCurrencies()

for (const currency of currencies) {
  const currencyBalances = balances.filter(
    b => b.currencyCode === currency.code
  )

  const total = currencyBalances.reduce(
    (sum, b) => sum + parseFloat(b.amount),
    0
  )

  const holders = new Set(currencyBalances.map(b => b.ownerId)).size

  console.log(`${currency.symbol} ${currency.code}`)
  console.log(`  Total Supply: ${total.toFixed(currency.decimals)}`)
  console.log(`  Holders: ${holders}`)
  console.log('')
}
```

### Example 3: Rich List

```typescript
import { console } from 'tana:core'
import { ledger } from 'tana:ledger'

const users = await ledger.getUsers()
const balances = await ledger.getBalances()

// Calculate net worth for each user
const netWorth = users.map(user => {
  const userBalances = balances.filter(b => b.ownerId === user.id)
  const totalUSD = userBalances
    .filter(b => b.currencyCode === 'USD')
    .reduce((sum, b) => sum + parseFloat(b.amount), 0)

  return { user, totalUSD }
})

// Sort by richest first
netWorth.sort((a, b) => b.totalUSD - a.totalUSD)

console.log('💎 Rich List (Top 10)')
console.log('====================')

netWorth.slice(0, 10).forEach((item, i) => {
  console.log(`${i+1}. ${item.user.username} - $${item.totalUSD.toFixed(2)}`)
})
```

## 🔒 Security

The playground runs in a sandboxed iframe with restricted permissions:

- ✅ Can only fetch from whitelisted domains (including localhost:8080)
- ✅ No access to dangerous APIs (indexedDB, localStorage, navigator, etc.)
- ✅ Code executes in isolation from the main page
- ✅ Read-only access to blockchain state (no mutations from playground yet)

## 🚀 Next Steps

Now that you have visibility into the blockchain state, you can:

1. **Test smart contract logic** with real data
2. **Debug issues** by inspecting state
3. **Prototype features** rapidly
4. **Learn the API** interactively
5. **Develop the protocol** with immediate feedback

The playground is now a powerful development tool for building and testing the Tana blockchain! 🎉
