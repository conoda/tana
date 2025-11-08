# Core Data Model

## Primary Objects

```typescript
// USER
interface User {
  id: string                    // Unique ID (address)
  publicKey: string             // Ed25519 public key
  username: string              // @alice
  displayName: string           // "Alice Johnson"
  metadata: {
    bio?: string
    avatarData?: string         // Small image stored on-chain (<100KB base64)
    avatarHash?: string         // Or content hash if stored off-chain
    landingPageId?: string      // Reference to LandingPage object
  }
  balances: Map<Currency, Decimal>  // Multi-currency
  createdAt: timestamp
  stateHash: string             // Merkle root of account state
}

// TEAM
interface Team {
  id: string                    // Unique team ID
  name: string                  // "Acme Corp"
  slug: string                  // @acme
  members: Array<{
    userId: string
    role: 'owner' | 'admin' | 'member'
    joinedAt: timestamp
  }>
  balances: Map<Currency, Decimal>  // Team treasury
  metadata: {
    description?: string
    avatarData?: string         // Small image on-chain or content hash
    landingPageId?: string      // Reference to LandingPage object
  }
  createdAt: timestamp
}

// CHANNEL
interface Channel {
  id: string                    // Unique channel ID
  name: string                  // "general"
  slug: string                  // #general
  teamId?: string               // Optional team ownership
  visibility: 'public' | 'private' | 'team'
  members: string[]             // User IDs with access
  messages: Array<{
    id: string
    authorId: string
    content: string
    timestamp: timestamp
    signature: string           // Ed25519
  }>
  metadata: {
    description?: string
    landingPageId?: string      // Reference to LandingPage object
  }
  createdAt: timestamp
}

// TRANSACTION
interface Transaction {
  id: string                    // Tx hash
  from: string                  // User/Team ID
  to: string                    // User/Team ID
  amount: Decimal
  currency: Currency            // USD, BTC, ETH, etc.
  type: 'transfer' | 'deposit' | 'withdraw' | 'contract_call'
  contractId?: string           // If contract execution
  contractInput?: any           // Arguments
  signature: string             // Ed25519
  timestamp: timestamp
  blockId: string               // Block inclusion
  status: 'pending' | 'confirmed' | 'failed'
}

// CURRENCY
interface Currency {
  code: string                  // "USD", "BTC", "ETH"
  type: 'fiat' | 'crypto'
  decimals: number              // Precision (e.g., 2 for USD, 8 for BTC)
  verified: boolean             // Is this a recognized currency?
}

// SMART CONTRACT
interface SmartContract {
  id: string                    // Contract address
  codeHash: string              // SHA-256 of code
  code: string                  // TypeScript source
  author: string                // User ID
  deployedAt: timestamp
  storage: Map<string, string>  // Key-value state (tana:data)
  metadata: {
    name?: string
    description?: string
    version?: string
  }
}

// BLOCK
interface Block {
  id: string                    // Block hash
  height: number                // Block number
  timestamp: timestamp
  previousHash: string          // Previous block
  transactions: string[]        // Tx hashes
  stateRoot: string             // Merkle root of all account states
  validatorSignature: string    // Block producer signature
}
```


---

## 🚀 Development Roadmap

### Phase 1: Foundation (Current)
- [x] V8 runtime with TypeScript support
- [x] `tana:core`, `tana:data`, `tana:utils` modules
- [x] Browser playground
- [x] Storage API with localStorage
- [ ] Landing page concept design
- [ ] Data model finalization

### Phase 2: Core Ledger
- [ ] Create `tana-ledger` service
- [ ] PostgreSQL schema for accounts/balances
- [ ] User account creation & management
- [ ] Multi-currency balance tracking
- [ ] Transaction submission & validation
- [ ] RESTful API for ledger operations

### Phase 3: Smart Contracts
- [ ] Create `tana-contracts` service
- [ ] Redis integration for contract state
- [ ] Contract deployment API
- [ ] Contract execution via tana-runtime
- [ ] Gas metering system
- [ ] Contract state inspection tools

### Phase 4: Blockchain Node
- [ ] Create `tana-node` service
- [ ] Block structure & validation
- [ ] Simple consensus (single validator → PoA later)
- [ ] P2P networking (libp2p)
- [ ] Merkle tree for state roots
- [ ] Block explorer UI

### Phase 5: Teams & Channels
- [ ] Team creation & membership
- [ ] Team treasury (shared balances)
- [ ] Channel creation (public/private)
- [ ] Message signing & verification
- [ ] Access control system

### Phase 6: Landing Pages
- [ ] Landing page deployment API
- [ ] Static HTML + dynamic islands architecture
- [ ] On-demand rendering service
- [ ] IPFS integration for static assets
- [ ] Custom domain mapping

### Phase 7: CLI Integration
- [ ] Update `tana-cli` for all new features
- [ ] Key management
- [ ] Deployment commands
- [ ] Query commands
- [ ] Interactive setup wizard

### Phase 8: Production Ready
- [ ] Multi-node network
- [ ] Consensus upgrade (PoS or PoA)
- [ ] Web wallet UI
- [ ] Mobile apps
- [ ] Monitoring & alerting
- [ ] Security audit