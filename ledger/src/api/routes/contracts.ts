/**
 * Contract API Routes
 */

import { Hono } from 'hono'
import * as contractService from '../../contracts/contracts'

const app = new Hono()

// POST /contracts/deploy - Deploy a new contract
app.post('/deploy', async (c) => {
  try {
    const body = await c.req.json()

    // Validate required fields
    if (!body.ownerId || !body.name || !body.sourceCode) {
      return c.json({
        error: 'Missing required fields: ownerId, name, sourceCode'
      }, 400)
    }

    const result = await contractService.deployContract({
      ownerId: body.ownerId,
      name: body.name,
      sourceCode: body.sourceCode,
      description: body.description,
      metadata: body.metadata
    })

    return c.json(result, 201)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// GET /contracts - List all contracts
app.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = parseInt(c.req.query('offset') || '0')
  const active = c.req.query('active')

  const contracts = active === 'true'
    ? await contractService.getActiveContracts(limit, offset)
    : await contractService.listContracts(limit, offset)

  return c.json(contracts)
})

// GET /contracts/:id - Get contract by ID
app.get('/:id', async (c) => {
  const { id } = c.req.param()
  const contract = await contractService.getContractById(id)

  if (!contract) {
    return c.json({ error: 'Contract not found' }, 404)
  }

  return c.json(contract)
})

// GET /contracts/owner/:ownerId - Get contracts by owner
app.get('/owner/:ownerId', async (c) => {
  const { ownerId } = c.req.param()
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = parseInt(c.req.query('offset') || '0')

  const contracts = await contractService.getContractsByOwner(ownerId, limit, offset)
  return c.json(contracts)
})

// POST /contracts/:id/deactivate - Deactivate a contract
app.post('/:id/deactivate', async (c) => {
  try {
    const { id } = c.req.param()
    const body = await c.req.json()

    if (!body.ownerId) {
      return c.json({ error: 'Missing ownerId' }, 400)
    }

    const contract = await contractService.deactivateContract(id, body.ownerId)
    return c.json(contract)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

export default app
