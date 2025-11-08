/**
 * tana new user <username>
 *
 * Creates a new user configuration locally.
 * Generates keypair and stores in ~/.config/tana/users/
 */

import { createSpinner } from 'nanospinner'
import chalk from 'chalk'
import { randomBytes } from 'crypto'
import {
  writeUserConfig,
  readUserConfig,
  type UserConfig
} from '../../utils/config'

interface NewUserOptions {
  name?: string
  bio?: string
}

export async function newUser(username: string, options: NewUserOptions) {
  console.log(chalk.bold(`\n👤 Creating user: ${username}\n`))

  // Validate username format
  if (!username.startsWith('@')) {
    console.log(chalk.red('✗ Username must start with @'))
    console.log(chalk.gray(`  Example: @alice\n`))
    process.exit(1)
  }

  const spinner = createSpinner('Checking for existing user...').start()

  // Check if user already exists
  const existing = readUserConfig(username)
  if (existing) {
    spinner.error({ text: `User "${username}" already exists` })
    console.log(chalk.gray(`\nLocation: ~/.config/tana/users/${username}.json`))
    console.log(chalk.yellow(`\nUse a different username or remove the existing user first.`))
    process.exit(1)
  }

  spinner.success({ text: 'No conflicts found' })

  // Generate keypair
  const keySpinner = createSpinner('Generating keypair...').start()
  const { publicKey, privateKey } = generateKeypair()
  keySpinner.success({ text: 'Keypair generated' })

  // Create user configuration
  const userConfig: UserConfig = {
    username,
    publicKey,
    privateKey,
    displayName: options.name || username.substring(1), // Remove @ for display name
    createdAt: new Date().toISOString(),
    chains: []
  }

  const writeSpinner = createSpinner('Writing user configuration...').start()
  writeUserConfig(username, userConfig)
  writeSpinner.success({ text: 'User configuration saved' })

  // Success message
  console.log(chalk.green(`\n✓ User created successfully!\n`))
  console.log(chalk.gray('━'.repeat(50)))
  console.log(chalk.bold('User Details:'))
  console.log(`  Username:      ${chalk.cyan(username)}`)
  console.log(`  Display Name:  ${chalk.cyan(userConfig.displayName)}`)
  if (options.bio) {
    console.log(`  Bio:           ${chalk.gray(options.bio)}`)
  }
  console.log(`  Public Key:    ${chalk.gray(publicKey.substring(0, 24) + '...')}`)
  console.log(chalk.gray('━'.repeat(50)))

  console.log(chalk.bold('\nNext Steps:'))
  console.log(`  1. Start a chain:      ${chalk.cyan(`tana start`)}`)
  console.log(`  2. Deploy user:        ${chalk.cyan(`tana deploy user ${username}`)}`)
  console.log(`  3. Check balance:      ${chalk.cyan(`tana balance ${username}`)}`)
  console.log()

  console.log(chalk.yellow('⚠️  Keep your private key safe!'))
  console.log(chalk.gray(`   Stored at: ~/.config/tana/users/${username}.json\n`))
}

/**
 * Generate Ed25519 keypair
 * TODO: Replace with proper Ed25519 implementation
 */
function generateKeypair(): { publicKey: string; privateKey: string } {
  // Simplified keypair generation for now
  // In production, use proper Ed25519 (e.g., @noble/ed25519)
  const privateKey = randomBytes(32).toString('hex')
  const publicKey = randomBytes(32).toString('hex')

  return {
    publicKey: `ed25519_${publicKey}`,
    privateKey: `ed25519_${privateKey}`
  }
}
