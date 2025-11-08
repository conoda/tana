/**
 * tana run <contract>
 *
 * Test run a contract locally using the runtime
 */

import { createSpinner } from 'nanospinner'
import chalk from 'chalk'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { spawn } from 'child_process'

export async function runContract(contractPath: string) {
  console.log(chalk.bold(`\n🏃 Running contract: ${contractPath}\n`))

  const spinner = createSpinner('Checking contract file...').start()

  // Resolve path
  const fullPath = resolve(contractPath)

  if (!existsSync(fullPath)) {
    spinner.error({ text: 'Contract file not found' })
    console.log(chalk.gray(`\nPath: ${fullPath}\n`))
    process.exit(1)
  }

  spinner.success({ text: 'Contract file found' })

  // Use the existing run-contract.ts script
  const scriptPath = findRunContractScript()

  if (!scriptPath) {
    console.log(chalk.yellow('\n⚠️  Contract runner not found'))
    console.log(chalk.gray('\nMake sure you are in the tana project directory.'))
    console.log(chalk.gray('The runner script should be at: scripts/run-contract.ts\n'))
    process.exit(1)
  }

  console.log(chalk.gray('━'.repeat(50)))
  console.log()

  // Run the contract
  const result = spawn('bun', [scriptPath, fullPath], {
    stdio: 'inherit'
  })

  return new Promise((resolve, reject) => {
    result.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined)
      } else {
        reject(new Error(`Contract execution failed with code ${code}`))
      }
    })
  })
}

function findRunContractScript(): string | null {
  const { existsSync } = require('fs')
  const { join } = require('path')

  // Try relative to current directory
  let scriptPath = resolve(join(process.cwd(), 'scripts', 'run-contract.ts'))
  if (existsSync(scriptPath)) return scriptPath

  // Try relative to parent directory (if in cli/)
  scriptPath = resolve(join(process.cwd(), '..', 'scripts', 'run-contract.ts'))
  if (existsSync(scriptPath)) return scriptPath

  return null
}
