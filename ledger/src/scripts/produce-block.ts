/**
 * Manual Block Production Script
 *
 * Finds pending transactions and produces a new block
 *
 * Usage: bun run src/scripts/produce-block.ts
 */

import { db } from '../db'
import { blocks, transactions, users, balances, currencies, contracts } from '../db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import crypto from 'crypto'

const SYSTEM_PRODUCER_ID = '00000000-0000-0000-0000-000000000000'

function calculateStateRoot(blockHeight: number): string {
  // Simple state root calculation
  // In production, this would be a merkle root of all account states
  const stateData = {
    blockHeight,
    timestamp: Date.now(),
    version: '0.1.0'
  }

  return crypto.createHash('sha256')
    .update(JSON.stringify(stateData))
    .digest('hex')
}

function calculateBlockHash(blockData: any, stateRoot: string): string {
  const data = JSON.stringify({
    height: blockData.height,
    previousHash: blockData.previousHash,
    timestamp: blockData.timestamp.toISOString(),
    txCount: blockData.txCount,
    stateRoot,
    gasUsed: blockData.gasUsed,
    producer: blockData.producer
  })

  return crypto.createHash('sha256').update(data).digest('hex')
}

async function produceBlock() {
  console.log('🔨 Producing new block...')
  console.log('')

  try {
    // 1. Get latest block
    const [latestBlock] = await db
      .select()
      .from(blocks)
      .orderBy(sql`${blocks.height} DESC`)
      .limit(1)

    if (!latestBlock) {
      console.error('❌ No genesis block found. Run: bun run blockchain:genesis')
      process.exit(1)
    }

    console.log('Latest block:', latestBlock.height)

    // 2. Get pending transactions
    const pendingTxs = await db
      .select()
      .from(transactions)
      .where(eq(transactions.status, 'pending'))
      .limit(1000) // Max transactions per block

    if (pendingTxs.length === 0) {
      console.log('⚠️  No pending transactions to process')
      console.log('   Create some transactions first!')
      process.exit(0)
    }

    console.log(`Found ${pendingTxs.length} pending transaction(s)`)
    console.log('')

    // 3. Execute transactions
    let gasUsed = 0
    const GAS_PER_TX = 21000 // Base gas per transaction

    for (const tx of pendingTxs) {
      console.log(`Processing transaction ${tx.id} (${tx.type})...`)

      try {
        // Execute based on type
        switch (tx.type) {
          case 'user_creation': {
            // Get user data from contractInput
            const userData = tx.contractInput as any

            if (!userData || !userData.username || !userData.displayName || !userData.publicKey) {
              throw new Error('Invalid user_creation transaction: missing user data')
            }

            // Create the user with the transaction's "to" ID
            await db.insert(users).values({
              id: tx.to,
              username: userData.username,
              displayName: userData.displayName,
              publicKey: userData.publicKey,
              stateHash: crypto.createHash('sha256')
                .update(JSON.stringify(userData))
                .digest('hex')
            })

            console.log(`  ✓ Created user: ${userData.username} (${tx.to})`)
            gasUsed += GAS_PER_TX
            break
          }

          case 'contract_deployment': {
            // Get contract data from contractInput
            const contractData = tx.contractInput as any

            if (!contractData || !contractData.name || !contractData.sourceCode || !contractData.codeHash) {
              throw new Error('Invalid contract_deployment transaction: missing contract data')
            }

            // Get the block height we're creating
            const newBlockHeight = latestBlock.height + 1

            // Deploy the contract
            await db.insert(contracts).values({
              id: tx.to, // Contract ID from transaction
              ownerId: tx.from,
              name: contractData.name,
              sourceCode: contractData.sourceCode,
              version: contractData.version || '1.0.0',
              isActive: true,
              deployedInBlock: newBlockHeight,
              deploymentTxId: tx.id,
              description: contractData.description,
              metadata: contractData.metadata,
              codeHash: contractData.codeHash
            })

            console.log(`  ✓ Deployed contract: ${contractData.name} (${tx.to})`)
            gasUsed += GAS_PER_TX * 3 // Contracts cost more gas
            break
          }

          case 'contract_call': {
            // Get contract call data
            const callData = tx.contractInput as any

            if (!tx.contractId) {
              throw new Error('Invalid contract_call: missing contractId')
            }

            // Verify contract exists and is active
            const [contract] = await db
              .select()
              .from(contracts)
              .where(eq(contracts.id, tx.contractId))
              .limit(1)

            if (!contract) {
              throw new Error(`Contract not found: ${tx.contractId}`)
            }

            if (!contract.isActive) {
              throw new Error(`Contract is not active: ${tx.contractId}`)
            }

            // TODO: Execute contract via Rust runtime
            // For now, just validate and mark as confirmed
            // Contract execution will be implemented in a future step

            console.log(`  ⚠️  Contract call validated (execution not yet implemented): ${contract.name}`)
            gasUsed += GAS_PER_TX * 5 // Contract calls cost more gas
            break
          }

          case 'transfer': {
            if (!tx.amount || !tx.currencyCode) {
              throw new Error('Invalid transfer: missing amount or currency')
            }

            // Update balances (simplified - should validate sufficient balance)
            // Deduct from sender
            await db.execute(sql`
              UPDATE balances
              SET amount = amount - ${tx.amount}
              WHERE owner_id = ${tx.from} AND currency_code = ${tx.currencyCode}
            `)

            // Add to receiver
            await db.execute(sql`
              INSERT INTO balances (owner_id, owner_type, currency_code, amount)
              VALUES (${tx.to}, 'user', ${tx.currencyCode}, ${tx.amount})
              ON CONFLICT (owner_id, currency_code)
              DO UPDATE SET amount = balances.amount + ${tx.amount}
            `)

            console.log(`  ✓ Transferred ${tx.amount} ${tx.currencyCode}`)
            gasUsed += GAS_PER_TX
            break
          }

          default:
            console.log(`  ⚠️  Skipping unsupported transaction type: ${tx.type}`)
        }

        // Mark transaction as confirmed
        await db
          .update(transactions)
          .set({ status: 'confirmed', confirmedAt: new Date() })
          .where(eq(transactions.id, tx.id))

      } catch (error: any) {
        console.error(`  ❌ Transaction ${tx.id} failed:`, error.message)

        // Mark transaction as failed
        await db
          .update(transactions)
          .set({ status: 'failed' })
          .where(eq(transactions.id, tx.id))
      }
    }

    console.log('')

    // 4. Create new block
    const newHeight = latestBlock.height + 1
    const timestamp = new Date()

    const blockData = {
      height: newHeight,
      previousHash: latestBlock.hash,
      timestamp,
      producer: SYSTEM_PRODUCER_ID,
      txCount: pendingTxs.length,
      gasUsed,
      gasLimit: latestBlock.gasLimit
    }

    const stateRoot = calculateStateRoot(newHeight)
    const hash = calculateBlockHash(blockData, stateRoot)

    await db.insert(blocks).values({
      height: blockData.height,
      hash,
      previousHash: blockData.previousHash,
      timestamp: blockData.timestamp,
      producer: blockData.producer,
      txCount: blockData.txCount,
      stateRoot,
      txRoot: null,
      gasUsed: blockData.gasUsed,
      gasLimit: blockData.gasLimit,
      metadata: {
        transactions: pendingTxs.map(tx => tx.id),
        producedBy: 'manual-script'
      },
      signature: 'manual_block_signature',
      finalizedAt: timestamp
    })

    // 5. Link transactions to block
    for (const tx of pendingTxs) {
      await db
        .update(transactions)
        .set({ blockHeight: newHeight })
        .where(eq(transactions.id, tx.id))
    }

    console.log('✅ Block produced successfully!')
    console.log('')
    console.log('Block Details:')
    console.log('  Height:', newHeight)
    console.log('  Hash:', hash)
    console.log('  Previous Hash:', blockData.previousHash)
    console.log('  Transactions:', pendingTxs.length)
    console.log('  Gas Used:', gasUsed, '/', blockData.gasLimit)
    console.log('  Timestamp:', timestamp.toISOString())
    console.log('')

  } catch (error: any) {
    console.error('❌ Error producing block:', error.message)
    console.error(error.stack)
    process.exit(1)
  }

  process.exit(0)
}

produceBlock()
