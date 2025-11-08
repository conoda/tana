/**
 * Apply Migration 004
 *
 * Adds contract_deployment transaction type and contracts table
 */

import postgres from 'postgres'
import { readFileSync } from 'fs'
import { join } from 'path'

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://tana:tana_dev_password@localhost:5432/tana'

async function applyMigration() {
  console.log('Applying migration 004...')

  const sql = postgres(DATABASE_URL)

  try {
    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations', '0004_contracts.sql'),
      'utf-8'
    )

    await sql.unsafe(migrationSQL)

    console.log('✅ Migration 004 applied successfully!')
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('✅ Migration already applied')
    } else {
      console.error('❌ Error applying migration:', error)
      process.exit(1)
    }
  } finally {
    await sql.end()
  }
}

applyMigration()
