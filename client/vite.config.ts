/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// PORT — порт, который открывает пользователь (в разработке это Vite), API_PORT — порт API.
// Если бы прокси брал PORT, превью с PORT=5173 проксировало бы /api само на себя
const clientPort = Number(process.env.PORT ?? 5173);
const apiPort = process.env.API_PORT ?? '3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: clientPort,
    // Занятый порт — ошибка, а не тихий переход на соседний: превью ждёт клиент именно здесь
    strictPort: true,
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
