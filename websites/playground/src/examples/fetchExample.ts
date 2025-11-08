// Example: Using fetch with Tana's whitelisted domains
export const fetchExample = `// fetch example - pokemon data from pokeapi
import { console } from 'tana:core'
import { fetch } from 'tana:utils'

console.log("fetching pokemon data...\n")

try {
  const response = await fetch('https://pokeapi.co/api/v2/pokemon/ditto')
  const data = await response.json()

  console.log("name:", data.name)
  console.log("height:", data.height)
  console.log("weight:", data.weight)
  console.log("abilities:", data.abilities.map(a => a.ability.name).join(', '))
} catch (error) {
  console.error("fetch failed:", error.message)
}

// try fetching from non-whitelisted domain (will fail)
// uncomment to test security:
// const bad = await fetch('https://google.com')
`;
