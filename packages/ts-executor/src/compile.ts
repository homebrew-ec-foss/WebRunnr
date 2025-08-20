import {
  CompilationError,
  CompilationResult,
  CompilerOptions,
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
    // First try CDN Babel (most reliable in production)
    if (typeof window !== 'undefined' && (window as any).Babel) {
      const babel = (window as any).Babel;
      console.log('Using CDN Babel:', {
        hasTransform: typeof babel.transform === 'function',
        presets: Object.keys(babel.presets || {}),
        availablePresets: Object.keys(babel.availablePresets || {}),
      });
      return babel;
    }

    // Fallback to bundled Babel
    try {
      // @ts-ignore - @babel/standalone doesn't have type definitions
      const BabelModule = await import('@babel/standalone');
      const babel = BabelModule.default || BabelModule;
      console.log('Using bundled Babel:', {
        hasTransform: typeof babel.transform === 'function',
        presets: Object.keys(babel.presets || {}),
        availablePresets: Object.keys(babel.availablePresets || {}),
      });
      return babel;
    } catch (error) {
      throw new Error(
        'Babel not available. CDN failed and bundled Babel unavailable.'
      );
    }
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

    return errors;
  }
}

export default TypeScriptCompiler;
