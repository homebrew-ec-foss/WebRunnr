
import {
  CompilerOptions,
  CompilationResult,
  CompilationError,
} from './types.js';

export class TypeScriptCompiler {
  private defaultOptions: CompilerOptions = {
    target: 'es2020',
    module: 'es2020',
    lib: ['es2020', 'dom'],
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
  };

   
  private async getBabel() {
    // Check if we're in browser with global Babel
    if (typeof window !== 'undefined' && (window as any).Babel) {
      return (window as any).Babel;
    }

    // Node.js environment - use dynamic import
    const BabelModule = await import('@babel/standalone');
    return BabelModule.default || BabelModule;
  }


  public async compile(
    tsCode: string,
    options?: CompilerOptions
  ): Promise<CompilationResult> {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options };

      // Basic TypeScript error detection 
      const typeErrors = this.detectBasicTypeErrors(tsCode);
      if (typeErrors.length > 0) {
        return {
          success: false,
          errors: typeErrors,
        };
      }

      const Babel = await this.getBabel();

      // Configure Babel with TypeScript compilation
      const result = Babel.transform(tsCode, {
        presets: [
          [
            'typescript',
            {
              allExtensions: true,
              allowDeclareFields: true,
            },
          ],
        ],
        filename: 'input.ts',
      });

      if (!result || !result.code) {
        return {
          success: false,
          errors: [
            {
              message: 'Compilation failed: No output generated',
            },
          ],
        };
      }

      return {
        success: true,
        code: result.code,
      };
    } catch (error) {
      return {
        success: false,
        errors: this.parseCompilationError(error),
      };
    }
  }

  //Parses compilation errors from Babel
   
  private parseCompilationError(error: any): CompilationError[] {
    const errors: CompilationError[] = [];

    if (error.message) {
      errors.push({
        message: error.message,
        line: error.loc?.line,
        column: error.loc?.column,
      });
    } else {
      errors.push({
        message: 'Unknown compilation error',
      });
    }

    return errors;
  }

  
  private detectBasicTypeErrors(code: string): CompilationError[] {
    const errors: CompilationError[] = [];

    // Very basic error detection 
    // For now, just return empty array (no error detection)

    return errors;
  }
}

export default TypeScriptCompiler;
