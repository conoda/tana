// Default code shown when users first load the playground
// This is the landing page example that introduces Tana

export const defaultCode = `// welcome to tana playground!
//
// visit tana on the web @ https://tana.network
//
// copyright (c) 2025 sami fouad http://samifou.ad
//
import { console, version } from 'tana:core'
import { data } from 'tana:data'

console.log("hello. this is the tana playground.")
console.log("")
console.log("tana is a blockchain powered by typescript.")
console.log("")
console.log("version:", version)
console.log("")
console.log("=== Counter Contract Demo ===")
console.log("")

// Read current counter (or start at 0)
const current = await data.get('counter')
let count = 0
if (current !== null) {
  count = +current  // Unary plus converts to number
}

console.log("Current count:", count)
console.log("")

// Increment and store metadata
const newCount = count + 1
await data.set('counter', newCount)
await data.set('timestamp', newCount)  // Just store a number for now
await data.set('user', { name: 'tana', type: 'demo' })

// Commit to blockchain
await data.commit()
console.log("✓ Changes committed to blockchain")
console.log("New count:", newCount)
console.log("")

// Storage info
const allKeys = await data.keys()
console.log("Total keys in storage:", allKeys.length)
console.log("Storage limit:", data.MAX_TOTAL_SIZE, "bytes")
console.log("")
console.log("Try editing and running again to see the counter increment!")
`;
