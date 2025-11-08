// Alice to Bob Transfer Test
// Simple sanity check for testing transfers between users

import { console } from 'tana:core'
import { block } from 'tana:block'
import { tx } from 'tana:tx'

console.log("=== Alice to Bob Transfer Test ===\n")

// Get Alice's user info
const alice = await block.getUser('@alice')
if (!alice) {
  console.error("✗ Alice not found!")
  throw new Error("Alice user does not exist")
}

// Get Bob's user info
const bob = await block.getUser('@bob')
if (!bob) {
  console.error("✗ Bob not found!")
  throw new Error("Bob user does not exist")
}

console.log(`From: ${alice.username} (${alice.displayName})`)
console.log(`To: ${bob.username} (${bob.displayName})`)

// Check current balances
const aliceBalance = await block.getBalance(alice.id, 'USD')
const bobBalance = await block.getBalance(bob.id, 'USD')

console.log(`\nBalances Before:`)
console.log(`  Alice: ${aliceBalance} USD`)
console.log(`  Bob: ${bobBalance} USD`)

// Transfer amount
const amount = 50

// Validate Alice has sufficient funds
if (aliceBalance < amount) {
  console.error(`\n✗ Insufficient funds!`)
  console.error(`  Need: ${amount} USD`)
  console.error(`  Have: ${aliceBalance} USD`)
  throw new Error("Insufficient balance")
}

console.log(`\nTransferring ${amount} USD...`)

// Propose transfer
tx.transfer(alice.id, bob.id, amount, 'USD')

// Execute transaction
const result = await tx.execute()

if (result.success) {
  console.log("\n✓ Transfer successful!")
  console.log(`Gas used: ${result.gasUsed.toLocaleString()}`)

  // Calculate expected balances
  const expectedAlice = aliceBalance - amount
  const expectedBob = bobBalance + amount

  console.log(`\nExpected Balances After:`)
  console.log(`  Alice: ${expectedAlice} USD`)
  console.log(`  Bob: ${expectedBob} USD`)
} else {
  console.log(`\n✗ Transfer failed: ${result.error}`)
}
