# Tana Runtime

A lightweight experimental JS/TS runtime built on top of **deno_core**.  
It creates a sandboxed V8 environment, loads TypeScript dynamically, and runs user scripts with strict isolation — similar in spirit to Cloudflare Workers.

---

## Overview

Tana Runtime does the following:

1. Bootstraps a **V8 + deno_core** runtime.
2. Loads the **TypeScript compiler** (`typescript.js`) directly in JS.
3. Injects internal globals (`tana-globals.ts`) and hides the real `Deno` API.
4. Provides a simple import system using virtual modules like `tana:core`.
5. Transpiles and runs user scripts (e.g. `example.ts`) safely inside the sandbox.

---

## Data Model

The ledger’s core data model tracks **multi-currency balances**, deposits, withdrawals, and transactions in PostgreSQL using **block batching**, **account-based validation**, and **Ed25519 signatures**. State changes are defined by small, hash-verifiable **smart contracts** written in TypeScript that act as deterministic state machines. Each contract is identified by a **code hash** and can be referenced by friendly alias URLs like `tana.cash/@user/tx` or full hash addresses like `tana.cash/@user/ab6bjk8hbvv6zzz…`.

---

## Architecture

Tana Runtime is part of a larger ledger system that combines TypeScript smart contracts, PostgreSQL persistence, and a sandboxed runtime environment. It runs on the edge—whether Node.js, Cloudflare Workers, or a custom V8 runtime—and executes deterministic smart contracts that mutate the ledger state.

Blocks batch multiple transactions, each validated with Ed25519 signatures and verified using Merkle-style state proofs. This design ensures secure, consistent state transitions across distributed nodes.

---

## Database Schema

The database schema includes several key tables to support the ledger and smart contract execution:

- `accounts`: stores multi-currency balances, metadata, and versioned state hashes for each account.
- `transactions`: records submitted transactions with references to the associated contract hashes.
- `blocks`: contains ordered, batched transactions along with the resulting state root hash.
- `contracts`: stores the code blobs and hashes of deterministic smart contracts.
- `account_locks`: enforces that only one pending modification can occur per account at a time.

---

## File Summary

| File | Description |
|------|--------------|
| **src/main.rs** | Main entry point. Initializes `JsRuntime`, loads internal modules, defines globals, and executes TypeScript user scripts. |
| **build.rs** | Build script that extracts version info (Tana, Deno Core, and V8) at compile time from Cargo metadata. |
| **Cargo.toml / Cargo.lock** | Rust dependencies and resolved versions. The runtime prints these versions on startup. |
| **typescript.js** | Embedded TypeScript compiler. Used to transpile `.ts` code to `.js` before execution. |
| **tana-globals.ts** | Internal bootstrap that defines `globalThis.tana`, hides the `Deno` global, and sets allowed APIs for user code. |
| **example.ts** | Example TypeScript user program showing imports from `tana:core`, printing messages, and accessing version info. |
| **types/tana.d.ts** | Type declarations for `tana` and the virtual module `tana:core`. Helps TypeScript/VS Code understand the fake runtime. |
| **tsconfig.json** | TypeScript configuration file. Maps `"tana:*"` paths to local type definitions and includes all `.d.ts` files. |
| **runtime.js / empty.js** | Placeholder or experimental JS runtime utilities (not essential). |
| **target/** | Rust build output. |

---

## Current Flow

1. `main.rs` starts the runtime.
2. Loads `typescript.js` and `tana-globals.ts`.
3. Defines a simple JS module registry (`tana:core`).
4. Reads `example.ts`, transpiles it to JS using TypeScript, then runs it.
5. Output is isolated per execution — no shared global state or `Deno` leakage.

---

## Notes

- The fake import system (`tana:core`) is temporary and will later be replaced by a Rust `ModuleLoader`.
- `globalThis.Deno` is deleted to ensure a true sandbox.
- The project aims to evolve into a lightweight, secure, per-request runtime foundation for **Tana**.

---