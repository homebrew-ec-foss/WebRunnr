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
  execute(code: string, inputCallback: (message: string) => void): Promise<ExecutionResult>;
  provideInput(input: string): void;
  destroy?(): void;
}

export class WebRunnrCore {
  private inputRequestCallback?: (message: string) => void;
  private currentExecutor?: LanguageExecutor;
  private pendingInputResolve?: (input: string) => void;

  constructor() {
    // Initialize core
  }

  /**
   * Set up input request handler for interactive operations
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
    if (this.currentExecutor) {
      this.currentExecutor.provideInput(input);
    }
    if (this.pendingInputResolve) {
      this.pendingInputResolve(input);
      this.pendingInputResolve = undefined;
    }
  }

  /**
   * Handle input requests from language executors
   * @param message The input prompt message
   */
  private handleInputRequest(message: string): void {
    if (this.inputRequestCallback) {
      this.inputRequestCallback(message);
    }
  }

  /**
   * Execute code in the specified language
   * @param request Execution request with code and language
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const { code, language } = request;
    
    // Normalize language string for comparison
    const normalizedLanguage = language.toLowerCase().trim();
    
    // Handle JavaScript execution
    if (normalizedLanguage === 'javascript' || normalizedLanguage === 'js') {
      const jsExecutor = new JavaScriptExecutor();
      this.currentExecutor = jsExecutor;
      
      try {
        await jsExecutor.initialize();
        return await jsExecutor.execute(code, (message) => {
          this.handleInputRequest(message);
        });
      } finally {
        this.currentExecutor = undefined;
      }
    }

    // Handle TypeScript execution
    if (normalizedLanguage === 'typescript' || normalizedLanguage === 'ts') {
      console.log('executecore has dispatched to TypeScriptExecutor');
      const tsExecutor = new TypeScriptExecutor();
      const jsExecutor = new JavaScriptExecutor();

      await tsExecutor.initialize();
      await jsExecutor.initialize();

      // Connect JS executor for full execution
      tsExecutor.setJavaScriptExecutor(jsExecutor);

      return await tsExecutor.execute({ code });
    }

    // Handle Python
    if (normalizedLanguage === 'python' || normalizedLanguage === 'py') {
      return {
        stdout: '',
        stderr: 'Python execution not implemented yet',
      };
    }
    
    // Handle Go
    if (normalizedLanguage === 'go') {
      return {
        stdout: '',
        stderr: 'Go execution not implemented yet',
      };
    }
    
    // Handle Java
    if (normalizedLanguage === 'java') {
      return {
        stdout: '',
        stderr: 'Java execution not implemented yet',
      };
    }
    
    // Handle C
    if (normalizedLanguage === 'c') {
      return {
        stdout: '',
        stderr: 'C execution not implemented yet',
      };
    }
    
    // Handle C++
    if (normalizedLanguage === 'cpp' || normalizedLanguage === 'c++') {
      return {
        stdout: '',
        stderr: 'C++ execution not implemented yet',
      };
    }
    
    // Handle Rust
    if (normalizedLanguage === 'rust' || normalizedLanguage === 'rs') {
      return {
        stdout: '',
        stderr: 'Rust execution not implemented yet',
      };
    }
    
    // Handle unknown/unsupported languages
    return {
      stdout: '',
      stderr: `Language '${language}' is not supported`
    };
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): string[] {
    return [
      'javascript',
      'python',
      'go', 
      'java',
      'c',
      'cpp',
      'rust'
    ];
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: string): boolean {
    const normalized = language.toLowerCase().trim();
    return this.getSupportedLanguages().some(lang => 
      normalized === lang || 
      (lang === 'javascript' && normalized === 'js') ||
      (lang === 'python' && normalized === 'py') ||
      (lang === 'cpp' && normalized === 'c++') ||
      (lang === 'rust' && normalized === 'rs')
    );
  }
}

export default WebRunnrCore;