/**
 * Tana Ledger Database Schema
 *
 * Core tables for users, teams, channels, balances, and transactions
 */

import { pgTable, text, timestamp, jsonb, decimal, boolean, uuid, varchar, pgEnum, bigint } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================================================
// ENUMS
// ============================================================================

export const currencyTypeEnum = pgEnum('currency_type', ['fiat', 'crypto'])
export const teamRoleEnum = pgEnum('team_role', ['owner', 'admin', 'member'])
export const channelVisibilityEnum = pgEnum('channel_visibility', ['public', 'private', 'team'])
export const transactionTypeEnum = pgEnum('transaction_type', ['transfer', 'deposit', 'withdraw', 'contract_call', 'user_creation', 'contract_deployment'])
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'confirmed', 'failed'])

// ============================================================================
// USERS
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  publicKey: text('public_key').notNull().unique(), // Ed25519 public key
  username: varchar('username', { length: 50 }).notNull().unique(), // @alice
  displayName: varchar('display_name', { length: 100 }).notNull(),

  // Metadata
  bio: text('bio'),
  avatarData: text('avatar_data'), // Base64 small image or null
  avatarHash: varchar('avatar_hash', { length: 64 }), // Content hash if stored off-chain
  landingPageId: uuid('landing_page_id'), // Reference to landing_pages table (future)

  // State tracking
  stateHash: varchar('state_hash', { length: 64 }).notNull(), // Merkle root of account state

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================================
// TEAMS
// ============================================================================

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(), // @acme

  // Metadata
  description: text('description'),
  avatarData: text('avatar_data'),
  landingPageId: uuid('landing_page_id'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: teamRoleEnum('role').notNull().default('member'),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
})

// ============================================================================
// CHANNELS
// ============================================================================

export const channels = pgTable('channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull(), // #general
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }), // Optional team ownership
  visibility: channelVisibilityEnum('visibility').notNull().default('public'),

  // Metadata
  description: text('description'),
  landingPageId: uuid('landing_page_id'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const channelMembers = pgTable('channel_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id),
  content: text('content').notNull(), // Max 10KB enforced at app level
  signature: text('signature').notNull(), // Ed25519 signature
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ============================================================================
// CURRENCIES
// ============================================================================

export const currencies = pgTable('currencies', {
  code: varchar('code', { length: 10 }).primaryKey(), // "USD", "BTC", "ETH"
  type: currencyTypeEnum('type').notNull(),
  decimals: decimal('decimals', { precision: 2 }).notNull(), // Precision (2 for USD, 8 for BTC)
  verified: boolean('verified').notNull().default(false), // Is this officially supported?

  // Metadata
  name: varchar('name', { length: 100 }), // "US Dollar", "Bitcoin"
  symbol: varchar('symbol', { length: 10 }), // "$", "₿"

  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ============================================================================
// BALANCES
// ============================================================================

export const balances = pgTable('balances', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Owner (user or team)
  ownerId: uuid('owner_id').notNull(), // User or Team ID
  ownerType: varchar('owner_type', { length: 10 }).notNull(), // 'user' or 'team'

  // Currency and amount
  currencyCode: varchar('currency_code', { length: 10 }).notNull().references(() => currencies.code),
  amount: decimal('amount', { precision: 20, scale: 8 }).notNull().default('0'), // Up to 8 decimals

  // Timestamps
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================================
// TRANSACTIONS
// ============================================================================

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(), // Also serves as tx hash

  // From/To
  from: uuid('from').notNull(), // User or Team ID
  to: uuid('to').notNull(), // User or Team ID

  // Amount (optional - only for transfer/deposit/withdraw types)
  amount: decimal('amount', { precision: 20, scale: 8 }),
  currencyCode: varchar('currency_code', { length: 10 }).references(() => currencies.code),

  // Type
  type: transactionTypeEnum('type').notNull(),

  // Contract call data (optional)
  contractId: uuid('contract_id'), // Smart contract ID if type is contract_call
  contractInput: jsonb('contract_input'), // Arguments passed to contract

  // Signature
  signature: text('signature').notNull(), // Ed25519 signature

  // Status
  status: transactionStatusEnum('status').notNull().default('pending'),
  blockHeight: bigint('block_height', { mode: 'number' }), // Block inclusion

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  confirmedAt: timestamp('confirmed_at'),
})

// ============================================================================
// BLOCKS
// ============================================================================

export const blocks = pgTable('blocks', {
  // Block identification
  height: bigint('height', { mode: 'number' }).primaryKey(), // 0 for genesis, then 1, 2, 3...
  hash: varchar('hash', { length: 64 }).notNull().unique(), // SHA256 of block contents
  previousHash: varchar('previous_hash', { length: 64 }).notNull(), // Hash of previous block (0x00... for genesis)

  // Block metadata
  timestamp: timestamp('timestamp').notNull(), // Block creation time
  producer: uuid('producer').notNull(), // Node/user that produced this block

  // Block contents
  txCount: decimal('tx_count', { precision: 10 }).notNull().default('0'), // Number of transactions
  stateRoot: varchar('state_root', { length: 64 }).notNull(), // Merkle root of state after this block
  txRoot: varchar('tx_root', { length: 64 }), // Merkle root of transactions (optional)

  // Execution
  gasUsed: bigint('gas_used', { mode: 'number' }).notNull().default(0), // Total gas consumed in block
  gasLimit: bigint('gas_limit', { mode: 'number' }).notNull(), // Maximum gas allowed

  // Additional data
  metadata: jsonb('metadata'), // Extra data (contracts executed, etc.)
  signature: text('signature').notNull(), // Producer's signature

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  finalizedAt: timestamp('finalized_at'), // When block became final
})

// ============================================================================
// CONTRACTS
// ============================================================================

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Owner and naming
  ownerId: uuid('owner_id').notNull().references(() => users.id), // Who deployed it
  name: varchar('name', { length: 100 }).notNull(), // Contract name

  // Source code
  sourceCode: text('source_code').notNull(), // Original TypeScript source

  // Version and state
  version: varchar('version', { length: 20 }).notNull().default('1.0.0'),
  isActive: boolean('is_active').notNull().default(true),

  // Deployment info
  deployedInBlock: bigint('deployed_in_block', { mode: 'number' }).notNull(),
  deploymentTxId: uuid('deployment_tx_id').notNull(),

  // Metadata
  description: text('description'),
  metadata: jsonb('metadata'), // Tags, documentation, etc.

  // Code hash for verification
  codeHash: varchar('code_hash', { length: 64 }).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================================
// LANDING PAGES (Future - placeholder)
// ============================================================================

export const landingPages = pgTable('landing_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(), // User/Team/Channel ID
  version: decimal('version', { precision: 10 }).notNull().default('1'),

  // Source code (stored on-chain)
  sourceHTML: text('source_html').notNull(),
  sourceCSS: text('source_css'),
  sourceTypeScript: text('source_typescript'),
  compiledJS: text('compiled_js'),

  // Islands (dynamic components)
  islands: jsonb('islands'), // Array of island definitions

  // Metadata
  title: varchar('title', { length: 200 }),
  description: text('description'),
  customDomain: varchar('custom_domain', { length: 100 }),
  buildHash: varchar('build_hash', { length: 64 }).notNull(),

  // Deployed by
  deployedBy: uuid('deployed_by').notNull().references(() => users.id),
  deployedAt: timestamp('deployed_at').notNull().defaultNow(),
})

// ============================================================================
// RELATIONS (for Drizzle ORM queries)
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  teamMemberships: many(teamMembers),
  channelMemberships: many(channelMembers),
  messages: many(messages),
  deployedPages: many(landingPages),
}))

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
  channels: many(channels),
}))

export const channelsRelations = relations(channels, ({ many, one }) => ({
  team: one(teams, {
    fields: [channels.teamId],
    references: [teams.id],
  }),
  members: many(channelMembers),
  messages: many(messages),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  currency: one(currencies, {
    fields: [transactions.currencyCode],
    references: [currencies.code],
  }),
}))
