// Global type definitions for tana runtime
declare global {
  const tana: {
    print: (value: unknown) => void;
    version: string;
    sayHello?: (name: string) => void;
  };
  var __tanaCore: any;
}

export {};