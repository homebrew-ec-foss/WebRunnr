import { TypeScriptCompiler } from './compile.js';
import { CompilerOptions, ExecutionRequest, ExecutionResult } from './types.js';

export class TypeScriptExecutor {
  private compiler: TypeScriptCompiler;
  private jsExecutor: any = null; // Will hold JavaScriptExecutor instance

  constructor() {
    this.compiler = new TypeScriptCompiler();
  }

  public async initialize(): Promise<void> {
    
    console.log('TypeScript executor initialized');
  }

  public async compileOnly(code: string, options?: CompilerOptions) {
    return await this.compiler.compile(code, options);
  }

  // Executes TypeScript code by compiling it to JavaScript and optionally running it
  public async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    try {
      // Basic validation - check if code is empty
      if (!request.code.trim()) {
        return {
          stdout: '',
          stderr: 'Error: Code cannot be empty',
        };
      }

      // Compile TypeScript to JavaScript
      const compilationResult = await this.compiler.compile(
        request.code,
        request.options
      );

      if (!compilationResult.success || !compilationResult.code) {
        const errorMessage = compilationResult.errors
          ? compilationResult.errors.map((e) => e.message).join('\n')
          : 'Unknown compilation error';

        return {
          stdout: '',
          stderr: `Compilation failed:\n${errorMessage}`,
          compilationErrors: compilationResult.errors,
        };
      }

      // Try to execute compiled JavaScript if JS executor is available
      if (this.jsExecutor) {
        try {
          const executionResult = await this.jsExecutor.execute(
            compilationResult.code
          );
          return {
            stdout: executionResult.stdout,
            stderr: executionResult.stderr,
          };
        } catch (execError) {
          return {
            stdout: '',
            stderr: `Execution failed: ${execError instanceof Error ? execError.message : 'Unknown execution error'}`,
          };
        }
      }

      return {
        stdout: 'TypeScript compiled successfully (no executor connected)',
        stderr: '',
      };
    } catch (error) {
      return {
        stdout: '',
        stderr: `Compilation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  public setJavaScriptExecutor(jsExecutor: any): void {
    this.jsExecutor = jsExecutor;
  }

  public canExecute(): boolean {
    return this.jsExecutor !== null;
  }

  public getMode(): 'full-execution' | 'compilation-only' {
    return this.canExecute() ? 'full-execution' : 'compilation-only';
  }

  public destroy(): void {
    if (this.jsExecutor && typeof this.jsExecutor.destroy === 'function') {
      this.jsExecutor.destroy();
    }
    this.jsExecutor = null;
  }
}

// Export types for external use
export { TypeScriptCompiler } from './compile.js';
export * from './types.js';

export default TypeScriptExecutor;