# Tana Playground

A browser-based TypeScript playground for the Tana runtime, inspired by the TypeScript Playground and built with the same architecture as [linkhash](https://github.com/samifouad/linkhash).

## Architecture

- **Astro** - Static site framework
- **Svelte** - Component framework
- **Monaco Editor** - Code editor (VS Code editor component)
- **Web Workers** - Isolated code execution
- **TypeScript Compiler** - Browser-based transpilation

## How It Works

```
┌─────────────────┐         ┌──────────────────────┐
│  Main Thread    │         │   Web Worker         │
│  (Monaco Editor)│ ◄─────► │  (TS Compiler + Eval)│
│                 │  msgs   │                      │
└─────────────────┘         └──────────────────────┘
       │                             │
       │                             │
   User writes               Transpile & Execute
   TypeScript                  (pure JavaScript)
```

The code executes entirely in the browser:
1. User writes TypeScript in Monaco Editor
2. Code sent to Web Worker via `postMessage`
3. Worker transpiles TypeScript to JavaScript
4. JavaScript executed with Tana APIs available
5. Results sent back to main thread
6. Output displayed in result panel

## Setup

### Prerequisites

- Node.js 18+

### Quick Start

1. Run setup (copies TypeScript compiler):
   ```bash
   ./setup.sh
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start dev server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:4321

## Modules

### `tana:core`
Core runtime APIs:
- `console.log()` / `console.error()` - Output
- `version` - Runtime version info

### `tana:utils`
Utility functions:
- `fetch()` - Whitelisted HTTP requests (see [FETCH.md](./FETCH.md))

## Development

### Project Structure

```
playground/
├── public/
│   └── js/
│       ├── worker.js        # Web Worker for code execution
│       └── typescript.js    # TypeScript compiler (copied by setup.sh)
├── src/
│   ├── components/
│   │   └── Editor.svelte    # Main editor component
│   ├── layouts/
│   │   └── BaseLayout.astro # Base HTML layout
│   └── pages/
│       └── index.astro      # Main playground page
└── setup.sh                 # Setup script
```

### Auto-Execution

- **On page load**: Code executes immediately when you first open the playground
- **As you type**: Code runs automatically after 600ms of inactivity
- **Ctrl/Cmd+Enter**: Execute immediately without waiting for debounce

### Keyboard Shortcuts

- **Ctrl+Enter** (Cmd+Enter on Mac) - Execute code immediately
- Standard Monaco Editor shortcuts (Ctrl+Z for undo, Ctrl+F for find, etc.)

### Adding New APIs

To add new Tana blockchain APIs:

1. Edit `public/js/worker.js` and add to the `tanaModules` object:
   ```javascript
   const tanaModules = {
     'tana:core': {
       console: { /* ... */ },
       version: { /* ... */ },
       blockchain: {
         createTransaction(from, to, amount) {
           // Your implementation
         },
         getBalance(address) {
           // Mock or simulated balance
           return 1000.0;
         }
       }
     }
   };
   ```

2. Add type definitions in `../types/tana-core.d.ts`

3. Restart the dev server

## License

Same as parent project.
