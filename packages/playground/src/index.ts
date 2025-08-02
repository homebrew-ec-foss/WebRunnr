// Playground - Demo UI for WebRunnr with stdin support
import { WebRunnrCore } from '@webrunnr/core';

export interface PlaygroundOptions {
  onOutput?: (output: string, isError?: boolean) => void;
  onInputRequest?: (message: string) => Promise<string>;
}

export class Playground {
  private core: WebRunnrCore;
  private options: PlaygroundOptions;
  private isExecuting = false;
  private inputRequestHandler?: (message: string) => Promise<string>;

  constructor(options: PlaygroundOptions = {}) {
    this.core = new WebRunnrCore();
    this.options = options;
    this.setupInputHandling();
  }

  /**
   * Set up stdin handling for prompt() support
   */
  private setupInputHandling(): void {
    this.core.onInputRequest(async (message) => {
      try {
        // Use provided input handler or show browser prompt as fallback
        const input = this.inputRequestHandler 
          ? await this.inputRequestHandler(message)
          : this.options.onInputRequest 
            ? await this.options.onInputRequest(message)
            : await this.showBrowserPrompt(message);
        
        this.core.provideInput(input);
      } catch (error) {
        // If input fails, provide empty string to continue execution
        console.error('Input request failed:', error);
        this.core.provideInput('');
      }
    });
  }

  /**
   * Fallback browser prompt for input requests
   */
  private async showBrowserPrompt(message: string): Promise<string> {
    return new Promise((resolve) => {
      // Use setTimeout to make it async and avoid blocking
      setTimeout(() => {
        const input = window.prompt(message);
        resolve(input || '');
      }, 0);
    });
  }

  /**
   * Set custom input handler for stdin operations
   * @param handler Function that handles input requests and returns user input
   */
  setInputHandler(handler: (message: string) => Promise<string>): void {
    this.inputRequestHandler = handler;
  }

  /**
   * Set custom input handler (synchronous version)
   * @param handler Function that handles input requests and returns user input
   */
  setInputHandlerSync(handler: (message: string) => string): void {
    this.inputRequestHandler = async (message) => handler(message);
  }

  initialize(): void {
    // Basic initialization for stdin support is already done in constructor
    console.log('Playground initialized with stdin support');
  }

  /**
   * Execute code with full stdin support
   * @param code The code to execute
   * @param language The programming language
   */
  async runCode(code: string, language: string): Promise<void> {
    if (this.isExecuting) {
      throw new Error('Code is already executing. Please wait for completion.');
    }

    this.isExecuting = true;

    try {
      const result = await this.core.execute({ code, language });
      
      // Output stdout
      if (result.stdout) {
        this.options.onOutput?.(result.stdout, false);
      }
      
      // Output stderr
      if (result.stderr) {
        this.options.onOutput?.(result.stderr, true);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.options.onOutput?.(errorMessage, true);
      throw error;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Execute code and return the result
   * @param code The code to execute
   * @param language The programming language
   * @returns Promise with execution result
   */
  async execute(code: string, language: string): Promise<{stdout: string, stderr: string}> {
    if (this.isExecuting) {
      throw new Error('Code is already executing. Please wait for completion.');
    }

    this.isExecuting = true;

    try {
      return await this.core.execute({ code, language });
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Check if code is currently executing
   */
  isRunning(): boolean {
    return this.isExecuting;
  }
}

export default Playground;