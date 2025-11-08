/**
 * Apply Migration Script
 *
 * Manually applies the blocks table migration
 */

import postgres from 'postgres'
import { readFileSync } from 'fs'
import { join } from 'path'

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://tana:tana_dev_password@localhost:5432/tana'

async function applyMigration() {
  console.log('Applying blocks table migration...')

  const sql = postgres(DATABASE_URL)

  try {
    // Read migration file
    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations', '0001_simple_shadow_king.sql'),
      'utf-8'
    )

    // Execute migration
    await sql.unsafe(migrationSQL)

    console.log('✅ Migration applied successfully!')
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('✅ Blocks table already exists')
    } else {
      console.error('❌ Error applying migration:', error)
      process.exit(1)
    }
  } finally {
    await sql.end()
  }
}

applyMigration()
