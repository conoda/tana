declare module "tana:data" {
  /**
   * Contract data storage - Key-Value store
   *
   * Supports both strings and JSON-serializable objects.
   * All operations are staged until commit() is called.
   *
   * Storage limits:
   * - Max key size: 256 bytes
   * - Max value size: 10 KB
   * - Max total storage: 100 KB
   * - Max keys: 1000
   */
  export const data: {
    /**
     * Maximum key size in bytes
     */
    readonly MAX_KEY_SIZE: 256;

    /**
     * Maximum value size in bytes (10 KB)
     */
    readonly MAX_VALUE_SIZE: 10240;

    /**
     * Maximum total storage size in bytes (100 KB)
     */
    readonly MAX_TOTAL_SIZE: 102400;

    /**
     * Maximum number of keys
     */
    readonly MAX_KEYS: 1000;

    /**
     * Set a value in contract storage (staged until commit)
     *
     * @param key - Storage key (max 256 bytes)
     * @param value - String or JSON-serializable object (max 10 KB)
     * @throws Error if key or value exceed size limits
     *
     * @example
     * ```typescript
     * // String values
     * await data.set('username', 'alice')
     *
     * // Object values (auto-serialized to JSON)
     * await data.set('user', { name: 'alice', balance: 1000 })
     * ```
     */
    set(key: string, value: string | object): Promise<void>;

    /**
     * Get a value from contract storage
     *
     * Returns staged value if exists, otherwise committed value.
     * Automatically deserializes JSON objects.
     *
     * @param key - Storage key
     * @returns Value (string or object) or null if not found
     *
     * @example
     * ```typescript
     * const username = await data.get('username') // Returns: 'alice'
     * const user = await data.get('user') // Returns: { name: 'alice', balance: 1000 }
     * const missing = await data.get('nonexistent') // Returns: null
     * ```
     */
    get(key: string): Promise<string | object | null>;

    /**
     * Delete a key from storage (staged until commit)
     *
     * @param key - Storage key to delete
     *
     * @example
     * ```typescript
     * await data.delete('username')
     * await data.commit() // Deletion takes effect
     * ```
     */
    delete(key: string): Promise<void>;

    /**
     * Check if a key exists in storage
     *
     * Checks both staged and committed data.
     *
     * @param key - Storage key
     * @returns true if key exists, false otherwise
     *
     * @example
     * ```typescript
     * const exists = await data.has('username') // Returns: true or false
     * ```
     */
    has(key: string): Promise<boolean>;

    /**
     * List all keys matching a pattern
     *
     * @param pattern - Glob pattern (optional). Use * as wildcard.
     * @returns Array of matching keys
     *
     * @example
     * ```typescript
     * const allKeys = await data.keys() // All keys
     * const userKeys = await data.keys('user:*') // Keys starting with 'user:'
     * const balances = await data.keys('*:balance') // Keys ending with ':balance'
     * ```
     */
    keys(pattern?: string): Promise<string[]>;

    /**
     * Get all storage entries as an object
     *
     * Includes both staged and committed data.
     *
     * @returns Object with all key-value pairs
     *
     * @example
     * ```typescript
     * const all = await data.entries()
     * // Returns: { username: 'alice', balance: '1000', ... }
     * ```
     */
    entries(): Promise<Record<string, string | object>>;

    /**
     * Clear all contract data
     *
     * WARNING: This removes all data immediately, both staged and committed.
     * Useful for testing/development.
     *
     * @example
     * ```typescript
     * await data.clear() // Wipes all storage
     * ```
     */
    clear(): Promise<void>;

    /**
     * Commit staged changes to blockchain
     *
     * Validates all size limits and atomically persists changes.
     * If validation fails, no changes are committed.
     *
     * @throws Error if storage limits are exceeded
     *
     * @example
     * ```typescript
     * await data.set('counter', '42')
     * await data.set('timestamp', Date.now().toString())
     * await data.commit() // Both changes persisted atomically
     * ```
     */
    commit(): Promise<void>;
  };
}

declare module "tana/data" {
  export * from "tana:data";
}
