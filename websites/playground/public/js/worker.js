// Tana Runtime Worker - Executes user code in isolated context
// Based on linkhash architecture (TypeScript-in-browser approach)

importScripts('/js/typescript.js');

const output = [];

// Capture console output
const originalLog = console.log;
const originalError = console.error;

// Create tana/core module registry
const tanaModules = {
  'tana/core': {
    console: {
      log(...args) {
        const msg = args.map(v => {
          if (typeof v === 'object') {
            try { return JSON.stringify(v, null, 2); }
            catch { return String(v); }
          }
          return String(v);
        }).join(' ');
        output.push({ type: 'log', message: msg });
      },
      error(...args) {
        const msg = args.map(v => {
          if (typeof v === 'object') {
            try { return JSON.stringify(v, null, 2); }
            catch { return String(v); }
          }
          return String(v);
        }).join(' ');
        output.push({ type: 'error', message: msg });
      }
    },
    version: {
      tana: '0.1.0',
      deno_core: '0.338.0',
      v8: '134.5.0'
    }
  }
};

// Import shim for tana/* modules
globalThis.__tanaImport = function(spec) {
  const mod = tanaModules[spec];
  if (!mod) throw new Error(`Unknown module: ${spec}`);
  return mod;
};

// Signal ready
postMessage({ ready: true });

onmessage = async (e) => {
  output.length = 0;

  try {
    let code = e.data.code;

    // Rewrite import statements to use our shim
    code = code
      .split('\n')
      .map(line => {
        const match = line.match(/^\s*import\s+\{([^}]+)\}\s+from\s+["'](tana\/[^"']+)["'];?\s*$/);
        if (!match) return line;
        const names = match[1].trim();
        const spec = match[2].trim();
        return `const {${names}} = __tanaImport('${spec}');`;
      })
      .join('\n');

    // Transpile TypeScript to JavaScript
    const result = ts.transpileModule(code, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext
      }
    });

    // Execute the transpiled code
    (0, eval)(result.outputText);

    // Format output
    const outputText = output
      .map(o => {
        const prefix = o.type === 'error' ? '[ERROR] ' : '';
        return prefix + o.message;
      })
      .join('\n');

    postMessage({
      success: true,
      output: outputText || '(no output)'
    });

  } catch (error) {
    postMessage({
      success: false,
      error: error.toString(),
      stack: error.stack
    });
  }
};
