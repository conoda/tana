// Example: Querying smart contracts on the blockchain
export const contractExample = `// contract query example - read smart contracts
import { console } from 'tana/core'
import { fetch } from 'tana/utils'

console.log("querying blockchain contracts...\\n")

try {
  // List all active contracts
  const contractsResponse = await fetch('http://localhost:8080/contracts?active=true')
  const contracts = await contractsResponse.json()

  console.log(\`Found \${contracts.length} active contract(s)\\n\`)

  // Display each contract
  for (const contract of contracts) {
    console.log(\`Contract: \${contract.name}\`)
    console.log(\`  ID: \${contract.id}\`)
    console.log(\`  Owner: \${contract.ownerId}\`)
    console.log(\`  Version: \${contract.version}\`)
    console.log(\`  Deployed in Block: \${contract.deployedInBlock}\`)
    console.log(\`  Active: \${contract.isActive}\`)

    if (contract.description) {
      console.log(\`  Description: \${contract.description}\`)
    }

    // Show the contract source code
    console.log(\`  Source Code:\`)
    console.log(\`    \${contract.sourceCode.split('\\n').join('\\n    ')}\`)
    console.log('')
  }

  // Query a specific contract by ID (use real ID from above)
  if (contracts.length > 0) {
    const firstContract = contracts[0]
    const detailResponse = await fetch(\`http://localhost:8080/contracts/\${firstContract.id}\`)
    const detail = await detailResponse.json()

    console.log("\\nDetailed contract info:")
    console.log(\`  Code Hash: \${detail.codeHash}\`)
    console.log(\`  Created: \${new Date(detail.createdAt).toLocaleString()}\`)
    console.log(\`  Updated: \${new Date(detail.updatedAt).toLocaleString()}\`)
  }

} catch (error) {
  console.error("query failed:", error.message)
  console.error("\\nMake sure the ledger service is running on port 8080")
}

console.log("\\nthis playground is read-only - queries work, writes don't!")
`;
