/**
 * Apply Migration 003
 *
 * Changes blockId (uuid) to blockHeight (bigint) in transactions table
 */

import postgres from 'postgres'
import { readFileSync } from 'fs'
import { join } from 'path'

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://tana:tana_dev_password@localhost:5432/tana'

async function applyMigration() {
  console.log('Applying migration 003...')

  const sql = postgres(DATABASE_URL)

  try {
    // Read migration file
    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations', '0003_block_height.sql'),
      'utf-8'
    )

    // Execute migration
    await sql.unsafe(migrationSQL)

    console.log('✅ Migration 003 applied successfully!')
  } catch (error: any) {
    console.error('❌ Error applying migration:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

applyMigration()
