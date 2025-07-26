/**
 * TypeScript Executor - Main class for executing TypeScript code
 * Focuses on TypeScript compilation to JavaScript
 */

import { TypeScriptCompiler } from './compile.js';
import { ExecutionRequest, ExecutionResult, CompilerOptions } from './types.js';

export class TypeScriptExecutor {
  private compiler: TypeScriptCompiler;

  constructor() {
    this.compiler = new TypeScriptCompiler();
  }

  /**
   * Initializes the TypeScript executor
   */
  public initialize(): void {
    // Initialization complete
  }

  /**
   * Compiles TypeScript code without executing it
   * @param code - TypeScript code to compile
   * @param options - Compiler options
   * @returns Compilation result
   */
  public async compileOnly(code: string, options?: CompilerOptions) {
    return await this.compiler.compile(code, options);
  }

  /**
   * Executes TypeScript code by compiling it to JavaScript
   * Note: JavaScript execution will be handled by separate JS executor
   * @param request - Execution request containing code and options
   * @returns Promise with execution result
   */
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
          ? compilationResult.errors.map(e => e.message).join('\n')
          : 'Unknown compilation error';

        return {
          stdout: '',
          stderr: `Compilation failed:\n${errorMessage}`,
          compilationErrors: compilationResult.errors,
        };
      }

      // Return compiled JavaScript (execution will be handled separately)
      return {
        stdout: `Successfully compiled to JavaScript:\n\n${compilationResult.code}`,
        stderr: '',
      };
    } catch (error) {
      return {
        stdout: '',
        stderr: `Compilation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

// Export types for external use
export * from './types.js';
export { TypeScriptCompiler } from './compile.js';

export default TypeScriptExecutor;
