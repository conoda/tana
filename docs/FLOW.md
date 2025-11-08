# Tana - System Flows

> **Purpose:** Clear, actionable map of what users can do and what services/data are required.
> **Goal:** Identify MVP requirements and prioritize features.

---

## Core User Actions

### 1. User Creates Account

**What happens:**
```
User submits:
  - username
  - display_name
  - public_key
    ↓
POST /users
    ↓
Ledger Service validates:
  - username unique?
  - valid format?
    ↓
PostgreSQL INSERT
    ↓
Returns: user object with ID
```

**Services Required:**
- ✅ Ledger API (implemented)
- ✅ PostgreSQL (implemented)

**Database:**
```sql
INSERT INTO users (id, username, display_name, public_key, created_at)
VALUES (uuid, 'alice', 'Alice', 'pk_...', NOW())
```

**Status:** ✅ **READY**

---

### 2. User Checks Balance

**What happens:**
```
User queries: GET /balances?ownerId=alice&currencyCode=USD
    ↓
Ledger Service queries DB
    ↓
PostgreSQL SELECT
    ↓
Returns: { amount: "1000.00", currencyCode: "USD" }
```

**Services Required:**
- ✅ Ledger API (implemented)
- ✅ PostgreSQL (implemented)

**Database:**
```sql
SELECT amount, currency_code
FROM balances
WHERE owner_id = 'alice' AND currency_code = 'USD'
```

**Status:** ✅ **READY**

---

### 3. User Sends Funds (Direct Transfer)

**What happens:**
```
User submits: POST /transactions
  {
    from: "alice",
    to: "bob",
    amount: "100.00",
    currency: "USD"
  }
    ↓
Ledger Service validates:
  - Alice has balance >= 100?
  - Bob exists?
    ↓
BEGIN TRANSACTION
  UPDATE balances SET amount = amount - 100 WHERE owner_id = 'alice'
  UPDATE balances SET amount = amount + 100 WHERE owner_id = 'bob'
  INSERT INTO transactions (...)
COMMIT
    ↓
Returns: transaction ID
```

**Services Required:**
- ✅ Ledger API (implemented)
- ✅ PostgreSQL (implemented)

**Status:** ✅ **READY**

---

### 4. User Tests Contract in Playground

**What happens:**
```
User writes TypeScript in browser
    ↓
Clicks "Run"
    ↓
Browser sandbox (iframe) executes:
  - Transpiles TS → JS
  - Runs in isolated context
  - tana:* modules available
    ↓
Contract reads data:
  GET /balances (read-only)
    ↓
Contract simulates writes:
  tx.transfer() - staged locally
  tx.execute() - returns mock result
    ↓
Browser displays output
```

**Services Required:**
- ✅ Website/Playground (implemented)
- ✅ Ledger API for reads (implemented)
- ✅ Sandbox iframe (implemented)

**Database:**
- No writes (read-only simulation)

**Status:** ✅ **READY**

---

### 5. User Deploys Contract (Future - MVP?)

**What happens:**
```
User submits:
  POST /contracts/deploy
  {
    code: "...",
    name: "counter"
  }
    ↓
Contracts Service:
  - Validates TypeScript
  - Stores contract code
  - Generates contract ID
    ↓
PostgreSQL INSERT
    ↓
Returns: contract_id
```

**Services Required:**
- ⚠️ Contracts Service (exists but needs deployment workflow)
- ⚠️ Database schema for contracts (needs migration)

**Database:**
```sql
-- Need to create:
CREATE TABLE contracts (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  deployed_at TIMESTAMP DEFAULT NOW()
)
```

**Status:** ⚠️ **NEEDS WORK**

**MVP Decision:** Do we need contract deployment for launch, or is playground testing enough?

---

### 6. User Executes Contract (Future - MVP?)

**What happens:**
```
User calls:
  POST /contracts/:id/execute
  {
    args: {...}
  }
    ↓
Contracts Service:
  - Loads contract code from DB
  - Spawns Rust runtime process
  - Injects block context
    ↓
Runtime executes:
  - Reads state via tana:block (calls Ledger API)
  - Stages changes via tana:tx
  - Returns execution result
    ↓
Contracts Service validates:
  - Gas limit not exceeded?
  - Valid state transitions?
    ↓
If valid:
  POST /transactions (apply state changes)
    ↓
Returns: execution result
```

**Services Required:**
- ⚠️ Contracts Service (needs execution endpoint)
- ✅ Rust Runtime (implemented)
- ✅ Ledger API (implemented)
- ⚠️ Gas metering (needs implementation)

**Flow:**
```
POST /contracts/counter/execute
    ↓
Contracts Service → Rust Runtime → Ledger API
    ↓                    ↓              ↓
Load code          Execute TS      Read balances
    ↓                    ↓              ↓
                   Stage changes   Validate
    ↓                    ↓              ↓
Apply to DB ← Commit ← Return result
```

**Status:** ⚠️ **NEEDS WORK**

**MVP Decision:** Is contract execution necessary for launch, or can we start with playground-only?

---

### 7. Contract Reads Data (Runtime)

**What happens:**
```
Contract code:
  const balance = await block.getBalance('alice', 'USD')
    ↓
Runtime calls op_block_get_balance()
    ↓
Rust HTTP request:
  GET http://localhost:8080/balances?ownerId=alice&currencyCode=USD
    ↓
Ledger API queries PostgreSQL
    ↓
Returns: 1000.00
    ↓
Runtime returns to contract
```

**Services Required:**
- ✅ Rust Runtime (implemented)
- ✅ Ledger API (implemented)
- ✅ PostgreSQL (implemented)

**Status:** ✅ **READY**

---

### 8. Contract Writes Data (Runtime)

**What happens:**
```
Contract code:
  tx.transfer('alice', 'bob', 100, 'USD')
  const result = await tx.execute()
    ↓
Runtime stages change in memory
    ↓
On tx.execute():
  - Runtime validates changes
  - Calculates gas
  - Returns result to contract
    ↓
Contract returns execution result
    ↓
Contracts Service applies changes:
  POST /transactions
```

**Services Required:**
- ✅ Rust Runtime (implemented - staging)
- ⚠️ Contracts Service (needs commit logic)
- ✅ Ledger API (implemented)

**Current Gap:**
- Runtime can stage and validate
- **Missing:** Service to commit staged changes to DB

**Status:** ⚠️ **PARTIALLY READY**

---

### 9. User Deploys Website (Future)

**What happens:**
```
User uploads:
  - Static files (HTML, CSS, JS)
  - Framework build output
    ↓
Content Service:
  - Validates files
  - Stores in distributed storage
  - Generates content hash
    ↓
Registers domain:
  subdomain.tana.network → content_hash
    ↓
DNS/CDN serves content
```

**Services Required:**
- ❌ Content Service (not implemented)
- ❌ Storage layer (S3, IPFS, or custom)
- ❌ DNS integration (not implemented)

**Status:** ❌ **NOT STARTED**

**MVP Decision:** Defer to post-launch?

---

## MVP Priority Matrix

### Must Have (Week 1)
- ✅ User account creation
- ✅ Balance queries
- ✅ Playground contract testing
- ✅ Read-only blockchain data access

### Should Have (Week 2-3)
- ⚠️ Direct fund transfers (API exists, needs UI)
- ⚠️ Contract deployment storage
- ⚠️ Contract execution endpoint

### Nice to Have (Week 4+)
- ❌ Website deployment
- ❌ DNS resolution
- ❌ Multi-node consensus
- ❌ P2P networking

### Future
- Content delivery network
- Framework integrations
- Advanced querying
- Analytics

---

## Service Dependencies

### Currently Running
```
Website (Astro/Svelte)
    ↓ HTTPS
Ledger API (Bun/Hono)
    ↓ TCP
PostgreSQL
```

**Status:** ✅ This works end-to-end

### Needed for Contract Execution
```
Website
    ↓ HTTPS
Contracts Service (Bun)
    ↓ Subprocess
Rust Runtime
    ↓ HTTP
Ledger API
    ↓ TCP
PostgreSQL
```

**Status:** ⚠️ Needs Contracts Service deployment logic

### Future Full Stack
```
Website / CLI
    ↓ HTTPS
Node Service (consensus)
    ↓
Contracts Service
    ↓
Runtime + Ledger
    ↓
PostgreSQL + Redis
```

---

## Data Flow Patterns

### Pattern 1: Read-Only Query
```
User → Playground → Ledger API → PostgreSQL → Response
```
**Status:** ✅ Working

### Pattern 2: Simulated Execution
```
User → Playground → Browser Sandbox → Mock Result
```
**Status:** ✅ Working

### Pattern 3: Actual Execution (Future)
```
User → API → Contracts Service → Runtime → Ledger API → PostgreSQL
                    ↓
              Validate & Commit
```
**Status:** ⚠️ Missing commit logic

### Pattern 4: Direct Transfer
```
User → Ledger API → BEGIN TRANSACTION
                        ↓
                   Update balances
                        ↓
                   Insert transaction
                        ↓
                   COMMIT
```
**Status:** ✅ API ready, needs UI

---

## Quick Decision Guide

### For MVP Launch, do we need:

**User Accounts?**
- YES → Already have it ✅

**Balance Tracking?**
- YES → Already have it ✅

**Playground Testing?**
- YES → Already have it ✅

**Contract Deployment?**
- MAYBE → Can defer to post-launch?
- Users can test in playground without deploying
- Add deployment later as "production" feature

**Contract Execution?**
- MAYBE → Can defer to post-launch?
- Playground simulation might be enough for MVP
- Add real execution as "paid" feature later

**Fund Transfers?**
- PROBABLY → Need UI for this
- API already works
- Add transfer form to website

**Website Deployment?**
- NO → Defer to Phase 2
- Focus on contracts first

---

## Minimal MVP Scope

**Launch with:**
1. User accounts ✅
2. Balance queries ✅
3. Playground contract testing ✅
4. Documentation ✅

**Add in first update:**
5. Transfer UI (1-2 days)
6. Contract deployment (2-3 days)
7. Contract execution (3-5 days)

**This gets you:**
- Educational platform (playground)
- Working blockchain data layer
- Clear upgrade path
- Fast time-to-market

---

## Missing Pieces Analysis

### For Playground-Only MVP
- **Nothing!** All services ready ✅

### For Contract Deployment MVP
- Database migration for contracts table
- POST /contracts/deploy endpoint
- UI for deployment
- **Estimated:** 2-3 days

### For Contract Execution MVP
- POST /contracts/:id/execute endpoint
- Runtime process management
- Transaction commit logic
- Gas metering enforcement
- **Estimated:** 3-5 days

### For Website Deployment
- Complete content service
- Storage integration
- DNS system
- **Estimated:** 2-3 weeks

---

## Recommended MVP Path

**Phase 0: Launch Now** (Ready today)
- Deploy Ledger API
- Deploy Playground
- Users can test contracts
- Users can query balances

**Phase 1: Add Execution** (1-2 weeks)
- Contract deployment
- Contract execution
- Transfer UI

**Phase 2: Add Content** (3-4 weeks)
- Website deployment
- DNS resolution
- CDN integration

**Start with Phase 0, validate user interest, then build Phase 1.**

---

## Next Steps

1. **Decision:** MVP = Playground only, or include execution?
2. **If playground only:** Deploy this weekend ✅
3. **If include execution:** Plan 1-2 week sprint
4. **Either way:** Launch fast, iterate based on feedback

---

**Questions to resolve:**
- Do we need contract execution for launch?
- Do we need transfer UI for launch?
- Can website deployment wait until Phase 2?
- What's the minimum viable feature set for user value?
