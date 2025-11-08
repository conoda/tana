# Next Step: Integrate Ledger into CLI Binary

## Goal

Make `tana start` run the ledger HTTP server directly within the CLI process, eliminating the need for a separate ledger service.

## Current State

**What works:**
- CLI commands for creating chains, users, contracts ✓
- Config management system ✓
- Ledger runs separately as `bun run ledger/src/index.ts` ✓
- Deploy commands can talk to running ledger ✓

**What doesn't work:**
- `tana start` just shows placeholder message
- Ledger must be started manually
- Two separate processes (not ideal for single binary distribution)

## Target State

**After integration:**
```bash
# User runs this:
tana start

# CLI starts HTTP server within itself (foreground)
# Blocks and serves on http://localhost:8080
# Ctrl+C stops the server gracefully
```

The `tana` binary becomes both:
- A CLI tool (when running commands)
- An HTTP server (when running `tana start`)

## Implementation Plan

### Step 1: Understand Current Ledger Structure

**Files to review:**
```
ledger/
├── src/
│   ├── index.ts              # Main entry point (Hono app)
│   ├── db/
│   │   ├── index.ts          # Database connection & schema exports
│   │   └── schema.ts         # Drizzle schema
│   ├── api/
│   │   ├── routes/
│   │   │   ├── users.ts      # User endpoints
│   │   │   ├── balances.ts   # Balance endpoints
│   │   │   ├── transactions.ts
│   │   │   ├── blocks.ts
│   │   │   └── contracts.ts
│   │   └── schemas.ts        # Zod validation schemas
│   ├── accounts/
│   │   └── users.ts          # User business logic
│   ├── balances/
│   │   └── index.ts          # Balance business logic
│   ├── transactions/
│   │   └── index.ts          # Transaction business logic
│   ├── blockchain/
│   │   └── blocks.ts         # Block production logic
│   └── contracts/
│       └── index.ts          # Contract management
└── package.json
```

**Key insight:** `ledger/src/index.ts` exports a Hono app that can be imported directly!

### Step 2: Copy/Reference Ledger Code

**Option A: Direct Import (Recommended)**
- Add ledger as dependency in `cli/package.json`
- Import ledger app directly into CLI
- No code duplication

**Option B: Copy Code**
- Copy ledger source into `cli/src/ledger/`
- Maintain two copies (not ideal)

**Go with Option A:**

1. **Update `cli/package.json`:**
```json
{
  "dependencies": {
    "drizzle-orm": "^0.x.x",
    "postgres": "^3.x.x",
    "@hono/zod-validator": "^0.x.x",
    "zod": "^3.x.x",
    // ... other ledger dependencies
  }
}
```

2. **Or use workspace reference:**
```json
{
  "dependencies": {
    "@tana/ledger": "workspace:*"
  }
}
```

Then in `ledger/package.json`, add:
```json
{
  "name": "@tana/ledger",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

### Step 3: Create Ledger Server Module in CLI

**Create: `cli/core/ledger/server.ts`**

```typescript
/**
 * Ledger HTTP Server
 *
 * Runs the ledger service within the CLI process
 */

import { serve } from 'bun'
import chalk from 'chalk'

export interface LedgerConfig {
  port: number
  chain: string
  databaseUrl: string
}

export async function startLedger(config: LedgerConfig) {
  console.log(chalk.gray('━'.repeat(50)))
  console.log(chalk.bold('Starting Ledger Service...'))
  console.log(chalk.gray('━'.repeat(50)))
  console.log()

  // Set environment variables
  process.env.PORT = String(config.port)
  process.env.DATABASE_URL = config.databaseUrl

  // Import ledger app
  // This will work if ledger is set up as workspace dependency
  const ledger = await import('../../../ledger/src/index')

  // Start Bun server
  const server = serve({
    port: config.port,
    fetch: ledger.default.fetch,
  })

  console.log(chalk.green('✓ Ledger service started\n'))
  console.log(chalk.gray('━'.repeat(50)))
  console.log(chalk.bold('Service Running:'))
  console.log(`  URL:     ${chalk.cyan(`http://localhost:${config.port}`)}`)
  console.log(`  Chain:   ${chalk.cyan(config.chain)}`)
  console.log(`  PID:     ${chalk.gray(process.pid)}`)
  console.log(chalk.gray('━'.repeat(50)))
  console.log()
  console.log(chalk.gray('Press Ctrl+C to stop'))
  console.log()

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nShutting down...'))
    server.stop()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n\nShutting down...'))
    server.stop()
    process.exit(0)
  })

  // Keep process alive
  await new Promise(() => {}) // Block forever
}
```

### Step 4: Update `tana start` Command

**Edit: `cli/core/service/start.ts`**

```typescript
import chalk from 'chalk'
import {
  readGlobalConfig,
  isLocalChainRunning
} from '../../utils/config'
import { startLedger } from '../ledger/server'

export async function start(chainName?: string) {
  console.log(chalk.bold('\n🚀 Starting Tana...\n'))

  // Check if already running
  if (await isLocalChainRunning()) {
    console.log(chalk.yellow('✗ Ledger already running on port 8080'))
    console.log(chalk.gray(`\nStop the other instance first.\n`))
    process.exit(1)
  }

  // Determine which chain to start
  let targetChain = chainName
  if (!targetChain) {
    const config = readGlobalConfig()
    targetChain = config?.defaultChain || 'local'
  }

  // Start ledger server
  await startLedger({
    port: 8080,
    chain: targetChain,
    databaseUrl: process.env.DATABASE_URL ||
      'postgres://tana:tana_dev_password@localhost:5432/tana'
  })
}
```

### Step 5: Handle Dependencies

**Check database connection:**

The ledger needs PostgreSQL running. Options:

1. **Require user to start database first:**
   ```bash
   # User does this:
   docker compose up postgres -d

   # Then runs:
   tana start
   ```

2. **Auto-start database (future enhancement):**
   - CLI spawns PostgreSQL container
   - Manages database lifecycle

**For now, go with Option 1** - document that Postgres must be running.

### Step 6: Update Package Dependencies

**Run from CLI directory:**

```bash
cd cli
bun install
bun add drizzle-orm postgres @hono/zod-validator zod hono
```

Or if using workspace reference:

**Update root `package.json`:**
```json
{
  "workspaces": [
    "cli",
    "ledger",
    "runtime",
    "website"
  ]
}
```

**Update `cli/package.json`:**
```json
{
  "dependencies": {
    "@tana/ledger": "workspace:*"
  }
}
```

Then run:
```bash
bun install
```

### Step 7: Testing

**Test the integration:**

```bash
# 1. Start database
docker compose up postgres -d

# 2. Run ledger via CLI
cd cli
bun main.ts start

# Should see:
# ✓ Ledger service started
# URL: http://localhost:8080
# (blocking, waiting for requests)

# 3. In another terminal, test API
curl http://localhost:8080/health

# Should return: {"status":"ok"}

# 4. Test full flow
bun main.ts new user @alice --name "Alice"
bun main.ts deploy user @alice

# 5. Verify user was created
curl http://localhost:8080/users

# 6. Stop server with Ctrl+C
```

## Potential Issues & Solutions

### Issue 1: Module Resolution

**Problem:** CLI can't find ledger imports

**Solution:**
```typescript
// Instead of:
import ledger from '@tana/ledger'

// Use absolute path:
import ledger from '../../../ledger/src/index'

// Or use require:
const ledger = require('../../../ledger/src/index')
```

### Issue 2: TypeScript Errors

**Problem:** Type mismatches between CLI and ledger

**Solution:**
- Ensure both use same TypeScript version
- Share types via `types/` directory
- Use `any` temporarily and fix later

### Issue 3: Database Connection

**Problem:** Database not running

**Solution:**
- Check connection before starting server
- Show helpful error message
- Suggest `docker compose up postgres -d`

### Issue 4: Port Already in Use

**Problem:** Port 8080 already taken

**Solution:**
- Check with `isLocalChainRunning()` first
- Show which process is using the port
- Suggest alternative port or stopping other process

## File Checklist

After implementation, these files should exist:

```
cli/
├── core/
│   ├── ledger/
│   │   └── server.ts         # NEW - Ledger server wrapper
│   └── service/
│       └── start.ts          # UPDATED - Calls startLedger()
├── package.json              # UPDATED - Add ledger dependencies
└── main.ts                   # No changes needed

ledger/
└── package.json              # UPDATED - Add "name" and "exports"
```

## Success Criteria

- [ ] `tana start` runs HTTP server in foreground
- [ ] Server responds to health check
- [ ] Can create users via API
- [ ] Can query balances via API
- [ ] Ctrl+C stops server gracefully
- [ ] Error handling for missing database
- [ ] No code duplication (imports from ledger/)

## Future Enhancements

After basic integration works:

1. **Background mode:**
   ```bash
   tana start --daemon
   # Runs in background, saves PID

   tana stop
   # Reads PID, kills process
   ```

2. **Logs:**
   ```bash
   tana logs
   # Tail service logs
   ```

3. **Multiple chains:**
   ```bash
   tana start --chain my-chain --port 8081
   ```

4. **Database management:**
   ```bash
   tana db start  # Auto-start Postgres
   tana db migrate # Run migrations
   ```

## Estimated Time

- **Step 1-2:** 15 minutes (review, planning)
- **Step 3-4:** 30 minutes (write server wrapper)
- **Step 5-6:** 15 minutes (dependencies)
- **Step 7:** 30 minutes (testing, debugging)

**Total:** ~90 minutes

## References

- Current ledger: `ledger/src/index.ts`
- Hono docs: https://hono.dev
- Bun serve API: https://bun.sh/docs/api/http
- Workspace docs: https://bun.sh/docs/install/workspaces

---

**Ready to implement tomorrow!** 🚀
