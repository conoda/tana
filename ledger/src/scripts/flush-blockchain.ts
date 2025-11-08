/**
 * Flush Blockchain Script
 *
 * WARNING: This script will DELETE ALL DATA from the blockchain
 * Only use during development/testing
 *
 * Usage: bun run src/scripts/flush-blockchain.ts
 */

import { db } from '../db'
import { sql } from 'drizzle-orm'
import postgres from 'postgres'

async function flushBlockchain() {
  console.log('🔥 FLUSHING BLOCKCHAIN - This will DELETE ALL DATA')
  console.log('')

  try {
    // Delete all data from tables in correct order (respecting foreign keys)
    console.log('Deleting all messages...')
    await db.execute(sql`DELETE FROM messages`)

    console.log('Deleting all channel members...')
    await db.execute(sql`DELETE FROM channel_members`)

    console.log('Deleting all channels...')
    await db.execute(sql`DELETE FROM channels`)

    console.log('Deleting all team members...')
    await db.execute(sql`DELETE FROM team_members`)

    console.log('Deleting all teams...')
    await db.execute(sql`DELETE FROM teams`)

    console.log('Deleting all transactions...')
    await db.execute(sql`DELETE FROM transactions`)

    console.log('Deleting all balances...')
    await db.execute(sql`DELETE FROM balances`)

    console.log('Deleting all users...')
    await db.execute(sql`DELETE FROM users`)

    console.log('Deleting all blocks...')
    await db.execute(sql`DELETE FROM blocks`)

    console.log('Deleting all landing pages...')
    await db.execute(sql`DELETE FROM landing_pages`)

    console.log('Deleting all currencies...')
    await db.execute(sql`DELETE FROM currencies`)

    console.log('')
    console.log('✅ Blockchain flushed successfully!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Run: bun run src/scripts/create-genesis.ts')
    console.log('2. Run: bun run src/scripts/init-test-data.ts (optional)')

  } catch (error) {
    console.error('❌ Error flushing blockchain:', error)
    process.exit(1)
  }

  process.exit(0)
}

flushBlockchain()
