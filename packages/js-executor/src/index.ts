// JavaScript executor - Handles JavaScript code execution with iframe isolation
export interface ExecutionResult {
  stdout: string;
  stderr: string;
}

export class JavaScriptExecutor {
  private iframe: HTMLIFrameElement | null = null;
  private isReady = false;
  private pendingExecution: Promise<ExecutionResult> | null = null;
  private currentResolve: ((result: ExecutionResult) => void) | null = null;
  private accumulatedStdout = '';
  private accumulatedStderr = '';
  private coreInputCallback?: (message: string) => void;

  constructor() {
    this.setupMessageListener();
  }

  async initialize(): Promise<void> {
    if (this.iframe) return;
    
    await this.createIframe();
  }

  /**
   * Provide input response for pending input request
   * @param input The input value to provide
   */
  provideInput(input: string): void {
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage({
        type: 'INPUT_RESPONSE',
        value: input
      }, '*');
    }
  }

  async execute(code: string, inputCallback: (message: string) => void): Promise<ExecutionResult> {
    if (!this.iframe || !this.isReady) {
      await this.initialize();
    }

    // Store the callback for input requests
    this.coreInputCallback = inputCallback;

    // If there's already a pending execution, wait for it to complete
    if (this.pendingExecution) {
      await this.pendingExecution;
    }

    // Reset accumulated outputs for new execution
    this.accumulatedStdout = '';
    this.accumulatedStderr = '';

    // Transform code to handle interactive input
    const transformedCode = this.transformCode(code);

    // Create new execution promise
    this.pendingExecution = new Promise<ExecutionResult>((resolve) => {
      this.currentResolve = resolve;
      
      // Send execution request to iframe
      this.iframe!.contentWindow!.postMessage({
        type: 'EXECUTE_CODE',
        code: transformedCode
      }, '*');
    });

    const result = await this.pendingExecution;
    this.pendingExecution = null;
    this.currentResolve = null;
    this.coreInputCallback = undefined;
    
    return result;
  }

  private transformCode(code: string): string {
    // Transform prompt() calls to async requestInput() calls
    return code.replace(
      /prompt\s*\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1\s*\)/g,
      'await requestInput($1$2$1)'
    ).replace(
      /prompt\s*\(\s*([^)]+)\s*\)/g,
      'await requestInput($1)'
    );
  }

  private async createIframe(): Promise<void> {
    this.iframe = document.createElement('iframe');
    this.iframe.sandbox = 'allow-scripts allow-forms';
    this.iframe.style.display = 'none';
    this.iframe.srcdoc = this.getIframeContent();
    document.body.appendChild(this.iframe);
    
    // Wait for iframe to be ready
    return new Promise((resolve) => {
      this.iframe!.onload = () => {
        this.isReady = true;
        resolve();
      };
    });
  }

  private getIframeContent(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'unsafe-inline' 'unsafe-eval'; connect-src 'none';">
      </head>
      <body>
        <script>${this.getExecutorScript()}</script>
      </body>
      </html>
    `;
  }

  private getExecutorScript(): string {
    return `
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;

      console.log = (...args) => {
        window.parent.postMessage({ 
          type: 'stdout', 
          data: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
        }, '*');
        originalLog.apply(console, args);
      };

      console.error = (...args) => {
        window.parent.postMessage({ 
          type: 'stderr', 
          data: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
        }, '*');
        originalError.apply(console, args);
      };

      console.warn = (...args) => {
        window.parent.postMessage({ 
          type: 'stderr', 
          data: '[WARN] ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
        }, '*');
        originalWarn.apply(console, args);
      };

      // Input handling for interactive operations
      let currentInputResolve = null;

      async function requestInput(message) {
        return new Promise((resolve) => {
          currentInputResolve = resolve;
          
          // Send input request to parent (JS-Executor)
          window.parent.postMessage({
            type: 'INPUT_REQUEST',
            message: String(message || '')
          }, '*');
        });
      }

      // Listen for input responses and execution commands
      window.addEventListener('message', (event) => {
        if (event.data.type === 'INPUT_RESPONSE' && currentInputResolve) {
          const resolve = currentInputResolve;
          currentInputResolve = null;
          resolve(event.data.value);
        } else if (event.data.type === 'EXECUTE_CODE') {
          executeCode(event.data.code);
        }
      });

      async function executeCode(code) {
        try {
          // Wrap user code in async function to handle await
          const asyncCode = \`(async function() { \${code} })()\`;
          await eval(asyncCode);
          
          // Send completion signal after main execution
          window.parent.postMessage({ type: 'EXECUTION_COMPLETE' }, '*');
        } catch (error) {
          // Handle error
          window.parent.postMessage({ 
            type: 'stderr', 
            data: error.message + (error.stack ? '\\n' + error.stack : '')
          }, '*');
          
          // Still send completion signal on error
          window.parent.postMessage({ type: 'EXECUTION_COMPLETE' }, '*');
        }
      }
    `;
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      if (event.source === this.iframe?.contentWindow) {
        if (event.data.type === 'stdout') {
          this.accumulatedStdout += event.data.data + '\n';
        } else if (event.data.type === 'stderr') {
          this.accumulatedStderr += event.data.data + '\n';
        } else if (event.data.type === 'INPUT_REQUEST') {
          // Forward input request to core
          if (this.coreInputCallback) {
            this.coreInputCallback(event.data.message);
          }
        } else if (event.data.type === 'EXECUTION_COMPLETE' && this.currentResolve) {
          // Return accumulated outputs when execution completes
          this.currentResolve({
            stdout: this.accumulatedStdout.trim(),
            stderr: this.accumulatedStderr.trim()
          });
        }
      }
    });
  }

  destroy(): void {
    if (this.iframe) {
      document.body.removeChild(this.iframe);
      this.iframe = null;
      this.isReady = false;
    }
    
    if (this.currentResolve) {
      this.currentResolve({ 
        stdout: this.accumulatedStdout.trim(), 
        stderr: this.accumulatedStderr.trim() 
      });
      this.currentResolve = null;
    }
    
    this.pendingExecution = null;
    this.coreInputCallback = undefined;
  }
}

export default JavaScriptExecutor;