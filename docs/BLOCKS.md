# Tana Blocks - Design & Implementation

## Current Status

❌ **NOT YET IMPLEMENTED**

What we have now:
- `block.height = 12345` (hardcoded mock value)
- `block.timestamp = Date.now()` (current time)
- `block.hash = "0x..."` (random mock hash)
- No blocks table in database
- No block production logic

What we need:
- Blocks table in PostgreSQL
- Genesis block creation
- Block production mechanism
- Transaction inclusion in blocks
- Block validation

---

## Block Structure

### Database Schema

```sql
CREATE TABLE blocks (
  -- Block identification
  height        BIGINT PRIMARY KEY,           -- 0 for genesis, then 1, 2, 3...
  hash          VARCHAR(64) NOT NULL UNIQUE,  -- SHA256 of block contents
  previous_hash VARCHAR(64) NOT NULL,         -- Hash of previous block (0x00... for genesis)

  -- Block metadata
  timestamp     TIMESTAMP NOT NULL,           -- Block creation time
  producer      UUID NOT NULL,                -- Node/user that produced this block

  -- Block contents
  tx_count      INTEGER NOT NULL DEFAULT 0,  -- Number of transactions
  state_root    VARCHAR(64) NOT NULL,         -- Merkle root of state after this block
  tx_root       VARCHAR(64),                  -- Merkle root of transactions (optional)

  -- Execution
  gas_used      BIGINT NOT NULL DEFAULT 0,    -- Total gas consumed in block
  gas_limit     BIGINT NOT NULL,              -- Maximum gas allowed

  -- Additional data
  metadata      JSONB,                        -- Extra data (contracts executed, etc.)
  signature     TEXT NOT NULL,                -- Producer's signature

  -- Timestamps
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  finalized_at  TIMESTAMP                     -- When block became final
);

-- Indexes
CREATE INDEX idx_blocks_timestamp ON blocks(timestamp DESC);
CREATE INDEX idx_blocks_producer ON blocks(producer);
CREATE INDEX idx_blocks_hash ON blocks(hash);
```

### TypeScript Interface

```typescript
interface Block {
  // Identity
  height: number          // Block number (0 = genesis)
  hash: string           // Block hash
  previousHash: string   // Previous block hash

  // Metadata
  timestamp: number      // Unix timestamp (ms)
  producer: string       // Producer ID

  // Contents
  txCount: number        // Number of transactions
  transactions: string[] // Array of transaction IDs
  stateRoot: string      // State merkle root
  txRoot?: string        // Transaction merkle root

  // Execution
  gasUsed: number        // Gas consumed
  gasLimit: number       // Gas limit

  // Extra
  metadata?: {
    contractsExecuted?: string[]
    version?: string
    [key: string]: any
  }
  signature: string      // Producer signature

  // Timestamps
  createdAt: Date
  finalizedAt?: Date
}
```

---

## Genesis Block (Block 0)

### What is the Genesis Block?

The **genesis block** is block #0 - the first block in the blockchain. It:
- Has no previous block (previousHash = 0x00...)
- Establishes initial state
- Contains no transactions (usually)
- Sets network parameters

### Tana Genesis Block Design

```typescript
{
  // Identity
  height: 0,
  hash: "0xa1b2c3d4e5f6...",  // Calculated from contents
  previousHash: "0x0000000000000000000000000000000000000000000000000000000000000000",

  // Metadata
  timestamp: 1730678400000,  // Nov 3, 2024 00:00:00 UTC (launch date)
  producer: "tana:genesis",  // Special genesis producer

  // Contents
  txCount: 0,                // No transactions in genesis
  transactions: [],
  stateRoot: "0x...",        // Initial state root

  // Execution
  gasUsed: 0,
  gasLimit: 1000000,         // Initial gas limit

  // Genesis metadata
  metadata: {
    version: "0.1.0",
    networkName: "tana",
    chainId: 1,              // Mainnet chain ID
    genesisMessage: "Tana blockchain - TypeScript smart contracts for commerce and content",

    // Initial parameters
    blockTime: 6000,         // Target 6 seconds per block
    gasLimitIncrease: 1.01,  // Can increase 1% per block

    // Initial accounts (if any)
    premine: {
      "treasury": {
        "USD": "1000000.00",  // $1M treasury
        "BTC": "1.00000000"   // 1 BTC
      }
    }
  },

  signature: "genesis_signature",

  createdAt: new Date("2024-11-03T00:00:00Z"),
  finalizedAt: new Date("2024-11-03T00:00:00Z")  // Genesis is immediately final
}
```

### Genesis Block Creation Script

```typescript
// scripts/create-genesis.ts
import { db } from '../ledger/src/db'
import { blocks } from '../ledger/src/db/schema'
import crypto from 'crypto'

async function createGenesisBlock() {
  console.log('Creating genesis block...')

  const genesisBlock = {
    height: 0,
    previousHash: '0'.repeat(64),
    timestamp: new Date('2024-11-03T00:00:00Z'),
    producer: 'tana:genesis',
    txCount: 0,
    gasUsed: 0,
    gasLimit: 1000000,
    metadata: {
      version: '0.1.0',
      networkName: 'tana',
      chainId: 1,
      genesisMessage: 'Tana blockchain - TypeScript smart contracts',
      blockTime: 6000,
      premine: {
        treasury: {
          USD: '1000000.00',
          BTC: '1.00000000'
        }
      }
    },
    signature: 'genesis_signature'
  }

  // Calculate state root (initial state)
  const stateRoot = calculateStateRoot()

  // Calculate block hash
  const hash = calculateBlockHash(genesisBlock, stateRoot)

  // Insert genesis block
  await db.insert(blocks).values({
    ...genesisBlock,
    hash,
    stateRoot,
    createdAt: new Date(),
    finalizedAt: new Date()
  })

  console.log('✓ Genesis block created!')
  console.log('  Height:', 0)
  console.log('  Hash:', hash)
  console.log('  State Root:', stateRoot)
}

function calculateBlockHash(block: any, stateRoot: string): string {
  const data = JSON.stringify({
    height: block.height,
    previousHash: block.previousHash,
    timestamp: block.timestamp.toISOString(),
    txCount: block.txCount,
    stateRoot,
    gasUsed: block.gasUsed,
    metadata: block.metadata
  })

  return crypto.createHash('sha256').update(data).digest('hex')
}

function calculateStateRoot(): string {
  // For genesis, this would be the root of initial state
  // Could be merkle root of initial balances, accounts, etc.
  const initialState = {
    accounts: 0,
    balances: 1, // Treasury
    version: '0.1.0'
  }

  return crypto.createHash('sha256')
    .update(JSON.stringify(initialState))
    .digest('hex')
}
```

---

## Block Production Flow

### Current State (MVP)
```
Transaction submitted
    ↓
Directly applied to database
    ↓
No block involved
```

### Future State (With Blocks)
```
1. Transactions submitted to mempool
    ↓
2. Block producer selects transactions
    ↓
3. Execute transactions in order
    ↓
4. Calculate state root
    ↓
5. Create block with:
   - Transactions included
   - State root
   - Gas used
    ↓
6. Sign block
    ↓
7. Insert block into database
    ↓
8. Update transactions.blockId
```

---

## Migration Path

### Phase 1: Add Blocks Table (No Block Production Yet)
```sql
-- Add blocks table
CREATE TABLE blocks (...);

-- Migrate existing data
-- Create a "pre-genesis" block with all existing transactions
INSERT INTO blocks (height, ...) VALUES (0, ...);

-- Update all transactions to reference genesis block
UPDATE transactions SET block_id = (SELECT id FROM blocks WHERE height = 0);
```

### Phase 2: Start Block Production
- Implement block producer service
- Move from instant transactions to mempool
- Produce blocks every 6 seconds
- Include transactions in blocks

### Phase 3: Consensus (Later)
- Add multiple validators
- Implement consensus mechanism
- Fork resolution
- Finality

---

## What We Need for MVP

### Option A: No Blocks Yet (Current)
✅ **Simplest** - Keep mocking block context
- Transactions go straight to database
- `block.height` is just a counter
- No block storage needed
- Good for initial testing

### Option B: Genesis Block + Simple Blocks
⚠️ **Medium complexity** - Add blocks table
- Create genesis block
- Put all transactions in sequential blocks
- No consensus needed (single producer)
- Enables blockchain explorer

### Option C: Full Block Production
❌ **Complex** - Full blockchain implementation
- Mempool
- Block producer
- Transaction ordering
- Gas optimization
- Needs more time

---

## Recommendation

**For MVP: Option A (No Blocks Yet)**

Why:
- Focus on smart contracts first
- Playground works without blocks
- Can add blocks later without breaking changes
- Users can test contracts now

**For V1 (Post-MVP): Option B**

Add after MVP launch:
1. Create blocks table migration
2. Generate genesis block
3. Create simple block producer (single node)
4. Start packaging transactions into blocks
5. Enable blockchain explorer

---

## Genesis Block Use Cases

### 1. Initial Distribution
```javascript
// Genesis block premines treasury
metadata: {
  premine: {
    "treasury": { "USD": "1000000.00" },
    "rewards-pool": { "USD": "500000.00" },
    "team": { "USD": "100000.00" }
  }
}
```

### 2. Network Parameters
```javascript
metadata: {
  version: "0.1.0",
  blockTime: 6000,        // 6 second blocks
  gasLimit: 1000000,      // 1M gas per block
  maxTxPerBlock: 1000,    // Max transactions
  minGasPrice: 1          // Minimum gas price
}
```

### 3. Initial Contracts
```javascript
metadata: {
  genesisContracts: {
    "treasury": "contract-id-1",
    "governance": "contract-id-2"
  }
}
```

---

## Implementation Checklist

### Database Schema
- [ ] Create blocks table migration
- [ ] Add indexes for performance
- [ ] Update transactions table (blockId foreign key)

### Genesis Block
- [ ] Define genesis block parameters
- [ ] Create genesis block creation script
- [ ] Calculate initial state root
- [ ] Sign genesis block
- [ ] Insert into database

### Block Production (Future)
- [ ] Mempool for pending transactions
- [ ] Block producer service
- [ ] Transaction selection algorithm
- [ ] Gas limit enforcement
- [ ] State root calculation
- [ ] Block signing
- [ ] Block propagation (if multi-node)

### API Updates
- [ ] GET /blocks - List blocks
- [ ] GET /blocks/:height - Get specific block
- [ ] GET /blocks/latest - Get latest block
- [ ] Update transaction API to include blockHeight
- [ ] Update runtime `block.*` properties with real data

---

## Example: Querying Genesis Block

Once implemented:

```typescript
import { console } from 'tana:core'
import { block } from 'tana:block'

// Get current block context
console.log('Current block:', block.height)
console.log('Block hash:', block.hash)
console.log('Produced by:', block.producer)

// In the future, could query historical blocks
const genesis = await block.getBlock(0)
console.log('Genesis:', genesis.metadata.genesisMessage)
console.log('Network:', genesis.metadata.networkName)
console.log('Chain ID:', genesis.metadata.chainId)
```

---

## Summary

**Current State:**
- No real blocks, just mock context
- Transactions applied directly to database
- Works fine for playground and testing

**Genesis Block Design:**
- Block #0 with previousHash = 0x00...
- Contains network parameters
- Optional premine for initial distribution
- Establishes chain identity

**Next Steps:**
1. Finish MVP without blocks (keep it simple)
2. Post-MVP: Add blocks table + genesis block
3. Later: Implement proper block production
4. Much later: Add consensus mechanism

**Decision Point:** Do you want blocks for MVP, or add them after launch?
