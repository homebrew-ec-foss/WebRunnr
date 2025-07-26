// Type declarations for @babel/standalone
declare module '@babel/standalone' {
  interface TransformOptions {
    presets?: any[];
    filename?: string;
  }

  interface TransformResult {
    code: string;
  }

  export function transform(code: string, options: TransformOptions): TransformResult;
  export default any;
}
