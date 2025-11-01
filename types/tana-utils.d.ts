declare module "tana:utils" {
  /**
   * Whitelisted fetch API for Tana
   *
   * Follows the standard Fetch API spec, but only allows requests to:
   * - pokeapi.co (testing)
   * - *.tana.dev (Tana infrastructure)
   * - localhost / 127.0.0.1 (local development)
   *
   * @param url - The URL to fetch from
   * @param options - Optional fetch options (method, headers, body, etc.)
   * @returns Promise that resolves to a Response-like object
   * @throws Error if domain is not whitelisted
   *
   * @example
   * ```typescript
   * import { fetch } from 'tana:utils'
   *
   * const response = await fetch('https://pokeapi.co/api/v2/pokemon/pikachu')
   * const data = await response.json()
   * console.log(data.name)
   * ```
   */
  export function fetch(
    url: string | URL,
    options?: RequestInit
  ): Promise<Response>;
}
