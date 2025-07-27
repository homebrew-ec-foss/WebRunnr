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

  constructor() {
    this.setupMessageListener();
  }

  async initialize(): Promise<void> {
    if (this.iframe) return;
    
    this.iframe = document.createElement('iframe');
    this.iframe.sandbox = 'allow-scripts';
    this.iframe.style.display = 'none';
    
    // Load the iframe.html file from the same directory
    const baseUrl = new URL(import.meta.url).pathname.replace('/index.js', '');
    this.iframe.src = baseUrl + '/iframe.html';
    
    document.body.appendChild(this.iframe);
    
    // Wait for iframe to be ready
    return new Promise((resolve) => {
      this.iframe!.onload = () => {
        this.isReady = true;
        resolve();
      };
    });
  }

  async execute(code: string): Promise<ExecutionResult> {
    if (!this.iframe || !this.isReady) {
      await this.initialize();
    }

    // If there's already a pending execution, wait for it to complete
    if (this.pendingExecution) {
      await this.pendingExecution;
    }

    // Create new execution promise
    this.pendingExecution = new Promise<ExecutionResult>((resolve) => {
      this.currentResolve = resolve;
      
      // Send execution request to iframe
      this.iframe!.contentWindow!.postMessage({
        type: 'EXECUTE_CODE',
        code: code
      }, '*');
    });

    const result = await this.pendingExecution;
    this.pendingExecution = null;
    this.currentResolve = null;
    
    return result;
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      if (event.source === this.iframe?.contentWindow) {
        if (event.data.type === 'EXECUTION_RESULT' && this.currentResolve) {
          this.currentResolve({
            stdout: event.data.stdout || '',
            stderr: event.data.stderr || ''
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
      this.currentResolve({ stdout: '', stderr: 'Executor destroyed' });
      this.currentResolve = null;
    }
    
    this.pendingExecution = null;
  }
}

export default JavaScriptExecutor;