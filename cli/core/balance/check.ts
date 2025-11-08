/**
 * tana balance <user>
 *
 * Check user balance
 */

import { createSpinner } from 'nanospinner'
import chalk from 'chalk'
import { getDeploymentTarget } from '../../utils/config'

export async function checkBalance(user: string, currency: string) {
  console.log(chalk.bold(`\n💰 Checking balance for: ${user}\n`))

  // Get target
  const targetSpinner = createSpinner('Finding blockchain...').start()
  const target = await getDeploymentTarget()

  if (!target) {
    targetSpinner.error({ text: 'No blockchain found' })
    console.log(chalk.yellow('\nNo running chain detected.'))
    console.log(chalk.gray(`Start a chain with: ${chalk.cyan('tana start')}\n`))
    process.exit(1)
  }

  targetSpinner.success({ text: `Connected to ${target}` })

  // Get user
  const userSpinner = createSpinner('Looking up user...').start()

  try {
    const usersResponse = await fetch(`${target}/users`)
    const users = await usersResponse.json()

    const foundUser = users.find((u: any) => u.username === user)

    if (!foundUser) {
      userSpinner.error({ text: 'User not found' })
      console.log(chalk.yellow(`\nUser "${user}" does not exist on this chain.\n`))
      process.exit(1)
    }

    userSpinner.success({ text: 'User found' })

    // Get balance
    const balanceSpinner = createSpinner(`Getting ${currency} balance...`).start()

    const balancesResponse = await fetch(`${target}/balances`)
    const balances = await balancesResponse.json()

    const balance = balances.find((b: any) =>
      b.ownerId === foundUser.id && b.currencyCode === currency
    )

    balanceSpinner.success({ text: 'Balance retrieved' })

    // Display result
    console.log(chalk.green(`\n✓ Balance retrieved\n`))
    console.log(chalk.gray('━'.repeat(50)))
    console.log(chalk.bold('Account Details:'))
    console.log(`  Username:      ${chalk.cyan(foundUser.username)}`)
    console.log(`  Display Name:  ${chalk.gray(foundUser.displayName)}`)
    console.log(`  Balance:       ${chalk.cyan(balance ? balance.amount : '0.00')} ${currency}`)
    console.log(chalk.gray('━'.repeat(50)))
    console.log()

  } catch (error: any) {
    console.log(chalk.red(`\n✗ Error: ${error.message}\n`))
    process.exit(1)
  }
}
