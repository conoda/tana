// Type definitions for the tana:core virtual module
declare module "tana:core" {
  export const console: {
    log(...args: unknown[]): void;
    error(...args: unknown[]): void;
  };
  export const version: {
    tana: string;
    deno_core: string;
    v8: string;
  };
}
