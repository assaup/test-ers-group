/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// `npm run dev` передаёт одно окружение и серверу, и Vite, поэтому PORT меняет порт для обоих
const apiPort = process.env.PORT ?? '3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // В разработке один origin: httpOnly-cookie сессии работает без CORS
    proxy: {
      '/api': `http://localhost:${apiPort}`,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
