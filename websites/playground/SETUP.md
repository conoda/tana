# Tana Playground Setup Guide

## Quick Start

### 1. Run setup script

```bash
cd playground
./setup.sh
```

This will copy the TypeScript compiler to `public/js/`

### 2. Install Node dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

### 4. Open your browser

Navigate to http://localhost:4321

## What You'll See

A split-screen interface:
- **Left:** Monaco Editor with TypeScript code
- **Right:** Output panel showing console.log/error results

### Try it out

The default code shows:
- Importing from `tana:core`
- Using `console.log()` and `console.error()`
- Working with version info
- Multiple arguments and object stringification

**Code runs automatically:**
- Executes immediately when the page loads
- Re-executes as you type (600ms debounce)
- Press Ctrl+Enter (Cmd+Enter on Mac) to execute immediately without waiting

## Troubleshooting

### "TypeScript compiler not found"
Make sure `typescript.js` exists in the parent directory:
```bash
ls ../typescript.js
```

If it's missing, you need to download it from the TypeScript project.

### Worker initialization fails
Check browser console for errors. Make sure:
- `public/js/typescript.js` exists
- `public/js/worker.js` exists

### Monaco Editor doesn't load
This uses a CDN for Monaco. Check your internet connection or download Monaco locally.

## Next Steps

Once the playground is working, you can:

1. **Add blockchain APIs** - Extend `src/lib.rs` with transaction/blockchain ops
2. **Customize the UI** - Edit `src/components/Editor.svelte`
3. **Add examples** - Create a library of sample code
4. **Deploy** - Build for production: `npm run build`

## Architecture Overview

```
User Code → Monaco Editor → Web Worker → TypeScript Compiler → eval()
                                ↓
                          Capture Output
                                ↓
                        Display in UI
```

Everything runs in the browser - no server needed for execution!

This is similar to how linkhash works:
- Code is written in TypeScript
- Transpiled in a Web Worker
- Executed in an isolated context
- Results sent back to the UI
