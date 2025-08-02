import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3000, // or whatever port you prefer
    host: true  // to expose on network
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html'
    }
  }
});