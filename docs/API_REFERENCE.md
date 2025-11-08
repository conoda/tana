# Tana API Reference - Quick Guide

> **Copy-paste examples for all Tana modules**

---

## 🎯 Quick Test Template

```typescript
import { console } from 'tana:core'
import { data } from 'tana:data'
import { fetch } from 'tana:utils'
import { block } from 'tana:block'
import { tx } from 'tana:tx'

console.log('Hello from Tana!')
// Add your test code here
```

---

## `tana:core` - Console & Version Info

### `console.log(...args)`
Print messages to output
```typescript
import { console } from 'tana:core'

console.log('Hello world')
console.log('Number:', 42)
console.log('Object:', { name: 'Alice', age: 30 })
console.log('Multiple', 'arguments', 'work', 'too')
```

### `console.error(...args)`
Print error messages
```typescript
import { console } from 'tana:core'

console.error('Something went wrong!')
console.error('Error code:', 500)
```

### `version`
Get runtime version info
```typescript
import { console, version } from 'tana:core'

console.log('Version info:', version)
// { tana: "0.1.0", deno_core: "0.338.0", v8: "134.5.0" }
```

---

## `tana:data` - Key-Value Storage

### Storage Limits
```typescript
import { data } from 'tana:data'

// Constants
data.MAX_KEY_SIZE      // 256 bytes
data.MAX_VALUE_SIZE    // 10,240 bytes (10 KB)
data.MAX_TOTAL_SIZE    // 102,400 bytes (100 KB)
data.MAX_KEYS          // 1,000 keys
```

### `data.set(key, value)`
Store a value (staged until commit)
```typescript
import { data } from 'tana:data'

// Store string
await data.set('username', 'alice')

// Store number as string
await data.set('count', '42')

// Store object (auto-serialized to JSON)
await data.set('user', {
  name: 'Alice',
  age: 30,
  active: true
})
```

### `data.get(key)`
Retrieve a value
```typescript
import { console } from 'tana:core'
import { data } from 'tana:data'

const username = await data.get('username')
console.log('Username:', username)  // "alice"

const user = await data.get('user')
console.log('User:', user)  // { name: "Alice", age: 30, active: true }

const missing = await data.get('nonexistent')
console.log('Missing:', missing)  // null
```

### `data.has(key)`
Check if key exists
```typescript
import { console } from 'tana:core'
import { data } from 'tana:data'

const exists = await data.has('username')
console.log('Username exists:', exists)  // true
```

### `data.delete(key)`
Delete a key (staged until commit)
```typescript
import { data } from 'tana:data'

await data.delete('username')
```

### `data.keys(pattern?)`
List all keys, optionally with glob pattern
```typescript
import { console } from 'tana:core'
import { data } from 'tana:data'

// Get all keys
const allKeys = await data.keys()
console.log('All keys:', allKeys)

// Pattern matching
await data.set('user:1:name', 'Alice')
await data.set('user:2:name', 'Bob')
await data.set('config:theme', 'dark')

const userKeys = await data.keys('user:*')
console.log('User keys:', userKeys)  // ['user:1:name', 'user:2:name']
```

### `data.entries()`
Get all key-value pairs
```typescript
import { console } from 'tana:core'
import { data } from 'tana:data'

const all = await data.entries()
console.log('All data:', all)
// { username: "alice", count: "42", user: {...} }
```

### `data.clear()`
Delete all data
```typescript
import { data } from 'tana:data'

await data.clear()
await data.commit()
```

### `data.commit()`
**IMPORTANT:** Persist all staged changes
```typescript
import { data } from 'tana:data'

// Changes are STAGED (not saved yet)
await data.set('key1', 'value1')
await data.set('key2', 'value2')
await data.delete('key3')

// Now COMMIT to persist
await data.commit()
```

### Complete Storage Example
```typescript
import { console } from 'tana:core'
import { data } from 'tana:data'

// Read current counter
const current = await data.get('counter')
const count = current ? parseInt(current) : 0

console.log('Current count:', count)

// Increment and save
await data.set('counter', String(count + 1))
await data.set('lastUpdated', new Date().toISOString())
await data.commit()

console.log('Counter incremented to:', count + 1)
```

---

## `tana:utils` - Utilities

### `fetch(url, options?)`
HTTP requests (domain whitelist enforced)
```typescript
import { console } from 'tana:core'
import { fetch } from 'tana:utils'

// Simple GET request
const response = await fetch('https://pokeapi.co/api/v2/pokemon/pikachu')
const text = await response.text()
const pokemon = JSON.parse(text)

console.log('Pokemon:', pokemon.name)
console.log('Height:', pokemon.height)
console.log('Weight:', pokemon.weight)
```

### Allowed Domains
```typescript
// Whitelisted domains:
// - pokeapi.co (for testing)
// - tana.network
// - blockchain.tana.network
// - localhost / 127.0.0.1
```

### Fetch with Error Handling
```typescript
import { console } from 'tana:core'
import { fetch } from 'tana:utils'

try {
  const response = await fetch('https://pokeapi.co/api/v2/pokemon/ditto')
  const data = JSON.parse(await response.text())
  console.log('Success:', data.name)
} catch (error) {
  console.error('Fetch failed:', error.message)
}
```

---

## `tana:block` - Blockchain State Queries

### Block Context Properties
```typescript
import { console } from 'tana:core'
import { block } from 'tana:block'

console.log('Block height:', block.height)
console.log('Timestamp:', block.timestamp)
console.log('Hash:', block.hash)
console.log('Previous hash:', block.previousHash)
console.log('Executor:', block.executor)
console.log('Contract ID:', block.contractId)
console.log('Gas limit:', block.gasLimit)
console.log('Gas used:', block.gasUsed)
console.log('Max batch query:', block.MAX_BATCH_QUERY)  // 10
```

### `block.getUser(userId)`
Query single user
```typescript
import { console } from 'tana:core'
import { block } from 'tana:block'

const user = await block.getUser('@alice')

if (user) {
  console.log('User found:')
  console.log('  Username:', user.username)
  console.log('  Display Name:', user.displayName)
  console.log('  ID:', user.id)
  console.log('  Public Key:', user.publicKey)
  console.log('  Created:', user.createdAt)
} else {
  console.log('User not found')
}
```

### `block.getUser(userIds[])`
Batch query users (max 10)
```typescript
import { console } from 'tana:core'
import { block } from 'tana:block'

const usernames = ['@alice', '@bob', '@charlie']
const users = await block.getUser(usernames)

users.forEach((user, i) => {
  if (user) {
    console.log(`${i + 1}. ${user.username} - ${user.displayName}`)
  } else {
    console.log(`${i + 1}. ${usernames[i]} - Not found`)
  }
})
```

### `block.getBalance(userId, currency)`
Query single balance
```typescript
import { console } from 'tana:core'
import { block } from 'tana:block'

const balance = await block.getBalance('alice-id-here', 'USD')
console.log('Balance:', balance, 'USD')  // Returns number
```

### `block.getBalance(userIds[], currency)`
Batch query balances (max 10)
```typescript
import { console } from 'tana:core'
import { block } from 'tana:block'

const userIds = ['alice-id', 'bob-id', 'charlie-id']
const balances = await block.getBalance(userIds, 'USD')

balances.forEach((bal, i) => {
  console.log(`${userIds[i]}: $${bal.toFixed(2)}`)
})
```

### `block.getTransaction(txId)`
Query single transaction
```typescript
import { console } from 'tana:core'
import { block } from 'tana:block'

const tx = await block.getTransaction('tx-id-here')

if (tx) {
  console.log('Transaction found:')
  console.log('  From:', tx.fromId)
  console.log('  To:', tx.toId)
  console.log('  Amount:', tx.amount, tx.currencyCode)
  console.log('  Status:', tx.status)
  console.log('  Created:', tx.createdAt)
}
```

### `block.getBlock(height)`
Query single block by height
```typescript
import { console } from 'tana:core'
import { block } from 'tana:block'

const genesisBlock = await block.getBlock(0)

if (genesisBlock) {
  console.log('Block found:')
  console.log('  Height:', genesisBlock.height)
  console.log('  Hash:', genesisBlock.hash)
  console.log('  Timestamp:', new Date(genesisBlock.timestamp).toISOString())
  console.log('  Producer:', genesisBlock.producer)
  console.log('  Gas Limit:', genesisBlock.gasLimit)
  console.log('  Metadata:', genesisBlock.metadata)
}
```

### `block.getBlock(heights[])`
Batch query blocks (max 10)
```typescript
import { console } from 'tana:core'
import { block } from 'tana:block'

const heights = [0, 1, 2]
const blocks = await block.getBlock(heights)

blocks.forEach((blk, i) => {
  if (blk) {
    console.log(`Block ${heights[i]}: height=${blk.height}, hash=${blk.hash.substring(0, 10)}...`)
  } else {
    console.log(`Block ${heights[i]}: Not found`)
  }
})
```

### `block.getLatestBlock()`
Get the latest block
```typescript
import { console } from 'tana:core'
import { block } from 'tana:block'

const latest = await block.getLatestBlock()

if (latest) {
  console.log('Latest block:')
  console.log('  Height:', latest.height)
  console.log('  Hash:', latest.hash)
  console.log('  Timestamp:', new Date(latest.timestamp).toISOString())
  console.log('  Transactions:', latest.txCount)
}
```

### Complete Blockchain Query Example
```typescript
import { console } from 'tana:core'
import { block } from 'tana:block'

console.log('Block:', block.height, 'at', new Date(block.timestamp).toISOString())

// Query user
const user = await block.getUser('@alice')
if (user) {
  console.log('\nUser:', user.displayName)

  // Query their balance
  const balance = await block.getBalance(user.id, 'USD')
  console.log('Balance: $' + balance.toFixed(2))
}
```

---

## `tana:tx` - Transaction Staging

### `tx.transfer(from, to, amount, currency)`
Stage a transfer
```typescript
import { console } from 'tana:core'
import { tx } from 'tana:tx'

tx.transfer('alice-id', 'bob-id', 100, 'USD')
console.log('Transfer staged')
```

### `tx.setBalance(userId, amount, currency)`
Stage a balance update
```typescript
import { console } from 'tana:core'
import { tx } from 'tana:tx'

tx.setBalance('alice-id', 500, 'USD')
console.log('Balance update staged')
```

### `tx.getChanges()`
View pending changes
```typescript
import { console } from 'tana:core'
import { tx } from 'tana:tx'

tx.transfer('alice-id', 'bob-id', 100, 'USD')
tx.transfer('bob-id', 'charlie-id', 50, 'USD')

const changes = tx.getChanges()
console.log('Pending changes:', changes.length)
console.log('Changes:', changes)
```

### `tx.execute()`
Execute transaction (validate & commit)
```typescript
import { console } from 'tana:core'
import { tx } from 'tana:tx'

tx.transfer('alice-id', 'bob-id', 100, 'USD')

const result = await tx.execute()

if (result.success) {
  console.log('✓ Transaction succeeded!')
  console.log('Gas used:', result.gasUsed)
  console.log('Changes applied:', result.changes)
} else {
  console.error('✗ Transaction failed:', result.error)
}
```

### Complete Transaction Example
```typescript
import { console } from 'tana:core'
import { block } from 'tana:block'
import { tx } from 'tana:tx'

console.log('=== Transaction Example ===\n')

// Current block context
console.log('Executing in block:', block.height)
console.log('Executor:', block.executor)

// Stage transfers
tx.transfer(block.executor, 'treasury', 5, 'USD')
tx.transfer(block.executor, 'rewards-pool', 2, 'USD')

// Check what's staged
const pending = tx.getChanges()
console.log('\nPending changes:', pending.length)

// Execute
const result = await tx.execute()

if (result.success) {
  console.log('\n✓ Transaction executed!')
  console.log('Gas used:', result.gasUsed, '/', block.gasLimit)

  result.changes.forEach((change, i) => {
    console.log(`  ${i + 1}. ${change.type}:`, change.amount, change.currency)
  })
} else {
  console.error('\n✗ Failed:', result.error)
}
```

---

## 📋 Complete Working Examples

### Example 1: Simple Counter
```typescript
import { console } from 'tana:core'
import { data } from 'tana:data'

const current = await data.get('counter')
const count = current ? parseInt(current) : 0

console.log('Count:', count)

await data.set('counter', String(count + 1))
await data.commit()

console.log('Incremented to:', count + 1)
```

### Example 2: User Profile & Balance
```typescript
import { console } from 'tana:core'
import { block } from 'tana:block'

const user = await block.getUser('@alice')

if (user) {
  console.log('Profile:', user.displayName)

  const balance = await block.getBalance(user.id, 'USD')
  console.log('Balance: $' + balance.toFixed(2))
} else {
  console.log('User not found')
}
```

### Example 3: External API + Storage
```typescript
import { console } from 'tana:core'
import { data } from 'tana:data'
import { fetch } from 'tana:utils'

// Fetch external data
const response = await fetch('https://pokeapi.co/api/v2/pokemon/pikachu')
const pokemon = JSON.parse(await response.text())

console.log('Fetched:', pokemon.name)

// Store it
await data.set('lastPokemon', pokemon.name)
await data.set('lastFetch', Date.now())
await data.commit()

console.log('Saved to storage!')
```

### Example 4: Transaction Flow
```typescript
import { console } from 'tana:core'
import { block } from 'tana:block'
import { tx } from 'tana:tx'
import { data } from 'tana:data'

// Get current user
const user = await block.getUser('@alice')

if (user) {
  // Check balance
  const balance = await block.getBalance(user.id, 'USD')
  console.log('Current balance:', balance)

  // Stage transfer
  tx.transfer(user.id, 'treasury', 10, 'USD')

  // Execute
  const result = await tx.execute()

  if (result.success) {
    // Log to storage
    await data.set('lastTransfer', {
      amount: 10,
      timestamp: Date.now(),
      gasUsed: result.gasUsed
    })
    await data.commit()

    console.log('✓ Transfer complete!')
  }
}
```

### Example 5: Batch Processing
```typescript
import { console } from 'tana:core'
import { block } from 'tana:block'

// Query multiple users at once
const usernames = ['@alice', '@bob', '@charlie']
const users = await block.getUser(usernames)

// Filter out nulls (users not found)
const validUsers = users.filter(u => u !== null)

console.log(`Found ${validUsers.length}/${usernames.length} users`)

// Get their IDs
const userIds = validUsers.map(u => u.id)

// Batch query balances
const balances = await block.getBalance(userIds, 'USD')

// Display results
validUsers.forEach((user, i) => {
  console.log(`${user.username}: $${balances[i].toFixed(2)}`)
})
```

---

## ⚠️ Important Notes

### Staging vs Commit
- `data.set()`, `data.delete()` are **staged** (not saved)
- Must call `data.commit()` to persist changes
- `tx.transfer()`, `tx.setBalance()` are also **staged**
- Must call `tx.execute()` to apply transaction

### Limits
- **Storage:** 256B keys, 10KB values, 100KB total, 1000 keys
- **Batch queries:** Max 10 items per query
- **Gas:** Tracked per transaction (limit: 1,000,000)

### Playground vs Runtime
- **Playground:** `tx.execute()` is simulated (no real state changes)
- **Runtime:** `tx.execute()` actually modifies blockchain state
- Both have same API for testing compatibility

### Error Handling
```typescript
import { console } from 'tana:core'
import { data } from 'tana:data'

try {
  await data.set('key', 'value')
  await data.commit()
  console.log('Success!')
} catch (error) {
  console.error('Error:', error.message)
}
```

---

## 🚀 Quick Start Templates

Copy these to get started fast!

### Minimal Test
```typescript
import { console } from 'tana:core'

console.log('Hello from Tana!')
console.log('Testing:', Date.now())
```

### Data Storage Test
```typescript
import { console } from 'tana:core'
import { data } from 'tana:data'

await data.set('test', 'Hello World')
await data.commit()

const value = await data.get('test')
console.log('Retrieved:', value)
```

### Blockchain Query Test
```typescript
import { console } from 'tana:core'
import { block } from 'tana:block'

console.log('Block:', block.height)
console.log('Timestamp:', new Date(block.timestamp).toISOString())

const user = await block.getUser('@alice')
console.log('User:', user ? user.displayName : 'Not found')
```

### Full Integration Test
```typescript
import { console, version } from 'tana:core'
import { data } from 'tana:data'
import { block } from 'tana:block'
import { tx } from 'tana:tx'

console.log('Version:', version.tana)
console.log('Block:', block.height)

// Store run count
const runs = await data.get('runs')
const count = runs ? parseInt(runs) : 0
await data.set('runs', String(count + 1))
await data.commit()

console.log('This contract has run', count + 1, 'times')
```

---

**Need help?** Check `/docs/FLOW.md` for system architecture and data flows.
