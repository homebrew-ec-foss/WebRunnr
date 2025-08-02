// Core package - Main API facade
import { JavaScriptExecutor } from '@webrunnr/js-executor';

export interface ExecutionRequest {
  code: string;
  language: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
}

export class WebRunnrCore {
  private inputRequestCallback?: (message: string) => void;
  private currentExecutor?: JavaScriptExecutor;

  constructor() {
    // Initialize core
  }

  /**
   * Set up input request handler for stdin operations like prompt()
   * @param callback Function to call when input is requested
   */
  onInputRequest(callback: (message: string) => void): void {
    this.inputRequestCallback = callback;
  }

  /**
   * Provide input response for pending input request
   * @param input The input value to provide
   */
  provideInput(input: string): void {
    this.currentExecutor?.provideInput(input);
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const { code, language } = request;
    
    // Normalize language string for comparison
    const normalizedLanguage = language.toLowerCase().trim();
    
    // Handle JavaScript execution
    if (normalizedLanguage === 'javascript' || normalizedLanguage === 'js') {
      const jsExecutor = new JavaScriptExecutor();
      this.currentExecutor = jsExecutor;
      
      // Forward input requests from js-executor to parent
      jsExecutor.onInputRequest((message) => {
        this.inputRequestCallback?.(message);
      });
      
      try {
        await jsExecutor.initialize();
        return await jsExecutor.execute(code);
      } finally {
        this.currentExecutor = undefined;
      }
    }
    
    // Handle Python
    if (normalizedLanguage === 'python' || normalizedLanguage === 'py') {
      return {
        stdout: 'Not implemented yet',
        stderr: 'Execution not implemented',
      };
    }
    
    // Handle Go
    if (normalizedLanguage === 'go') {
      return {
        stdout: 'Not implemented yet',
        stderr: 'Execution not implemented',
      };
    }
    
    // Handle Java
    if (normalizedLanguage === 'java') {
      return {
        stdout: 'Not implemented yet',
        stderr: 'Execution not implemented',
      };
    }
    
    // Handle C
    if (normalizedLanguage === 'c') {
      return {
        stdout: 'Not implemented yet',
        stderr: 'Execution not implemented',
      };
    }
    
    // Handle C++
    if (normalizedLanguage === 'cpp' || normalizedLanguage === 'c++') {
      return {
        stdout: 'Not implemented yet',
        stderr: 'Execution not implemented',
      };
    }
    
    // Handle unknown/unsupported languages
    return {
      stdout: 'not-supported-yet',
      stderr: ''
    };
  }
}

export default WebRunnrCore;