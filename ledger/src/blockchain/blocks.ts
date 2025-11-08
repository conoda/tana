/**
 * Block Service
 *
 * Core functions for querying blockchain blocks
 */

import { db } from '../db'
import { blocks } from '../db/schema'
import { desc, eq } from 'drizzle-orm'

/**
 * Get block by height
 */
export async function getBlockByHeight(height: number) {
  const [block] = await db
    .select()
    .from(blocks)
    .where(eq(blocks.height, height))
    .limit(1)

  return block || null
}

/**
 * Get block by hash
 */
export async function getBlockByHash(hash: string) {
  const [block] = await db
    .select()
    .from(blocks)
    .where(eq(blocks.hash, hash))
    .limit(1)

  return block || null
}

/**
 * Get latest block
 */
export async function getLatestBlock() {
  const [block] = await db
    .select()
    .from(blocks)
    .orderBy(desc(blocks.height))
    .limit(1)

  return block || null
}

/**
 * List blocks (paginated, newest first)
 */
export async function listBlocks(limit: number = 10, offset: number = 0) {
  const results = await db
    .select()
    .from(blocks)
    .orderBy(desc(blocks.height))
    .limit(limit)
    .offset(offset)

  return results
}

/**
 * Get current block height
 */
export async function getCurrentHeight(): Promise<number> {
  const latest = await getLatestBlock()
  return latest ? latest.height : 0
}

/**
 * Get block count
 */
export async function getBlockCount(): Promise<number> {
  const latest = await getLatestBlock()
  return latest ? latest.height + 1 : 0 // Height starts at 0
}
