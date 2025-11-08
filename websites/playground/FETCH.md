# Whitelisted Fetch API

Tana Playground provides a `fetch()` API that follows the browser Fetch API specification, but with domain whitelisting for security.

## Usage

```typescript
import { fetch } from 'tana:utils'

// Fetch from a whitelisted domain
const response = await fetch('https://pokeapi.co/api/v2/pokemon/pikachu')
const data = await response.json()
console.log(data.name) // "pikachu"
```

## Whitelisted Domains

Only the following domains are allowed:

### Testing
- `pokeapi.co` - For testing and examples until Tana infrastructure is ready

### Tana Infrastructure
- `tana.dev`
- `api.tana.dev`
- `blockchain.tana.dev`

### Local Development
- `localhost`
- `127.0.0.1`

## API

The `fetch` function follows the standard [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) specification:

```typescript
function fetch(
  url: string | URL,
  options?: RequestInit
): Promise<Response>
```

**Parameters:**
- `url` - The URL to fetch from (must be on a whitelisted domain)
- `options` - Optional configuration (method, headers, body, etc.)

**Returns:**
- `Promise<Response>` - Standard Fetch API Response object

**Throws:**
- `Error` if the domain is not whitelisted

## Examples

### Basic GET Request

```typescript
import { console } from 'tana:core'
import { fetch } from 'tana:utils'

const response = await fetch('https://pokeapi.co/api/v2/pokemon/ditto')
const pokemon = await response.json()
console.log(pokemon.name, pokemon.height, pokemon.weight)
```

### With Error Handling

```typescript
import { console } from 'tana:core'
import { fetch } from 'tana:utils'

try {
  const response = await fetch('https://pokeapi.co/api/v2/pokemon/999999')

  if (!response.ok) {
    console.error('HTTP error:', response.status)
  } else {
    const data = await response.json()
    console.log(data)
  }
} catch (error) {
  console.error('Fetch failed:', error.message)
}
```

### Checking Response

```typescript
import { console } from 'tana:core'
import { fetch } from 'tana:utils'

const response = await fetch('https://pokeapi.co/api/v2/pokemon/pikachu')

console.log('Status:', response.status)
console.log('OK:', response.ok)
console.log('Headers:', response.headers.get('content-type'))

const data = await response.json()
console.log('Data:', data)
```

### What Happens with Non-Whitelisted Domains

```typescript
import { fetch } from 'tana:utils'

// ❌ This will throw an error
try {
  await fetch('https://google.com')
} catch (error) {
  // Error: fetch blocked: domain "google.com" not in whitelist.
  // Allowed domains: pokeapi.co, tana.dev, api.tana.dev, blockchain.tana.dev, localhost, 127.0.0.1
}
```

## Security

The whitelist is **hardcoded** in the sandbox environment and cannot be modified by user code. This prevents:

- ✅ Data exfiltration to arbitrary servers
- ✅ SSRF (Server-Side Request Forgery) attacks
- ✅ Fetching malicious scripts
- ✅ DDoS attacks on arbitrary targets

While still allowing:

- ✅ Fetching blockchain data from Tana APIs
- ✅ Smart contract execution with network access
- ✅ Testing and demonstrations with safe APIs

## Future: Tana Blockchain APIs

Once Tana infrastructure is deployed, you'll be able to:

```typescript
// Fetch current block
const block = await fetch('https://api.tana.dev/blocks/latest')
const data = await block.json()

// Fetch account balance
const balance = await fetch('https://api.tana.dev/accounts/0x123...')
const account = await balance.json()

// Fetch transaction history
const txs = await fetch('https://api.tana.dev/transactions?address=0x123...')
const transactions = await txs.json()
```

## Adding Domains to Whitelist

To add a new domain to the whitelist, edit:

```
playground/src/pages/sandbox.astro
```

Find the `ALLOWED_DOMAINS` array and add your domain:

```javascript
const ALLOWED_DOMAINS = [
  'pokeapi.co',
  'tana.dev',
  'api.tana.dev',
  'blockchain.tana.dev',
  'your-new-domain.com',  // Add here
  'localhost',
  '127.0.0.1'
];
```

**Important:** Only add domains you control or trust completely. This is a security-critical configuration.
