// Default code shown when users first load the playground
// This is the landing page example that introduces Tana

export const defaultCode = `// welcome to tana playground!
//
// visit tana on the web @ https://tana.network
//
// copyright (c) 2025 sami fouad http://samifou.ad
//
import { console, version } from 'tana/core'
import { fetch } from 'tana/utils'

console.log("hello. this is the tana playground.")
console.log("tana is a blockchain with smart contracts written in typescript.")
console.log("this playground lets you explore the blockchain (read-only).")
console.log("version:", version)
console.log("")

// QUERY THE LIVE BLOCKCHAIN
// this playground can read from your local ledger service
console.log("--- Exploring the Blockchain ---\\n")

try {
  // Get recent blocks
  const blocksRes = await fetch('http://localhost:8080/blocks?limit=3')
  const blocks = await blocksRes.json()

  console.log(\`Latest blocks (showing \${blocks.length}):\`)
  for (const block of blocks) {
    console.log(\`  Block #\${block.height}: \${block.txCount} tx, \${block.gasUsed} gas\`)
  }

  // Get blockchain users
  console.log("\\nBlockchain users:")
  const usersRes = await fetch('http://localhost:8080/users?limit=5')
  const users = await usersRes.json()

  for (const user of users) {
    console.log(\`  @\${user.username} - \${user.displayName}\`)
  }

  // Get smart contracts
  console.log("\\nDeployed smart contracts:")
  const contractsRes = await fetch('http://localhost:8080/contracts?active=true')
  const contracts = await contractsRes.json()

  if (contracts.length > 0) {
    for (const contract of contracts) {
      console.log(\`  \${contract.name} (v\${contract.version})\`)
      console.log(\`    Deployed in block #\${contract.deployedInBlock}\`)
    }
  } else {
    console.log("  (no contracts deployed yet)")
  }

  // Get recent transactions
  console.log("\\nRecent transactions:")
  const txRes = await fetch('http://localhost:8080/transactions?limit=3')
  const txs = await txRes.json()

  for (const tx of txs) {
    console.log(\`  \${tx.type}: \${tx.status}\`)
  }

  console.log("\\n✓ Successfully queried the blockchain!")

} catch (error) {
  console.error("✗ Could not connect to ledger service")
  console.error("  Make sure it's running on port 8080")
  console.error("  Error:", error.message)
}

console.log("\\ntry these examples:")
console.log("  • see examples/contractExample.ts - query smart contracts")
console.log("  • see examples/blockchainExample.ts - explore blocks & txs")
console.log("  • see examples/fetchExample.ts - fetch external APIs")
`;
