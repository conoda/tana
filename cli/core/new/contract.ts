/**
 * tana new contract [name]
 *
 * Scaffolds a new smart contract in the current directory.
 * Creates contract.ts and contract.json files.
 */

import { createSpinner } from 'nanospinner'
import chalk from 'chalk'
import { existsSync, writeFileSync } from 'fs'
import { join } from 'path'

const CONTRACT_TEMPLATE = `// Tana Smart Contract
import { console } from 'tana:core'
import { block } from 'tana:block'
import { tx } from 'tana:tx'
import { data } from 'tana:data'

console.log("Contract executing...")

// Query blockchain state
const executor = await block.getUser(block.executor)
if (executor) {
  console.log(\`Executor: \${executor.username}\`)
}

// Example: Simple counter
const counter = await data.get('counter')
const count = counter ? parseInt(counter as string) : 0

console.log(\`Current count: \${count}\`)

// Increment counter
await data.set('counter', String(count + 1))
await data.commit()

console.log("✓ Contract executed successfully")
`

interface ContractMetadata {
  name: string
  version: string
  description: string
  author?: string
  createdAt: string
}

export async function newContract(name?: string) {
  const contractName = name || 'contract'

  console.log(chalk.bold(`\n📄 Creating smart contract: ${contractName}\n`))

  const contractPath = join(process.cwd(), 'contract.ts')
  const metadataPath = join(process.cwd(), 'contract.json')

  const spinner = createSpinner('Checking for existing files...').start()

  // Check if files already exist
  if (existsSync(contractPath)) {
    spinner.error({ text: 'contract.ts already exists' })
    console.log(chalk.yellow(`\nRemove existing file or run in a different directory.\n`))
    process.exit(1)
  }

  if (existsSync(metadataPath)) {
    spinner.error({ text: 'contract.json already exists' })
    console.log(chalk.yellow(`\nRemove existing file or run in a different directory.\n`))
    process.exit(1)
  }

  spinner.success({ text: 'No conflicts found' })

  // Create contract metadata
  const metadata: ContractMetadata = {
    name: contractName,
    version: '0.1.0',
    description: 'A Tana smart contract',
    createdAt: new Date().toISOString()
  }

  // Write files
  const writeSpinner = createSpinner('Creating contract files...').start()

  try {
    writeFileSync(contractPath, CONTRACT_TEMPLATE)
    writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
    writeSpinner.success({ text: 'Contract files created' })
  } catch (error) {
    writeSpinner.error({ text: 'Failed to create files' })
    console.error(chalk.red(`\nError: ${error}\n`))
    process.exit(1)
  }

  // Success message
  console.log(chalk.green(`\n✓ Contract scaffolded successfully!\n`))
  console.log(chalk.gray('━'.repeat(50)))
  console.log(chalk.bold('Files Created:'))
  console.log(`  ${chalk.cyan('contract.ts')}      - Contract code`)
  console.log(`  ${chalk.cyan('contract.json')}    - Contract metadata`)
  console.log(chalk.gray('━'.repeat(50)))

  console.log(chalk.bold('\nNext Steps:'))
  console.log(`  1. Edit contract:      ${chalk.cyan(`nano contract.ts`)}`)
  console.log(`  2. Test locally:       ${chalk.cyan(`tana run contract.ts`)}`)
  console.log(`  3. Deploy to chain:    ${chalk.cyan(`tana deploy contract contract.ts`)}`)
  console.log()

  console.log(chalk.gray('📖 Available modules:'))
  console.log(chalk.gray('   tana:core  - console, version'))
  console.log(chalk.gray('   tana:block - blockchain queries'))
  console.log(chalk.gray('   tana:tx    - transactions'))
  console.log(chalk.gray('   tana:data  - key-value storage'))
  console.log(chalk.gray('   tana:utils - fetch\n'))
}
