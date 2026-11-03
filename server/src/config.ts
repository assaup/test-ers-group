import { fileURLToPath } from 'node:url';

// Resolves to server/data/app.db both from src/ (tsx) and from dist/ (bundled build)
const defaultDbPath = fileURLToPath(new URL('../data/app.db', import.meta.url));

const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  dbPath: process.env.DB_PATH ?? defaultDbPath,
  isProduction,
  // Secure cookies need HTTPS; locally the app runs on plain http://localhost
  secureCookies: isProduction,
  sessionTtlSeconds: 7 * 24 * 60 * 60,
  // Per IP, per 15 minutes, on login and register
  authRateLimit: 20,
};
