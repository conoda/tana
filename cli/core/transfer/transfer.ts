/**
 * tana transfer <from> <to> <amount> <currency>
 *
 * Transfer funds between users
 */

import chalk from 'chalk'

export async function transfer(from: string, to: string, amount: string, currency: string) {
  console.log(chalk.bold(`\n💸 Transfer: ${amount} ${currency}\n`))
  console.log(chalk.gray(`  From: ${from}`))
  console.log(chalk.gray(`  To:   ${to}`))
  console.log()

  console.log(chalk.yellow('⚠️  Transfer functionality coming soon'))
  console.log()
  console.log(chalk.gray('This will:'))
  console.log(chalk.gray('  - Create a transfer transaction'))
  console.log(chalk.gray('  - Submit to blockchain'))
  console.log(chalk.gray('  - Wait for confirmation'))
  console.log()
}
