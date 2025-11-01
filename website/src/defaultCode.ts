// Default code shown when users first load the playground
// This is the landing page example that introduces Tana

export const defaultCode = `// welcome to tana playground!
//
// visit tana on the web @ https://tana.network
// 
// copyright (c) 2025 sami fouad http://samifou.ad
//
import { console, version } from 'tana:core'
import { fetch } from 'tana:utils'

console.log("hello. this is the tana playground.")

console.log("tana's core is a blockchain written in rust.")

console.log("state changes are done with smart contracts written in typescript.")

console.log("version:", version)

console.log("code is executed inside of a secure, isolated environment.")

console.log("the runtime is so lightweight, it's running in your browser right now.")

console.log("when a contract is executed, you will have access to historical block data, account information as well as a select few static sources of data. fetch has to be limited like this for security, but also so nodes can base their execution on the same data.")

// only whitelisted domains are accessible
const response = await fetch('https://pokeapi.co/api/v2/pokemon/ditto')
const pokemon = await response.json()
console.log('Name:', pokemon.name)
console.log('Height:', pokemon.height)
console.log('Abilities:', pokemon.abilities.map(a => a.ability.name))

console.log("every run of your contract should yield the same data no matter when it's run.")
`;
