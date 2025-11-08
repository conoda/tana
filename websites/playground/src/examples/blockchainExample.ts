// Example: Querying blockchain state (blocks, transactions, users)
export const blockchainExample = `// blockchain query example - explore the chain
import { console } from 'tana/core'
import { fetch } from 'tana/utils'

console.log("exploring the blockchain...\\n")

try {
  // Get recent blocks
  console.log("--- Recent Blocks ---")
  const blocksResponse = await fetch('http://localhost:8080/blocks?limit=5')
  const blocks = await blocksResponse.json()

  for (const block of blocks) {
    console.log(\`Block #\${block.height}\`)
    console.log(\`  Hash: \${block.hash.substring(0, 16)}...\`)
    console.log(\`  Transactions: \${block.txCount}\`)
    console.log(\`  Gas Used: \${block.gasUsed.toLocaleString()} / \${block.gasLimit.toLocaleString()}\`)
    console.log(\`  Timestamp: \${new Date(block.timestamp).toLocaleString()}\`)
    console.log('')
  }

  // Get recent transactions
  console.log("\\n--- Recent Transactions ---")
  const txResponse = await fetch('http://localhost:8080/transactions?limit=5')
  const transactions = await txResponse.json()

  for (const tx of transactions) {
    console.log(\`Transaction: \${tx.type}\`)
    console.log(\`  ID: \${tx.id.substring(0, 8)}...\`)
    console.log(\`  Status: \${tx.status}\`)
    console.log(\`  From: \${tx.from.substring(0, 8)}...\`)
    console.log(\`  To: \${tx.to.substring(0, 8)}...\`)

    if (tx.amount) {
      console.log(\`  Amount: \${tx.amount} \${tx.currencyCode}\`)
    }

    if (tx.blockHeight) {
      console.log(\`  Block: #\${tx.blockHeight}\`)
    }

    console.log('')
  }

  // Get all users
  console.log("\\n--- Blockchain Users ---")
  const usersResponse = await fetch('http://localhost:8080/users?limit=10')
  const users = await usersResponse.json()

  console.log(\`Total users: \${users.length}\\n\`)

  for (const user of users) {
    console.log(\`@\${user.username} - \${user.displayName}\`)

    // Get user's balances
    const balanceResponse = await fetch(\`http://localhost:8080/balances/\${user.id}\`)
    const balances = await balanceResponse.json()

    if (balances.length > 0) {
      console.log(\`  Balances:\`)
      for (const balance of balances) {
        console.log(\`    \${balance.amount} \${balance.currencyCode}\`)
      }
    }
    console.log('')
  }

} catch (error) {
  console.error("query failed:", error.message)
  console.error("\\nMake sure the ledger service is running on port 8080")
}

console.log("\\nplayground is read-only - perfect for blockchain exploration!")
`;
