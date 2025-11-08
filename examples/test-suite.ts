// Comprehensive Test Suite
// Tests multiple blockchain operations for sanity checking

import { console } from 'tana:core'
import { block } from 'tana:block'
import { tx } from 'tana:tx'

console.log("=== Tana Blockchain Test Suite ===\n")

let passedTests = 0
let failedTests = 0

function testResult(name: string, passed: boolean, message?: string) {
  if (passed) {
    console.log(`✓ ${name}`)
    passedTests++
  } else {
    console.log(`✗ ${name}`)
    if (message) console.log(`  ${message}`)
    failedTests++
  }
}

// TEST 1: User Lookup
console.log("--- Test 1: User Lookup ---")
const alice = await block.getUser('@alice')
testResult("Alice exists", alice !== null)

const bob = await block.getUser('@bob')
testResult("Bob exists", bob !== null)

if (alice && bob) {
  testResult("Alice has correct username", alice.username === '@alice')
  testResult("Bob has correct username", bob.username === '@bob')
}

// TEST 2: Balance Queries
console.log("\n--- Test 2: Balance Queries ---")
if (alice && bob) {
  const aliceBalance = await block.getBalance(alice.id, 'USD')
  testResult("Alice has USD balance", aliceBalance > 0, `Balance: ${aliceBalance} USD`)

  const bobBalance = await block.getBalance(bob.id, 'USD')
  testResult("Bob balance is queryable", bobBalance >= 0, `Balance: ${bobBalance} USD`)

  // TEST 3: Batch Queries
  console.log("\n--- Test 3: Batch Queries ---")
  const usernames = ['@alice', '@bob', '@charlie']
  const users = await block.getUser(usernames)
  const foundUsers = users.filter(u => u !== null)
  testResult("Batch user query works", foundUsers.length >= 2, `Found ${foundUsers.length} users`)

  const userIds = foundUsers.map(u => u.id)
  const balances = await block.getBalance(userIds, 'USD')
  testResult("Batch balance query works", Array.isArray(balances) && balances.length === foundUsers.length)

  // TEST 4: Query Limit Enforcement
  console.log("\n--- Test 4: Query Limits ---")
  try {
    const tooMany = Array.from({ length: 11 }, (_, i) => `user_${i}`)
    await block.getUser(tooMany)
    testResult("Query limit enforced", false, "Should have thrown error for >10 queries")
  } catch (error) {
    testResult("Query limit enforced", true)
  }

  // TEST 5: Simple Transfer
  console.log("\n--- Test 5: Simple Transfer ---")
  const transferAmount = 25
  const aliceBalanceBefore = await block.getBalance(alice.id, 'USD')
  const bobBalanceBefore = await block.getBalance(bob.id, 'USD')

  if (aliceBalanceBefore >= transferAmount) {
    tx.transfer(alice.id, bob.id, transferAmount, 'USD')
    const result = await tx.execute()

    testResult("Transfer executed", result.success === true)
    testResult("Gas consumed", result.gasUsed > 0, `Gas: ${result.gasUsed}`)
    testResult("State changes recorded", result.changes.length === 1)

    console.log(`\n  Transfer: ${transferAmount} USD`)
    console.log(`  From: ${alice.username} (${aliceBalanceBefore} → ${aliceBalanceBefore - transferAmount} USD)`)
    console.log(`  To: ${bob.username} (${bobBalanceBefore} → ${bobBalanceBefore + transferAmount} USD)`)
  } else {
    testResult("Transfer skipped", true, "Insufficient balance")
  }

  // TEST 6: Self-Transfer Prevention
  console.log("\n--- Test 6: Invalid Operations ---")
  try {
    tx.transfer(alice.id, alice.id, 10, 'USD')
    testResult("Self-transfer prevented", false, "Should have thrown error")
  } catch (error) {
    testResult("Self-transfer prevented", true)
  }

  // TEST 7: Negative Amount Prevention
  try {
    tx.transfer(alice.id, bob.id, -10, 'USD')
    testResult("Negative amount prevented", false, "Should have thrown error")
  } catch (error) {
    testResult("Negative amount prevented", true)
  }

  // TEST 8: Zero Amount Prevention
  try {
    tx.transfer(alice.id, bob.id, 0, 'USD')
    testResult("Zero amount prevented", false, "Should have thrown error")
  } catch (error) {
    testResult("Zero amount prevented", true)
  }
}

// TEST 9: Block Context
console.log("\n--- Test 9: Block Context ---")
testResult("Block height available", block.height > 0, `Height: ${block.height}`)
testResult("Block timestamp available", block.timestamp > 0)
testResult("Block executor available", block.executor !== '')
testResult("Block gas limit set", block.gasLimit > 0, `Limit: ${block.gasLimit.toLocaleString()}`)
testResult("Max batch query defined", block.MAX_BATCH_QUERY === 10)

// Summary
console.log("\n" + "=".repeat(50))
console.log("TEST SUMMARY")
console.log("=".repeat(50))
console.log(`Total Tests: ${passedTests + failedTests}`)
console.log(`Passed: ${passedTests}`)
console.log(`Failed: ${failedTests}`)

if (failedTests === 0) {
  console.log("\n✓ ALL TESTS PASSED!")
} else {
  console.log(`\n✗ ${failedTests} test(s) failed`)
}
