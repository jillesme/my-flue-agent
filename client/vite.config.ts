import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: fileURLToPath(new URL('../dist/client', import.meta.url)),
  },
  root: fileURLToPath(new URL('.', import.meta.url)),
  server: {
    proxy: {
      '/api': 'http://localhost:3583',
    },
  },
});
