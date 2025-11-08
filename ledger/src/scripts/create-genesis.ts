/**
 * Create Genesis Block (Block #0)
 *
 * Creates the first block in the Tana blockchain
 *
 * Usage: bun run src/scripts/create-genesis.ts
 */

import { db } from '../db'
import { blocks, currencies } from '../db/schema'
import crypto from 'crypto'
import { sql } from 'drizzle-orm'

function calculateStateRoot(): string {
  // For genesis, this is the root of initial state
  // In the future, this would be a merkle root of all account states
  const initialState = {
    accounts: 0,
    balances: 0,
    version: '0.1.0',
    timestamp: Date.now()
  }

  return crypto.createHash('sha256')
    .update(JSON.stringify(initialState))
    .digest('hex')
}

function calculateBlockHash(blockData: any, stateRoot: string): string {
  const data = JSON.stringify({
    height: blockData.height,
    previousHash: blockData.previousHash,
    timestamp: blockData.timestamp,
    txCount: blockData.txCount,
    stateRoot,
    gasUsed: blockData.gasUsed,
    gasLimit: blockData.gasLimit,
    metadata: blockData.metadata
  })

  return crypto.createHash('sha256').update(data).digest('hex')
}

async function createGenesisBlock() {
  console.log('🌱 Creating Genesis Block (Block #0)...')
  console.log('')

  try {
    // Check if genesis block already exists
    const existing = await db.execute(sql`SELECT height FROM blocks WHERE height = 0`)
    if (existing.length > 0) {
      console.log('⚠️  Genesis block already exists!')
      console.log('If you want to recreate it, run: bun run src/scripts/flush-blockchain.ts')
      process.exit(0)
    }

    const genesisTimestamp = new Date('2024-11-03T00:00:00Z')

    const genesisData = {
      height: 0,
      previousHash: '0'.repeat(64), // No previous block
      timestamp: genesisTimestamp,
      producer: '00000000-0000-0000-0000-000000000000', // Special genesis producer UUID
      txCount: 0, // No transactions in genesis
      gasUsed: 0,
      gasLimit: 1000000,
      metadata: {
        version: '0.1.0',
        networkName: 'tana',
        chainId: 1,
        genesisMessage: 'Tana blockchain - TypeScript smart contracts for commerce and content',
        blockTime: 6000, // Target 6 seconds per block
      }
    }

    // Calculate state root
    const stateRoot = calculateStateRoot()

    // Calculate block hash
    const hash = calculateBlockHash(genesisData, stateRoot)

    // Insert genesis block
    await db.insert(blocks).values({
      height: genesisData.height,
      hash,
      previousHash: genesisData.previousHash,
      timestamp: genesisData.timestamp,
      producer: genesisData.producer,
      txCount: genesisData.txCount,
      stateRoot,
      txRoot: null,
      gasUsed: genesisData.gasUsed,
      gasLimit: genesisData.gasLimit,
      metadata: genesisData.metadata,
      signature: 'genesis_signature',
      finalizedAt: genesisTimestamp // Genesis is immediately final
    })

    console.log('✅ Genesis block created!')
    console.log('')
    console.log('Block Details:')
    console.log('  Height:', 0)
    console.log('  Hash:', hash)
    console.log('  Previous Hash:', genesisData.previousHash)
    console.log('  Timestamp:', genesisTimestamp.toISOString())
    console.log('  State Root:', stateRoot)
    console.log('  Gas Limit:', genesisData.gasLimit)
    console.log('')
    console.log('Network Parameters:')
    console.log('  Network:', genesisData.metadata.networkName)
    console.log('  Chain ID:', genesisData.metadata.chainId)
    console.log('  Version:', genesisData.metadata.version)
    console.log('  Block Time:', genesisData.metadata.blockTime, 'ms')
    console.log('')

    // Initialize base currencies
    console.log('Initializing base currencies...')

    await db.insert(currencies).values([
      {
        code: 'USD',
        type: 'fiat',
        decimals: '2',
        verified: true,
        name: 'US Dollar',
        symbol: '$'
      },
      {
        code: 'BTC',
        type: 'crypto',
        decimals: '8',
        verified: true,
        name: 'Bitcoin',
        symbol: '₿'
      },
      {
        code: 'ETH',
        type: 'crypto',
        decimals: '8',
        verified: true,
        name: 'Ethereum',
        symbol: 'Ξ'
      }
    ]).onConflictDoNothing()

    console.log('✅ Base currencies initialized')
    console.log('')
    console.log('🎉 Blockchain initialized successfully!')

  } catch (error: any) {
    console.error('❌ Error creating genesis block:', error.message)
    process.exit(1)
  }

  process.exit(0)
}

createGenesisBlock()
