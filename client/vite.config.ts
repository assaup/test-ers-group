/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// `npm run dev` passes the same environment to the server and to Vite, so PORT moves both
const apiPort = process.env.PORT ?? '3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Same-origin in dev: the httpOnly session cookie works without CORS
    proxy: {
      '/api': `http://localhost:${apiPort}`,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
