// Core package - Main API facade
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

export class WebRunnrCore {
  constructor() {
    // Initialize core
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const { code, language } = request;
    console.log('Execute called in language: ', { code, language });

    // Normalize language string for comparison
    const normalizedLanguage = language.toLowerCase().trim();

    // Handle JavaScript execution
    if (normalizedLanguage === 'javascript' || normalizedLanguage === 'js') {
      console.log('executecore has dispatched to JavaScriptExecutor');
      const jsExecutor = new JavaScriptExecutor();
      await jsExecutor.initialize();
      return await jsExecutor.execute(code);
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
      stderr: '',
    };
  }
}

export default WebRunnrCore;
