/**
 * tana new node
 *
 * Creates a new node to join an existing chain
 */

import chalk from 'chalk'

export async function newNode(connectUrl?: string) {
  console.log(chalk.bold('\n🔗 Creating new node...\n'))

  console.log(chalk.yellow('⚠️  Node functionality coming soon'))
  console.log()
  console.log(chalk.gray('This will allow you to:'))
  console.log(chalk.gray('  - Join existing blockchains as a validator'))
  console.log(chalk.gray('  - Participate in consensus'))
  console.log(chalk.gray('  - Sync blockchain state'))
  console.log()
}
