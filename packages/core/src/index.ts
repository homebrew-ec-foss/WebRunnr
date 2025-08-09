// Core package - Main API facade with unified input handling
import { JavaScriptExecutor } from '@webrunnr/js-executor';
import { TypeScriptExecutor } from '@webrunnr/ts-executor';

export interface ExecutionRequest {
  code: string;
  language: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
}

export interface LanguageExecutor {
  initialize(): Promise<void>;
  execute(
    code: string,
    inputCallback: (message: string) => void
  ): Promise<ExecutionResult>;
  provideInput(input: string): void;
  destroy?(): void;
}

export class WebRunnrCore {
  private inputRequestCallback?: (message: string) => void;
  private currentExecutor?: LanguageExecutor;
  private pendingInputResolve?: (input: string) => void;
  
  // Python worker properties
  private pythonWorker?: Worker;
  private pythonReady = false;
  private pythonInitPromise?: Promise<void>;
  private pythonStdout = '';
  private pythonStderr = '';
  private pythonPendingResolve?: (result: ExecutionResult) => void;

  constructor() {}

  onInputRequest(callback: (message: string) => void): void {
    this.inputRequestCallback = callback;
  }

  provideInput(input: string): void {
    if (this.currentExecutor) {
      this.currentExecutor.provideInput(input);
    }
    if (this.pendingInputResolve) {
      this.pendingInputResolve(input);
      this.pendingInputResolve = undefined;
    }
  }

  private handleInputRequest(message: string): void {
    if (this.inputRequestCallback) {
      this.inputRequestCallback(message);
    }
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const { code, language } = request;
    console.log('Execute called in language: ', { code, language });

    const normalizedLanguage = language.toLowerCase().trim();

    if (normalizedLanguage === 'javascript' || normalizedLanguage === 'js') {
      console.log('executecore has dispatched to JavaScriptExecutor');
      const jsExecutor = new JavaScriptExecutor();
      this.currentExecutor = jsExecutor;

      try {
        await jsExecutor.initialize();
        return await jsExecutor.execute(code, (message: string) => {
          this.handleInputRequest(message);
        });
      } finally {
        this.currentExecutor = undefined;
      }
    }

    if (normalizedLanguage === 'typescript' || normalizedLanguage === 'ts') {
      console.log('executecore has dispatched to TypeScriptExecutor');
      const tsExecutor = new TypeScriptExecutor();
      const jsExecutor = new JavaScriptExecutor();
      this.currentExecutor = jsExecutor;

      try {
        await tsExecutor.initialize();
        await jsExecutor.initialize();

        tsExecutor.setJavaScriptExecutor(jsExecutor);

        return await tsExecutor.execute({ code }, message => {
          this.handleInputRequest(message);
        });
      } finally {
        this.currentExecutor = undefined;
      }
    }

    if (normalizedLanguage === 'python' || normalizedLanguage === 'py') {
      console.log('executecore has dispatched to PythonExecutor');

      try {
        await this.ensurePythonWorker();
        
        if (!this.pythonWorker) {
          return {
            stdout: '',
            stderr: 'Python worker failed to initialize',
          };
        }

        // Reset output buffers
        this.pythonStdout = '';
        this.pythonStderr = '';

        return new Promise<ExecutionResult>((resolve) => {
          this.pythonPendingResolve = resolve;
          this.pythonWorker!.postMessage({ code });
        });
      } catch (error) {
        return {
          stdout: '',
          stderr: error instanceof Error ? error.message : 'Python execution failed',
        };
      }
    }

    if (normalizedLanguage === 'go') {
      return {
        stdout: '',
        stderr: 'Go execution not implemented yet',
      };
    }

    if (normalizedLanguage === 'java') {
      return {
        stdout: '',
        stderr: 'Java execution not implemented yet',
      };
    }

    if (normalizedLanguage === 'c') {
      return {
        stdout: '',
        stderr: 'C execution not implemented yet',
      };
    }

    if (normalizedLanguage === 'cpp' || normalizedLanguage === 'c++') {
      return {
        stdout: '',
        stderr: 'C++ execution not implemented yet',
      };
    }

    if (normalizedLanguage === 'rust' || normalizedLanguage === 'rs') {
      return {
        stdout: '',
        stderr: 'Rust execution not implemented yet',
      };
    }

    return {
      stdout: '',
      stderr: `Language '${language}' is not supported`,
    };
  }

    // Initialize the Python web worker once and keep it alive across runs
  private async ensurePythonWorker(): Promise<void> {
    if (this.pythonReady && this.pythonWorker) return;

    if (this.pythonInitPromise) {
      return this.pythonInitPromise;
    }

    this.pythonInitPromise = new Promise<void>((resolve, reject) => {
      try {
        // Create worker from inline code using blob URL
        const workerCode = `
// Python Worker for WebRunnr - Inline Version
const PYODIDE_VERSION = "0.28.0";

class PythonExecutor {
    constructor() {
        this.pyodide = null;
        this.inputResolve = null;
        this.initialize();
    }

    async initialize() {
        try {
            console.log('Starting Pyodide initialization...');
            
            const pyodideModule = await import(\`https://cdn.jsdelivr.net/pyodide/v\${PYODIDE_VERSION}/full/pyodide.mjs\`);
            
            this.pyodide = await pyodideModule.loadPyodide({
                indexURL: \`https://cdn.jsdelivr.net/pyodide/v\${PYODIDE_VERSION}/full/\`
            });

            console.log('Pyodide loaded successfully');
            
            this.pyodide.setStdout({ batched: (s) => {
                // Ensure each output ends with a newline for proper formatting
                const output = s.endsWith('\\n') ? s : s + '\\n';
                self.postMessage({ type: 'stdout', data: output });
            }});
            this.pyodide.setStderr({ batched: (s) => {
                // Ensure each error output ends with a newline for proper formatting
                const output = s.endsWith('\\n') ? s : s + '\\n';
                self.postMessage({ type: 'stderr', data: output });
            }});
            
            this.pyodide.globals.set("browser_input", (prompt) => {
                return new Promise((resolve) => {
                    this.inputResolve = resolve;
                    self.postMessage({ type: 'input_request', prompt: prompt || "Enter value:" });
                });
            });
            
            console.log('Pyodide setup complete');
            self.postMessage({ type: 'ready' });
        } catch (error) {
            console.error('Pyodide initialization error:', error);
            self.postMessage({ type: 'error', data: "Failed to load Pyodide: " + error.message });
        }

        self.onmessage = (event) => this.handleMessage(event);
    }

    async handleMessage(event) {
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

    transformInputCalls(code) {
        return code.replace(/\\binput\\s*\\(/g, 'await async_input(');
    }

    async executeCode(code) {
        if (!this.pyodide) return;
        
        try {
            console.log('Executing Python code...');
            await this.pyodide.loadPackagesFromImports(code);
            
            const inputSetup = \`
import builtins

async def async_input(prompt=""):
    return await browser_input(str(prompt))

_original_input = builtins.input
\`;
            
            await this.pyodide.runPythonAsync(inputSetup);
            
            const hasInputCalls = /\\binput\\s*\\(/.test(code);
            
            if (hasInputCalls) {
                console.log('Code contains input() calls, transforming to async...');
                
                const transformedCode = this.transformInputCalls(code);
                
                const asyncWrapper = \`
import asyncio

async def __main__():
\${transformedCode.split('\\n').map(line => '    ' + line).join('\\n')}

await __main__()
\`;
                console.log('Running transformed async code...');
                await this.pyodide.runPythonAsync(asyncWrapper);
            } else {
                console.log('No input() calls detected, running synchronously...');
                await this.pyodide.runPython(code);
            }
            
            console.log('Python execution completed');
            self.postMessage({ type: 'done' });
        } catch (error) {
            console.error('Python execution error:', error);
            self.postMessage({ type: 'error', data: error.message });
        }
    }
}

console.log('Creating PythonExecutor instance...');
new PythonExecutor();
`;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl, { type: 'module' });

        this.pythonWorker = worker;
        this.pythonReady = false;

        // Clean up blob URL after worker starts
        setTimeout(() => URL.revokeObjectURL(workerUrl), 1000);

        worker.onmessage = (event: MessageEvent) => {
          const { type, data, prompt } = (event.data || {}) as { type: string; data?: string; prompt?: string };
          switch (type) {
            case 'ready': {
              this.pythonReady = true;
              resolve();
              break;
            }
            case 'stdout': {
              this.pythonStdout += data ?? '';
              break;
            }
            case 'stderr': {
              this.pythonStderr += data ?? '';
              break;
            }
            case 'done': {
              if (this.pythonPendingResolve) {
                const r = this.pythonPendingResolve;
                this.pythonPendingResolve = undefined;
                r({ stdout: this.pythonStdout.trim(), stderr: this.pythonStderr.trim() });
              }
              break;
            }
            case 'error': {
              if (this.pythonPendingResolve) {
                const r = this.pythonPendingResolve;
                this.pythonPendingResolve = undefined;
                const combinedErr = (this.pythonStderr + (data ?? '')).trim();
                r({ stdout: this.pythonStdout.trim(), stderr: combinedErr });
              }
              break;
            }
            case 'input_request': {
              // Bridge to core input flow: prompt UI, then send input_response when provided
              // Store resolver so provideInput() can fulfill and post back to worker
              this.pendingInputResolve = (input: string) => {
                this.pythonWorker?.postMessage({ type: 'input_response', value: input });
              };
              this.handleInputRequest(prompt || '');
              break;
            }
          }
        };

        worker.onerror = (error: ErrorEvent) => {
          const message = error.message || 'Unknown Python worker error';
          if (!this.pythonReady) {
            this.pythonInitPromise = undefined;
            reject(new Error(`Python worker failed to initialize: ${message}`));
          } else if (this.pythonPendingResolve) {
            const r = this.pythonPendingResolve;
            this.pythonPendingResolve = undefined;
            r({ stdout: this.pythonStdout.trim(), stderr: `Python worker error: ${message}` });
          }
          // Reset state to allow re-init on next call
          this.pythonReady = false;
          this.pythonWorker?.terminate();
          this.pythonWorker = undefined;
        };
      } catch (e) {
        this.pythonInitPromise = undefined;
        reject(e);
      }
    });

    try {
      await this.pythonInitPromise;
    } finally {
      // Clear the init promise to allow re-init attempts in future if needed
      this.pythonInitPromise = undefined;
    }
  }

  getSupportedLanguages(): string[] {
    return [
      'javascript',
      'python',
      'go',
      'java',
      'c',
      'cpp',
      'rust',
      'typescript',
    ];
  }

  isLanguageSupported(language: string): boolean {
    const normalized = language.toLowerCase().trim();
    return this.getSupportedLanguages().some(
      lang =>
        normalized === lang ||
        (lang === 'javascript' && normalized === 'js') ||
        (lang === 'python' && normalized === 'py') ||
        (lang === 'cpp' && normalized === 'c++') ||
        (lang === 'rust' && normalized === 'rs') ||
        (lang === 'typescript' && normalized === 'ts')
    );
  }

  /**
   * Clean up resources for Python worker
   */
  destroy(): void {
    if (this.pythonWorker) {
      this.pythonWorker.terminate();
      this.pythonWorker = undefined;
      this.pythonReady = false;
      this.pythonInitPromise = undefined;
    }
    this.currentExecutor?.destroy?.();
  }
}

export default WebRunnrCore;
