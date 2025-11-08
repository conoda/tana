# Edge Server Architecture

**Status:** Design phase - Not yet implemented

---

## Overview

Tana uses a **hybrid architecture** that separates blockchain consensus from HTTP/serverless compute. This enables practical applications that don't force everything on-chain while maintaining the benefits of blockchain for critical data.

## Three-Binary System

```
┌──────────────┐
│     tana     │  CLI + Blockchain Node
├──────────────┤  • Consensus & block production
│              │  • Runs Init() and Contract()
│              │  • Maintains on-chain state
└──────────────┘

┌──────────────┐
│ tana-runtime │  V8 Execution Engine
├──────────────┤  • Sandboxed TypeScript execution
│              │  • Used by both node and edge
│              │  • Deno-core based
└──────────────┘

┌──────────────┐
│  tana-edge   │  HTTP Edge Server (NEW)
├──────────────┤  • Serves Get() and Post()
│              │  • Queries blockchain (read-only)
│              │  • Manages off-chain storage
└──────────────┘
```

## Four-Function Contract Model

Smart contracts export up to **four functions**, each with a specific purpose:

### 1. `Init()` - Deployment Initialization

**Runs:** Once, when contract is first deployed to blockchain
**Environment:** Blockchain (deterministic, consensus)
**Purpose:** One-time setup, initialize on-chain state

```typescript
export function Init(ctx: InitContext) {
  // Set initial contract state
  await data.set('counter', '0')
  await data.set('owner', ctx.deployer)
  await data.commit()
}
```

### 2. `Contract()` - Transaction Execution

**Runs:** During blockchain transactions, in blocks
**Environment:** Blockchain (deterministic, consensus)
**Purpose:** State mutations, business logic that requires consensus

```typescript
export function Contract(ctx: ContractContext) {
  // Handle transaction, modify on-chain state
  const current = parseInt(await data.get('counter'))
  await data.set('counter', String(current + 1))
  await data.commit()
}
```

### 3. `Get()` - HTTP GET Handler

**Runs:** On-demand, per HTTP request
**Environment:** Edge server (non-deterministic, serverless)
**Purpose:** Query blockchain data, return HTTP responses

```typescript
export function Get(req: EdgeRequest): EdgeResponse {
  // Read blockchain state
  const counter = await block.getStorage('counter')

  // Return HTTP response
  return {
    status: 200,
    body: { counter },
    headers: { 'Content-Type': 'application/json' }
  }
}
```

### 4. `Post()` - HTTP POST Handler

**Runs:** On-demand, per HTTP request
**Environment:** Edge server (non-deterministic, serverless)
**Purpose:** Off-chain operations (database, storage, external APIs)

```typescript
export function Post(req: EdgeRequest, body: any): EdgeResponse {
  // Write to off-chain database
  await edge.db.insert('comments', {
    postId: body.postId,
    content: body.content,
    timestamp: Date.now()
  })

  // Upload to off-chain storage
  await edge.storage.upload('avatars', body.imageData)

  return { status: 201, body: { success: true } }
}
```

## Key Distinction: On-Chain vs Off-Chain

### On-Chain (Init, Contract)
- ✅ Requires consensus across all nodes
- ✅ Immutable and verifiable
- ✅ Deterministic execution
- ❌ Expensive (all nodes process)
- ❌ Slow (block time)
- **Use for:** Critical state, financial transactions, ownership

### Off-Chain (Get, Post)
- ✅ Fast (no consensus needed)
- ✅ Cheap (single server processes)
- ✅ Flexible (can use any storage/API)
- ❌ Not on blockchain
- ❌ Centralized (trust required)
- **Use for:** Analytics, comments, files, temporary data, heavy compute

## Subdomain Routing

Each deployed contract receives a unique identifier and subdomain:

```
Contract deployed → Assigned ID: cnt_abc123
                 → Accessible at: https://cnt_abc123.tana.network

HTTP requests routed:
  GET  https://cnt_abc123.tana.network/posts    → contract's Get()
  POST https://cnt_abc123.tana.network/comments → contract's Post()
```

**Implementation:**
- Wildcard DNS: `*.tana.network` → Edge servers
- Extract contract ID from subdomain
- Load and execute contract's Get/Post functions
- Return HTTP response

## Trust & Hosting Model

### Option A: tana.network (Centralized, Managed)

**For users who want simplicity:**
- Deploy contract to blockchain
- Get `{contractId}.tana.network` subdomain
- tana.network runs edge infrastructure
- Off-chain data stored in managed SQLite/Postgres
- Backed up, monitored, maintained

### Option B: Self-Hosted (Decentralized, Private)

**For users who want control:**
- Run own blockchain node(s)
- Run own edge server(s)
- Point custom domain to their edge
- Manage own off-chain database/storage
- Complete control, complete privacy
- Fork and modify as needed

**Both options use the same open-source code.**

## Edge Module APIs

The `tana:edge` module (available in Post() functions) provides:

```typescript
// Database access (SQLite, Postgres, configurable)
await edge.db.insert('table', { data })
await edge.db.query('SELECT * FROM table WHERE id = ?', [id])

// File storage (local, S3, R2, configurable)
await edge.storage.upload('bucket/path', buffer)
await edge.storage.download('bucket/path')

// Cache (in-memory, Redis, configurable)
await edge.cache.set('key', value, { ttl: 3600 })
await edge.cache.get('key')

// HTTP requests (external APIs)
await edge.fetch('https://api.example.com')

// Background jobs (optional)
await edge.queue.enqueue('send-email', { to: user.email })
```

## Request/Response Contract

Zod schemas enforce the contract signature:

```typescript
type EdgeRequest = {
  path: string              // '/posts/123'
  method: 'GET' | 'POST'
  query: Record<string, string>
  headers: Record<string, string>
  params?: Record<string, string>
  ip?: string
}

type EdgeResponse = {
  status: number            // HTTP status code
  body: any                 // Response body (auto-serialized to JSON)
  headers?: Record<string, string>
}

// Enforced signatures
export function Get(req: EdgeRequest): EdgeResponse
export function Post(req: EdgeRequest, body: any): EdgeResponse
```

## Bundling & Execution

**Edge server workflow:**

1. **Load contract** from blockchain or cache
2. **Validate** Get/Post exports with Zod schemas
3. **Transpile** TypeScript → JavaScript
4. **Inject** tana:block and tana:edge modules
5. **Execute** in sandboxed runtime (tana-runtime)
6. **Validate** response matches EdgeResponse schema
7. **Return** as HTTP response

## Real-World Example: Blog Platform

```typescript
// blog-contract.ts

// On-chain: Immutable blog posts
export function Contract(ctx) {
  const { title, content, author } = ctx.input
  const count = parseInt(data.get('postCount') || '0')

  data.set(`post:${count}`, JSON.stringify({
    title, content, author,
    timestamp: ctx.block.timestamp
  }))
  data.set('postCount', String(count + 1))
  data.commit()
}

// Off-chain: Fast queries
export function Get(req) {
  if (req.path === '/posts') {
    const count = parseInt(block.getStorage('postCount') || '0')
    const posts = []
    for (let i = 0; i < count; i++) {
      posts.push(JSON.parse(block.getStorage(`post:${i}`)))
    }
    return { status: 200, body: { posts } }
  }

  if (req.path.startsWith('/posts/')) {
    const id = req.path.split('/')[2]
    const post = JSON.parse(block.getStorage(`post:${id}`))
    return { status: 200, body: post }
  }
}

// Off-chain: Comments, analytics
export function Post(req, body) {
  if (req.path === '/comments') {
    await edge.db.insert('comments', {
      postId: body.postId,
      author: body.author,
      content: body.content,
      timestamp: Date.now()
    })
    return { status: 201, body: { success: true } }
  }

  if (req.path === '/analytics') {
    await edge.db.insert('page_views', {
      postId: body.postId,
      timestamp: Date.now(),
      ip: req.ip
    })
    return { status: 200, body: { tracked: true } }
  }
}
```

**Usage:**
```bash
# Deploy contract
tana deploy contract blog-contract.ts

# Assigned: cnt_xyz789

# Access:
GET  https://cnt_xyz789.tana.network/posts
GET  https://cnt_xyz789.tana.network/posts/5
POST https://cnt_xyz789.tana.network/comments
POST https://cnt_xyz789.tana.network/analytics
```

## Use Cases

### What Belongs On-Chain
- Financial transactions
- Contract ownership
- Critical state transitions
- Immutable records
- Proof of events

### What Belongs Off-Chain
- User comments
- Page view analytics
- File uploads (images, videos)
- Search indexes
- Notification queues
- External API calls
- Heavy computation

## Comparison to Other Platforms

| Platform | On-Chain | Off-Chain | Self-Hostable | Open Source |
|----------|----------|-----------|---------------|-------------|
| **Tana** | ✅ Blockchain | ✅ Edge servers | ✅ Yes | ✅ Yes |
| Ethereum | ✅ Everything | ❌ - | ✅ Yes | ✅ Yes |
| Vercel | ❌ - | ✅ Everything | ❌ No | ❌ No |
| Cloudflare Workers | ❌ - | ✅ Everything | ❌ No | ❌ No |
| IPFS | ⚠️ Storage only | ❌ - | ✅ Yes | ✅ Yes |

**Tana's advantage:** Practical hybrid that doesn't force everything on-chain while avoiding vendor lock-in.

## Implementation Status

- [ ] tana-edge binary
- [ ] Subdomain routing
- [ ] Contract bundling/validation
- [ ] Edge module APIs (db, storage, cache)
- [ ] Request/Response schemas
- [ ] Self-hosting documentation
- [ ] tana.network hosting infrastructure

## Open Questions

1. **Authentication** - How do Post() functions authenticate users? JWT? Wallet signatures?
2. **Rate limiting** - Per contract? Per subdomain? Global?
3. **Custom domains** - Allow users to point their own domains to contracts?
4. **Pricing model** - Free tier for tana.network? Pay per request? Storage limits?
5. **Multi-region** - Edge servers in multiple regions? CDN integration?
6. **Versioning** - How to update contracts without breaking HTTP endpoints?

## Benefits

**For Developers:**
- Write TypeScript, not Solidity
- Use familiar HTTP patterns
- Access to full ecosystem (npm, databases, APIs)
- Not limited by blockchain constraints
- Can self-host everything

**For Users:**
- Fast HTTP responses (no waiting for blocks)
- Familiar URLs (subdomains)
- Works with existing tools (curl, browsers)
- Can trust tana.network or run their own

**For Blockchain:**
- Only critical data on-chain
- Reduced blockchain bloat
- Lower costs
- Better scalability

---

**This architecture makes Tana practical for real applications** - not just toy demos or purely financial transactions, but full-featured web apps with the benefits of blockchain where it matters.
