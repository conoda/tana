/**
 * Smart Contract Service
 *
 * Operations for contract deployment and queries
 */

import { eq, desc } from 'drizzle-orm'
import { db, contracts, transactions } from '../db'
import { createHash, randomUUID } from 'crypto'

const SYSTEM_ID = '00000000-0000-0000-0000-000000000000'

export interface DeployContractInput {
  ownerId: string
  name: string
  sourceCode: string
  description?: string
  metadata?: Record<string, any>
}

/**
 * Deploy a smart contract (transaction-based)
 *
 * Creates a pending contract_deployment transaction that will be
 * executed when the next block is produced.
 */
export async function deployContract(input: DeployContractInput) {
  // Validate contract name
  if (!input.name || input.name.length < 1 || input.name.length > 100) {
    throw new Error('Contract name must be between 1 and 100 characters')
  }

  // Validate source code
  if (!input.sourceCode || input.sourceCode.trim().length === 0) {
    throw new Error('Contract source code cannot be empty')
  }

  // Calculate code hash
  const codeHash = createHash('sha256')
    .update(input.sourceCode)
    .digest('hex')

  // Check if identical contract already exists
  const existingContract = await db
    .select()
    .from(contracts)
    .where(eq(contracts.codeHash, codeHash))
    .limit(1)

  if (existingContract.length > 0) {
    throw new Error(`Contract with identical code already exists: ${existingContract[0].id}`)
  }

  // Generate contract ID upfront
  const contractId = randomUUID()

  // Create signature
  const signature = createHash('sha256')
    .update(JSON.stringify({
      type: 'contract_deployment',
      contractId,
      name: input.name,
      codeHash,
      timestamp: Date.now()
    }))
    .digest('hex')

  // Create contract_deployment transaction
  const [transaction] = await db
    .insert(transactions)
    .values({
      type: 'contract_deployment',
      from: input.ownerId,
      to: contractId, // The contract's ID
      amount: null,
      currencyCode: null,
      contractId: contractId,
      contractInput: {
        name: input.name,
        sourceCode: input.sourceCode,
        description: input.description,
        metadata: input.metadata,
        version: '1.0.0',
        codeHash
      },
      signature,
      status: 'pending'
    })
    .returning()

  return {
    transactionId: transaction.id,
    contractId,
    codeHash,
    status: 'pending',
    message: 'Contract deployment transaction created. Contract will be deployed when the next block is produced.'
  }
}

/**
 * Get contract by ID
 */
export async function getContractById(id: string) {
  const [contract] = await db
    .select()
    .from(contracts)
    .where(eq(contracts.id, id))
    .limit(1)

  return contract || null
}

/**
 * Get contracts by owner
 */
export async function getContractsByOwner(ownerId: string, limit = 50, offset = 0) {
  return await db
    .select()
    .from(contracts)
    .where(eq(contracts.ownerId, ownerId))
    .orderBy(desc(contracts.createdAt))
    .limit(limit)
    .offset(offset)
}

/**
 * List all contracts (paginated)
 */
export async function listContracts(limit = 50, offset = 0) {
  return await db
    .select()
    .from(contracts)
    .orderBy(desc(contracts.createdAt))
    .limit(limit)
    .offset(offset)
}

/**
 * Get active contracts only
 */
export async function getActiveContracts(limit = 50, offset = 0) {
  return await db
    .select()
    .from(contracts)
    .where(eq(contracts.isActive, true))
    .orderBy(desc(contracts.createdAt))
    .limit(limit)
    .offset(offset)
}

/**
 * Deactivate a contract
 */
export async function deactivateContract(id: string, ownerId: string) {
  // Verify ownership
  const contract = await getContractById(id)
  if (!contract) {
    throw new Error('Contract not found')
  }
  if (contract.ownerId !== ownerId) {
    throw new Error('Only the contract owner can deactivate it')
  }

  const [updated] = await db
    .update(contracts)
    .set({
      isActive: false,
      updatedAt: new Date()
    })
    .where(eq(contracts.id, id))
    .returning()

  return updated
}
