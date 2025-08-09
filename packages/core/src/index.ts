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
  }

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
    console.log('Execute called in language: ',{code, language});
    
    const normalizedLanguage = language.toLowerCase().trim();
    
    if (normalizedLanguage === 'javascript' || normalizedLanguage === 'js') {
      console.log('executecore has dispatched to JavaScriptExecutor');
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

    if (normalizedLanguage === 'typescript' || normalizedLanguage === 'ts') {
      console.log('executecore has dispatched to TypeScriptExecutor');
      const tsExecutor = new TypeScriptExecutor();
      const jsExecutor = new JavaScriptExecutor();

      await tsExecutor.initialize();
      await jsExecutor.initialize();

      tsExecutor.setJavaScriptExecutor(jsExecutor);

      return await tsExecutor.execute({ code });
    }

    if (normalizedLanguage === 'python' || normalizedLanguage === 'py') {
      return {
        stdout: '',
        stderr: 'Python execution not implemented yet',
      };
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
      stderr: `Language '${language}' is not supported`
    };
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
      'typescript'
    ];
  }

  isLanguageSupported(language: string): boolean {
    const normalized = language.toLowerCase().trim();
    return this.getSupportedLanguages().some(lang => 
      normalized === lang || 
      (lang === 'javascript' && normalized === 'js') ||
      (lang === 'python' && normalized === 'py') ||
      (lang === 'cpp' && normalized === 'c++') ||
      (lang === 'rust' && normalized === 'rs') ||
      (lang === 'typescript' && normalized === 'ts')
    );
  }
}

export default WebRunnrCore;