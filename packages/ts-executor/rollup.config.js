import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default [
  // Main bundle with Babel included
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true,
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs({
        include: ['node_modules/**'],
      }),
      typescript({
        declaration: true,
        declarationDir: 'dist',
        rootDir: 'src',
      }),
    ],
    external: [], // Bundle everything including @babel/standalone
  },
];
