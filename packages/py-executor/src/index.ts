// py-executor/src/index.ts

declare const self: DedicatedWorkerGlobalScope;

// Import Pyodide dynamically to avoid module resolution issues
const PYODIDE_VERSION = "0.28.0";

export class PythonExecutor {
    private pyodide: any | null = null;
    private inputResolve: ((value: string) => void) | null = null;

    constructor() {
        this.initialize();
    }

    async initialize(): Promise<void> {
        try {
            console.log('Starting Pyodide initialization...');
            
            // Dynamically import Pyodide
            const pyodideModule = await import(`https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.mjs`);
            
            this.pyodide = await pyodideModule.loadPyodide({
                indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
            });

            console.log('Pyodide loaded successfully');
            
            // Setup output handlers
            this.pyodide.setStdout({ batched: (s: string) => self.postMessage({ type: 'stdout', data: s }) });
            this.pyodide.setStderr({ batched: (s: string) => self.postMessage({ type: 'stderr', data: s }) });
            
            // Set up async input function for browser communication
            this.pyodide.globals.set("browser_input", (prompt: string) => {
                return new Promise((resolve) => {
                    this.inputResolve = resolve;
                    self.postMessage({ type: 'input_request', prompt: prompt || "Enter value:" });
                });
            });
            
            console.log('Pyodide setup complete');
            self.postMessage({ type: 'ready' });
        } catch (error: any) {
            console.error('Pyodide initialization error:', error);
            self.postMessage({ type: 'error', data: "Failed to load Pyodide: " + error.message });
        }

        // Setup message handler
        self.onmessage = (event: MessageEvent) => this.handleMessage(event);
    }

    private async handleMessage(event: MessageEvent): Promise<void> {
        const { type, value, code } = event.data;
        console.log('Worker received message:', { type, value, code: code?.substring(0, 50) + '...' });

        if (type === 'input_response' && this.inputResolve) {
            this.inputResolve(value || "");
            this.inputResolve = null;
            return;
        }

        if (this.pyodide && code) {
            this.executeCode(code);
        }
    }

    private transformInputCalls(code: string): string {
        // Transform input() calls to await async_input() calls
        // This regex handles various input() patterns:
        // - input()
        // - input("prompt")
        // - input('prompt')
        // - variable = input(...)
        return code.replace(/\binput\s*\(/g, 'await async_input(');
    }

    private async executeCode(code: string): Promise<void> {
        if (!this.pyodide) return;
        
        try {
            console.log('Executing Python code...');
            await this.pyodide.loadPackagesFromImports(code);
            
            // Setup the async input function in Python
            const inputSetup = `
import builtins

# Define async input function that communicates with browser
async def async_input(prompt=""):
    """Async input function that communicates with the browser main thread"""
    return await browser_input(str(prompt))

# Keep original input for reference (in case needed)
_original_input = builtins.input
`;
            
            await this.pyodide.runPythonAsync(inputSetup);
            
            // Check if code contains input() calls and transform them
            const hasInputCalls = /\binput\s*\(/.test(code);
            
            if (hasInputCalls) {
                console.log('Code contains input() calls, transforming to async...');
                
                // Transform input() calls to await async_input()
                const transformedCode = this.transformInputCalls(code);
                
                // Wrap in async function to handle await calls
                const asyncWrapper = `
import asyncio

async def __main__():
${transformedCode.split('\n').map(line => '    ' + line).join('\n')}

# Run the async main function
await __main__()
`;
                console.log('Running transformed async code...');
                await this.pyodide.runPythonAsync(asyncWrapper);
            } else {
                // No input calls, run synchronously
                console.log('No input() calls detected, running synchronously...');
                await this.pyodide.runPython(code);
            }
            
            console.log('Python execution completed');
            self.postMessage({ type: 'done' });
        } catch (error: any) {
            console.error('Python execution error:', error);
            self.postMessage({ type: 'error', data: error.message });
        }
    }
}

// Instantiate the executor to start the worker
console.log('Creating PythonExecutor instance...');
new PythonExecutor();