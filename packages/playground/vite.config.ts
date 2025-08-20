import { defineConfig, Plugin } from 'vite';

const wasmContentTypePlugin: Plugin = {
  name: 'wasm-content-type-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.endsWith('.wasm')) {
        console.log(`[Vite Middleware] Setting WASM content type and cache headers for: ${req.url}`);
        res.setHeader('Content-Type', 'application/wasm');

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      next();
    });
  },
};

export default defineConfig({
  root: '.',
  plugins: [wasmContentTypePlugin],
  server: {
    port: 3000,
    host: true,
    fs: {
      allow: ['../../'],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html'
    }
  }
});
