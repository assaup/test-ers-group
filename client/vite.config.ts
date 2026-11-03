import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Same-origin in dev: the httpOnly session cookie works without CORS
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
