/**
 * User Account Service
 *
 * CRUD operations for user accounts
 */

import { eq } from 'drizzle-orm'
import { db, users, transactions } from '../db'
import { createHash, randomUUID } from 'crypto'

const SYSTEM_ID = '00000000-0000-0000-0000-000000000000'

export interface CreateUserInput {
  publicKey: string
  username: string
  displayName: string
  bio?: string
  avatarData?: string
}

export interface UpdateUserInput {
  displayName?: string
  bio?: string
  avatarData?: string
  landingPageId?: string
}

/**
 * Create a new user account (transaction-based)
 *
 * This creates a pending user_creation transaction that will be
 * executed when the next block is produced.
 *
 * Returns the transaction ID and the pre-generated user ID.
 */
export async function createUser(input: CreateUserInput) {
  // Validate username format (@alice)
  if (!input.username.startsWith('@')) {
    throw new Error('Username must start with @')
  }

  // Check if username already exists or is pending
  const existingUser = await getUserByUsername(input.username)
  if (existingUser) {
    throw new Error(`Username ${input.username} is already taken`)
  }

  // Check for pending user_creation transactions with same username
  const pendingTx = await db
    .select()
    .from(transactions)
    .where(eq(transactions.type, 'user_creation'))
    .where(eq(transactions.status, 'pending'))

  for (const tx of pendingTx) {
    const userData = tx.contractInput as any
    if (userData?.username === input.username) {
      throw new Error(`Username ${input.username} has a pending registration`)
    }
  }

  // Generate user ID upfront (will be used when block is produced)
  const userId = randomUUID()

  // Create signature (simplified - in production this would be a real Ed25519 signature)
  const signature = createHash('sha256')
    .update(JSON.stringify({
      type: 'user_creation',
      username: input.username,
      publicKey: input.publicKey,
      timestamp: Date.now()
    }))
    .digest('hex')

  // Create user_creation transaction
  const [transaction] = await db
    .insert(transactions)
    .values({
      type: 'user_creation',
      from: SYSTEM_ID, // System creates users
      to: userId, // The new user's pre-generated ID
      amount: null,
      currencyCode: null,
      contractInput: {
        username: input.username,
        displayName: input.displayName,
        publicKey: input.publicKey,
        bio: input.bio,
        avatarData: input.avatarData,
      },
      signature,
      status: 'pending'
    })
    .returning()

  return {
    transactionId: transaction.id,
    userId,
    status: 'pending',
    message: 'User creation transaction created. User will be created when the next block is produced.'
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return user || null
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string) {
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)
  return user || null
}

/**
 * Get user by public key
 */
export async function getUserByPublicKey(publicKey: string) {
  const [user] = await db.select().from(users).where(eq(users.publicKey, publicKey)).limit(1)
  return user || null
}

/**
 * Update user
 */
export async function updateUser(id: string, input: UpdateUserInput) {
  const [updated] = await db
    .update(users)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning()

  return updated || null
}

/**
 * Delete user
 */
export async function deleteUser(id: string) {
  const [deleted] = await db.delete(users).where(eq(users.id, id)).returning()
  return deleted || null
}

/**
 * List all users (paginated)
 */
export async function listUsers(limit = 50, offset = 0) {
  return await db.select().from(users).limit(limit).offset(offset)
}

/**
 * Calculate state hash for user
 * This is a simplified version - in production would include all account state
 */
function calculateStateHash(data: Record<string, any>): string {
  const hash = createHash('sha256')
  hash.update(JSON.stringify(data))
  return hash.digest('hex')
}
