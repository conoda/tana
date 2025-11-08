/**
 * Ledger HTTP Server
 *
 * Runs the ledger service within the CLI process
 */

import { serve } from 'bun'
import chalk from 'chalk'

export interface LedgerConfig {
  port: number
  chain: string
  databaseUrl: string
}

export async function startLedger(config: LedgerConfig) {
  console.log(chalk.gray('━'.repeat(50)))
  console.log(chalk.bold('Starting Ledger Service...'))
  console.log(chalk.gray('━'.repeat(50)))
  console.log()

  // Load .env file from root if DATABASE_URL is not already set
  if (!config.databaseUrl && !process.env.DATABASE_URL) {
    const rootEnvPath = new URL('../../../.env', import.meta.url).pathname
    try {
      const envContent = await Bun.file(rootEnvPath).text()
      const envVars = envContent
        .split('\n')
        .filter(line => line && !line.startsWith('#'))
        .reduce((acc, line) => {
          const [key, ...values] = line.split('=')
          if (key && values.length) {
            acc[key.trim()] = values.join('=').trim().replace(/^['"]|['"]$/g, '')
          }
          return acc
        }, {} as Record<string, string>)

      if (envVars.DATABASE_URL) {
        process.env.DATABASE_URL = envVars.DATABASE_URL
        console.log(chalk.gray('✓ Loaded DATABASE_URL from .env file'))
      }
    } catch (error) {
      // .env file not found or unreadable, continue with defaults
    }
  }

  // Set environment variables
  process.env.PORT = String(config.port)
  if (config.databaseUrl) {
    process.env.DATABASE_URL = config.databaseUrl
  }

  try {
    // Import ledger app
    // Use absolute path from project root
    const ledgerPath = new URL('../../../ledger/src/index.ts', import.meta.url).pathname
    const ledger = await import(ledgerPath)

    // Start Bun server
    const server = serve({
      port: config.port,
      fetch: ledger.default.fetch,
    })

    console.log(chalk.green('✓ Ledger service started\n'))
    console.log(chalk.gray('━'.repeat(50)))
    console.log(chalk.bold('Service Running:'))
    console.log(`  URL:     ${chalk.cyan(`http://localhost:${config.port}`)}`)
    console.log(`  Chain:   ${chalk.cyan(config.chain)}`)
    console.log(`  PID:     ${chalk.gray(process.pid)}`)
    console.log(chalk.gray('━'.repeat(50)))
    console.log()
    console.log(chalk.gray('Press Ctrl+C to stop'))
    console.log()

    // Handle graceful shutdown
    const shutdown = () => {
      console.log(chalk.yellow('\n\nShutting down...'))
      server.stop()
      process.exit(0)
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)

    // Keep process alive
    await new Promise(() => {}) // Block forever
  } catch (error) {
    console.error(chalk.red('\n✗ Failed to start ledger service'))
    console.error(chalk.gray(`\nError: ${error instanceof Error ? error.message : String(error)}`))

    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.log(chalk.yellow('\nDatabase connection failed. Make sure PostgreSQL is running:'))
      console.log(chalk.gray('  docker compose up postgres -d\n'))
    }

    process.exit(1)
  }
}
