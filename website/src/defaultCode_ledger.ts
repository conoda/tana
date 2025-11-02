export const defaultCodeLedger = `import { console } from 'tana:core'
import { ledger } from 'tana:ledger'

// Query blockchain state from the ledger
console.log('🔍 Fetching blockchain state...')
console.log('')

try {
  // Get all users
  const users = await ledger.getUsers()
  console.log(\`📊 Found \${users.length} users:\`)
  users.forEach((user, i) => {
    console.log(\`  \${i+1}. \${user.username} - \${user.displayName}\`)
  })
  console.log('')

  // Get all balances
  const balances = await ledger.getBalances()
  console.log(\`💰 Found \${balances.length} balances:\`)
  balances.forEach((balance) => {
    console.log(\`  \${balance.amount} \${balance.currencyCode} (owner: \${balance.ownerId.slice(0,8)}...)\`)
  })
  console.log('')

  // Get all currencies
  const currencies = await ledger.getCurrencies()
  console.log(\`💱 Supported currencies:\`)
  currencies.forEach((currency) => {
    console.log(\`  \${currency.symbol} \${currency.code} - \${currency.name} (\${currency.type})\`)
  })
  console.log('')

  // If there are users, get detailed info for the first one
  if (users.length > 0) {
    const firstUser = users[0]
    console.log(\`🔎 Details for \${firstUser.username}:\`)

    const userBalances = await ledger.getUserBalances(firstUser.id)
    console.log(\`  Balances:\`)
    userBalances.forEach((balance) => {
      console.log(\`    - \${balance.amount} \${balance.currencyCode}\`)
    })
  }

  console.log('')
  console.log('✅ Successfully queried blockchain state!')
  console.log('💡 Check the other tabs to see users, balances, and transactions')

} catch (error) {
  console.error('Failed to fetch blockchain data')
  console.error('Make sure the ledger service is running on port 8080')
  console.error(\`Error: \${error.message}\`)
}
`
