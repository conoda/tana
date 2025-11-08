/**
 * Apply Migration 002
 *
 * Adds user_creation transaction type and makes amount/currency nullable
 */

import postgres from 'postgres'
import { readFileSync } from 'fs'
import { join } from 'path'

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://tana:tana_dev_password@localhost:5432/tana'

async function applyMigration() {
  console.log('Applying migration 002...')

  const sql = postgres(DATABASE_URL)

  try {
    // Read migration file
    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations', '0002_crazy_fenris.sql'),
      'utf-8'
    )

    // Execute migration
    await sql.unsafe(migrationSQL)

    console.log('✅ Migration 002 applied successfully!')
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
