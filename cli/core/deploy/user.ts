/**
 * tana deploy user <username>
 *
 * Deploys a user account to the blockchain
 */

import { createSpinner } from 'nanospinner'
import chalk from 'chalk'
import {
  readUserConfig,
  getDeploymentTarget
} from '../../utils/config'

export async function deployUser(username: string, targetUrl?: string) {
  console.log(chalk.bold(`\n🚀 Deploying user: ${username}\n`))

  // Read user config
  const spinner = createSpinner('Reading user configuration...').start()
  const userConfig = readUserConfig(username)

  if (!userConfig) {
    spinner.error({ text: `User "${username}" not found` })
    console.log(chalk.gray(`\nCreate the user first with: ${chalk.cyan(`tana new user ${username}`)}\n`))
    process.exit(1)
  }

  spinner.success({ text: 'User configuration loaded' })

  // Determine deployment target
  const targetSpinner = createSpinner('Determining deployment target...').start()

  let target = targetUrl
  if (!target) {
    target = await getDeploymentTarget()
  }

  if (!target) {
    targetSpinner.error({ text: 'No deployment target found' })
    console.log(chalk.yellow('\nNo running chain detected.'))
    console.log(chalk.gray(`\nOptions:`))
    console.log(chalk.gray(`  1. Start local chain:  ${chalk.cyan('tana start')}`))
    console.log(chalk.gray(`  2. Specify target:     ${chalk.cyan(`tana deploy user ${username} --target <url>`)}\n`))
    process.exit(1)
  }

  targetSpinner.success({ text: `Target: ${target}` })

  // Deploy user
  const deploySpinner = createSpinner('Creating user transaction...').start()

  try {
    const response = await fetch(`${target}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: userConfig.publicKey,
        username: userConfig.username,
        displayName: userConfig.displayName,
        bio: ''
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Deployment failed')
    }

    const result = await response.json()
    deploySpinner.success({ text: 'User transaction created' })

    // Success message
    console.log(chalk.green(`\n✓ User deployed successfully!\n`))
    console.log(chalk.gray('━'.repeat(50)))
    console.log(chalk.bold('Deployment Details:'))
    console.log(`  Username:      ${chalk.cyan(username)}`)
    console.log(`  User ID:       ${chalk.gray(result.userId)}`)
    console.log(`  Transaction:   ${chalk.gray(result.transactionId)}`)
    console.log(`  Status:        ${chalk.yellow('Pending block inclusion')}`)
    console.log(chalk.gray('━'.repeat(50)))

    console.log(chalk.bold('\nNext Steps:'))
    console.log(`  1. Wait for block production (automatic)`)
    console.log(`  2. Check balance:  ${chalk.cyan(`tana balance ${username}`)}`)
    console.log()

  } catch (error: any) {
    deploySpinner.error({ text: 'Deployment failed' })
    console.log(chalk.red(`\n✗ Error: ${error.message}\n`))
    process.exit(1)
  }
}
