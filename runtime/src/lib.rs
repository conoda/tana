use std::cell::RefCell;
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
use wee_alloc::WeeAlloc;

#[cfg(target_arch = "wasm32")]
#[global_allocator]
static ALLOC: WeeAlloc = WeeAlloc::INIT;

use deno_core::op2;
use deno_core::{Extension, JsRuntime, ModuleCodeString, RuntimeOptions};

// Output capture for WASM
thread_local! {
    static OUTPUT: RefCell<Vec<String>> = RefCell::new(Vec::new());
    static ERRORS: RefCell<Vec<String>> = RefCell::new(Vec::new());
    static GAS_USED: RefCell<u64> = RefCell::new(0);
    static EXECUTION_SUCCESS: RefCell<bool> = RefCell::new(true);
}

#[op2(fast)]
fn op_print_stdout(#[string] msg: String) {
    OUTPUT.with(|output| {
        output.borrow_mut().push(msg);
    });
}

#[op2(fast)]
fn op_print_stderr(#[string] msg: String) {
    ERRORS.with(|errors| {
        errors.borrow_mut().push(msg);
    });
}

#[op2]
fn op_sum(#[serde] nums: Vec<f64>) -> Result<f64, deno_error::JsErrorBox> {
    Ok(nums.iter().sum())
}

#[op2(fast)]
fn op_track_gas(#[bigint] amount: u64) {
    GAS_USED.with(|gas| {
        *gas.borrow_mut() += amount;
    });
}

#[op2(fast)]
fn op_mark_failure() {
    EXECUTION_SUCCESS.with(|success| {
        *success.borrow_mut() = false;
    });
}

#[wasm_bindgen]
pub struct TanaRuntime {
    runtime: JsRuntime,
    typescript_loaded: bool,
}

#[wasm_bindgen]
impl TanaRuntime {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<TanaRuntime, JsValue> {
        #[cfg(target_arch = "wasm32")]
        console_error_panic_hook::set_once();

        // Set up extensions with our ops
        const OP_SUM: deno_core::OpDecl = op_sum();
        const OP_PRINT_STDOUT: deno_core::OpDecl = op_print_stdout();
        const OP_PRINT_STDERR: deno_core::OpDecl = op_print_stderr();
        const OP_TRACK_GAS: deno_core::OpDecl = op_track_gas();
        const OP_MARK_FAILURE: deno_core::OpDecl = op_mark_failure();

        let ext = Extension {
            name: "tana_ext",
            ops: std::borrow::Cow::Borrowed(&[
                OP_SUM,
                OP_PRINT_STDOUT,
                OP_PRINT_STDERR,
                OP_TRACK_GAS,
                OP_MARK_FAILURE
            ]),
            ..Default::default()
        };

        let runtime = JsRuntime::new(RuntimeOptions {
            extensions: vec![ext],
            module_loader: None,
            ..Default::default()
        });

        Ok(TanaRuntime {
            runtime,
            typescript_loaded: false,
        })
    }

    #[wasm_bindgen]
    pub fn load_typescript(&mut self, ts_source: &str) -> Result<(), JsValue> {
        self.runtime
            .execute_script("typescript.js", ModuleCodeString::from(ts_source.to_string()))
            .map_err(|e| JsValue::from_str(&format!("Failed to load TypeScript: {:?}", e)))?;

        self.typescript_loaded = true;
        Ok(())
    }

    #[wasm_bindgen]
    pub fn bootstrap(&mut self, tana_version: &str, deno_core_version: &str, v8_version: &str) -> Result<(), JsValue> {
        if !self.typescript_loaded {
            return Err(JsValue::from_str("TypeScript compiler not loaded. Call load_typescript() first."));
        }

        let bootstrap_globals = format!(
            r#"
            // 1. FIRST: Stash Deno.core before we delete it
            globalThis.__tanaCore = globalThis.Deno?.core;

            // 2. Delete Deno to create sandbox
            delete globalThis.Deno;

            // 3. NOW we can safely define modules that use __tanaCore
            const tanaModules = Object.create(null);

            // core module - browser-like console API
            tanaModules["tana/core"] = {{
                console: {{
                    log(...args) {{
                        if (globalThis.__tanaCore) {{
                            const msg = args.map(v => {{
                                if (typeof v === 'object') {{
                                    try {{ return JSON.stringify(v, null, 2); }}
                                    catch {{ return String(v); }}
                                }}
                                return String(v);
                            }}).join(' ');
                            globalThis.__tanaCore.ops.op_print_stdout(msg + "\n");
                        }}
                    }},
                    error(...args) {{
                        if (globalThis.__tanaCore) {{
                            const msg = args.map(v => {{
                                if (typeof v === 'object') {{
                                    try {{ return JSON.stringify(v, null, 2); }}
                                    catch {{ return String(v); }}
                                }}
                                return String(v);
                            }}).join(' ');
                            globalThis.__tanaCore.ops.op_print_stderr(msg + "\n");
                        }}
                    }},
                }},
                version: {{
                    tana: "{tana_version}",
                    deno_core: "{deno_core_version}",
                    v8: "{v8_version}",
                }},
            }};

            // Import shim
            globalThis.__tanaImport = function (spec) {{
                const m = tanaModules[spec];
                if (!m) throw new Error("unknown tana module: " + spec);
                return m;
            }};
            "#,
            tana_version = tana_version,
            deno_core_version = deno_core_version,
            v8_version = v8_version,
        );

        self.runtime
            .execute_script("tana-bootstrap.js", ModuleCodeString::from(bootstrap_globals))
            .map_err(|e| JsValue::from_str(&format!("Bootstrap failed: {:?}", e)))?;

        Ok(())
    }

    #[wasm_bindgen]
    pub fn execute(&mut self, user_code: &str) -> Result<String, JsValue> {
        // Clear previous output
        OUTPUT.with(|o| o.borrow_mut().clear());
        ERRORS.with(|e| e.borrow_mut().clear());

        let runner = format!(
            r#"
            let src = {user_src};

            // line-by-line import rewriter
            src = src
              .split("\n")
              .map((line) => {{
                const m = line.match(/^\s*import\s+{{([^}}]+)}}\s+from\s+["'](tana\/[^"']+)["'];?\s*$/);
                if (!m) return line;
                const names = m[1].trim();
                const spec = m[2].trim();
                return "const {{" + names + "}} = __tanaImport('" + spec + "');";
              }})
              .join("\n");

            const out = ts.transpileModule(src, {{
              compilerOptions: {{
                target: "ES2020",
                module: ts.ModuleKind.ESNext
              }}
            }});

            (0, eval)(out.outputText);
            "#,
            user_src = serde_json::to_string(user_code).unwrap(),
        );

        self.runtime
            .execute_script("run-user.ts", ModuleCodeString::from(runner))
            .map_err(|e| JsValue::from_str(&format!("Execution error: {:?}", e)))?;

        // Collect output
        let stdout = OUTPUT.with(|o| o.borrow().join(""));
        let stderr = ERRORS.with(|e| e.borrow().join(""));

        let result = if stderr.is_empty() {
            stdout
        } else {
            format!("STDOUT:\n{}\n\nSTDERR:\n{}", stdout, stderr)
        };

        Ok(result)
    }

    #[wasm_bindgen]
    pub fn execute_with_validity(&mut self, user_code: &str) -> Result<String, JsValue> {
        // Clear previous state
        OUTPUT.with(|o| o.borrow_mut().clear());
        ERRORS.with(|e| e.borrow_mut().clear());
        GAS_USED.with(|g| *g.borrow_mut() = 0);
        EXECUTION_SUCCESS.with(|s| *s.borrow_mut() = true);

        // Base gas for any execution
        GAS_USED.with(|g| *g.borrow_mut() = 1000);

        let runner = format!(
            r#"
            let src = {user_src};

            // Track gas for operations
            const trackGas = (amount) => {{
                if (globalThis.__tanaCore) {{
                    globalThis.__tanaCore.ops.op_track_gas(amount);
                }}
            }};

            const markFailure = () => {{
                if (globalThis.__tanaCore) {{
                    globalThis.__tanaCore.ops.op_mark_failure();
                }}
            }};

            try {{
                // line-by-line import rewriter
                src = src
                  .split("\n")
                  .map((line) => {{
                    const m = line.match(/^\s*import\s+{{([^}}]+)}}\s+from\s+["'](tana\/[^"']+)["'];?\s*$/);
                    if (!m) return line;
                    const names = m[1].trim();
                    const spec = m[2].trim();
                    return "const {{" + names + "}} = __tanaImport('" + spec + "');";
                  }})
                  .join("\n");

                trackGas(500); // Gas for transpilation

                const out = ts.transpileModule(src, {{
                  compilerOptions: {{
                    target: "ES2020",
                    module: ts.ModuleKind.ESNext
                  }}
                }});

                trackGas(1000); // Gas for eval
                (0, eval)(out.outputText);

            }} catch (error) {{
                markFailure();
                globalThis.__tanaCore.ops.op_print_stderr(
                    "Execution error: " + error.message
                );
            }}
            "#,
            user_src = serde_json::to_string(user_code).unwrap(),
        );

        self.runtime
            .execute_script("run-user.ts", ModuleCodeString::from(runner))
            .map_err(|e| {
                EXECUTION_SUCCESS.with(|s| *s.borrow_mut() = false);
                JsValue::from_str(&format!("Execution error: {:?}", e))
            })?;

        // Collect results
        let stdout = OUTPUT.with(|o| o.borrow().join(""));
        let stderr = ERRORS.with(|e| e.borrow().join(""));
        let gas_used = GAS_USED.with(|g| *g.borrow());
        let success = EXECUTION_SUCCESS.with(|s| *s.borrow());

        // Return JSON result
        let result = serde_json::json!({
            "success": success,
            "gas_used": gas_used,
            "output": stdout,
            "error": if stderr.is_empty() { None } else { Some(stderr) }
        });

        Ok(result.to_string())
    }
}
