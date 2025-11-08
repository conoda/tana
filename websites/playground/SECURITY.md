# Security Architecture

The Tana Playground implements multiple layers of security to prevent malicious code execution.

## Security Layers

### 1. Sandboxed iframe (Primary Defense)

User code runs in an `<iframe sandbox="allow-scripts">` which restricts:

- ✅ **No top-level navigation** - Can't redirect the main page
- ✅ **No plugins** - Flash, Java, etc. disabled
- ✅ **No forms** - Can't submit data
- ✅ **No pointer lock** - Can't capture mouse
- ✅ **No popups** - window.open() blocked
- ✅ **Same-origin isolation** - Can't access parent frame data

Only `allow-scripts` is enabled, which permits JavaScript execution but nothing else.

### 2. Global API Removal

Before code execution, we explicitly delete dangerous globals:

```javascript
delete globalThis.fetch;              // No network requests
delete globalThis.XMLHttpRequest;     // No AJAX
delete globalThis.WebSocket;          // No websockets
delete globalThis.Worker;             // No workers
delete globalThis.SharedWorker;       // No shared workers
delete globalThis.ServiceWorker;      // No service workers
delete globalThis.indexedDB;          // No database access
delete globalThis.localStorage;       // No local storage
delete globalThis.sessionStorage;     // No session storage
delete globalThis.navigator;          // No navigator API
```

### 3. Limited API Surface (Whitelist)

Users only get access to APIs we explicitly provide:

- `tana:core` module with:
  - `console.log()` - Output only
  - `console.error()` - Error output only
  - `version` - Read-only version info
  - **Future:** Blockchain simulation APIs (all mocked)

### 4. Content Security Policy

HTTP headers restrict what can load/execute:

```
Content-Security-Policy:
  - default-src 'self'
  - script-src 'self' https://unpkg.com (Monaco only)
  - connect-src 'self' (no external requests)
  - object-src 'none' (no plugins)
```

Sandbox page has even stricter CSP:
```
Content-Security-Policy:
  - default-src 'none'
  - script-src 'self' 'unsafe-eval'
  - frame-ancestors 'self'
```

### 5. TypeScript Transpilation (Not Execution)

Code is transpiled first, never directly executed:
1. User writes TypeScript
2. TypeScript compiler transpiles to JavaScript
3. Import statements are rewritten
4. Only then is code executed with `eval()` in isolated scope

### 6. Whitelisted Network Access

Unlike most sandboxes that completely block network access, Tana Playground provides a **whitelisted `fetch()` API** via `tana:utils`:

```javascript
import { fetch } from 'tana:utils'

// ✅ Allowed - whitelisted domain
const response = await fetch('https://pokeapi.co/api/v2/pokemon/pikachu')

// ❌ Blocked - not whitelisted
const response = await fetch('https://google.com')
// Error: fetch blocked: domain "google.com" not in whitelist
```

**Whitelisted domains:**
- `pokeapi.co` - Testing until Tana infrastructure is ready
- `*.tana.dev` - Tana blockchain/API endpoints
- `localhost` / `127.0.0.1` - Local development

The whitelist is hardcoded in the sandbox and cannot be bypassed. This allows:
- ✅ Fetching blockchain data from Tana APIs
- ✅ Interacting with Tana smart contracts
- ✅ Testing with known-safe APIs (PokeAPI)
- ❌ Making arbitrary network requests
- ❌ Data exfiltration
- ❌ SSRF attacks

### 7. Strict Mode

All code executes in strict mode:
```javascript
(function() {
  'use strict';
  eval(userCode);
})();
```

This prevents:
- Accidental globals
- `with` statements
- Octal literals
- Writing to read-only properties

## What Users CAN'T Do

❌ Make network requests to non-whitelisted domains
❌ Use XMLHttpRequest or WebSocket directly
❌ Access localStorage/sessionStorage/indexedDB
❌ Navigate or reload the page
❌ Open popups
❌ Access parent frame
❌ Create workers
❌ Access browser APIs (geolocation, camera, etc.)
❌ Read/write cookies
❌ Access the real DOM (outside iframe)

## What Users CAN Do

✅ Write TypeScript code
✅ Use Tana APIs (console, fetch from whitelisted domains)
✅ Define functions, classes, objects
✅ Use async/await with fetch
✅ Use loops, conditionals, etc.
✅ Work with data structures
✅ Make calculations
✅ Log output
✅ Fetch blockchain data from Tana endpoints
✅ Test with PokeAPI for demonstrations

## Known Limitations

### eval() is still used
While sandboxed, `eval()` is necessary for code execution. However, it's:
- Inside a sandboxed iframe
- With most APIs removed
- With CSP restrictions
- In strict mode

### Denial of Service
Users can still write infinite loops:
```javascript
while(true) {}
```

**Mitigation:** Browser tab isolation means this only freezes the sandbox iframe, not the entire playground. User can reload the page.

### Memory Consumption
Users can allocate large arrays/objects.

**Mitigation:** Browser memory limits apply. Tab isolation prevents crashing other tabs.

## Comparison to Similar Tools

| Tool | Sandbox | API Restrictions | Network Access |
|------|---------|------------------|----------------|
| **Tana Playground** | iframe + deleted globals | Whitelist only | Whitelisted domains |
| **TypeScript Playground** | iframe | Full DOM access | None |
| **CodeSandbox** | iframe | Full Node APIs | Allowed (all) |
| **StackBlitz** | WebContainers | Full Node APIs | Allowed (all) |

Tana Playground balances security with functionality by allowing network access only to trusted/necessary domains.

## Future Enhancements

1. **Execution timeout** - Kill infinite loops after N seconds
2. **Memory limits** - Restrict allocations
3. **CPU throttling** - Limit computation time
4. **Rate limiting** - Limit execution frequency
5. **Code analysis** - Static analysis before execution

## Reporting Security Issues

If you discover a security vulnerability, please email security@tana.dev (or file an issue in the repo).
