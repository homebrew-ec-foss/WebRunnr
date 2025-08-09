/**
 * TypeScript Executor Types
 * Defines interfaces and types for TypeScript compilation and execution
 */

export interface CompilerOptions {
  target?: string;
  module?: string;
  lib?: string[];
  strict?: boolean;
  esModuleInterop?: boolean;
  skipLibCheck?: boolean;
}

export interface CompilationResult {
  success: boolean;
  code?: string;
  errors?: CompilationError[];
}

export interface CompilationError {
  message: string;
  line?: number;
  column?: number;
}

export interface ExecutionRequest {
  code: string;
  options?: CompilerOptions;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  compilationErrors?: CompilationError[];
}