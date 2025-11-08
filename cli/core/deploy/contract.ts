/**
 * tana deploy contract <path>
 *
 * Deploys a smart contract to the blockchain
 */

import chalk from 'chalk'

export async function deployContract(path: string, targetUrl?: string) {
  console.log(chalk.bold(`\n🚀 Deploying contract: ${path}\n`))

  console.log(chalk.yellow('⚠️  Contract deployment coming soon'))
  console.log()
  console.log(chalk.gray('This will:'))
  console.log(chalk.gray('  - Read contract.ts and contract.json'))
  console.log(chalk.gray('  - Create contract_deployment transaction'))
  console.log(chalk.gray('  - Deploy to blockchain'))
  console.log()
}
