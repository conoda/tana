/**
 * Blocks API Routes
 */

import { Hono } from 'hono'
import * as blockService from '../../blockchain/blocks'

const app = new Hono()

// GET /blocks - List blocks (paginated, newest first)
app.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10')
  const offset = parseInt(c.req.query('offset') || '0')

  const blocks = await blockService.listBlocks(limit, offset)
  return c.json(blocks)
})

// GET /blocks/latest - Get latest block
app.get('/latest', async (c) => {
  const block = await blockService.getLatestBlock()

  if (!block) {
    return c.json({ error: 'No blocks found' }, 404)
  }

  return c.json(block)
})

// GET /blocks/:height - Get block by height
app.get('/:height', async (c) => {
  const height = parseInt(c.req.param('height'))

  if (isNaN(height)) {
    return c.json({ error: 'Invalid block height' }, 400)
  }

  const block = await blockService.getBlockByHeight(height)

  if (!block) {
    return c.json({ error: 'Block not found' }, 404)
  }

  return c.json(block)
})

// GET /blocks/hash/:hash - Get block by hash
app.get('/hash/:hash', async (c) => {
  const { hash } = c.req.param()
  const block = await blockService.getBlockByHash(hash)

  if (!block) {
    return c.json({ error: 'Block not found' }, 404)
  }

  return c.json(block)
})

export default app
