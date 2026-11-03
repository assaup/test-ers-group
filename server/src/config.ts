import { fileURLToPath } from 'node:url';

// Both resolve the same from src/ (tsx) and from dist/ (bundled build)
const defaultDbPath = fileURLToPath(new URL('../data/app.db', import.meta.url));
const defaultClientDir = fileURLToPath(new URL('../../client/dist', import.meta.url));

export const config = {
  port: Number(process.env.PORT ?? 3000),
  dbPath: process.env.DB_PATH ?? defaultDbPath,
  /** Served only in production and only if it has been built (`npm run build`). */
  clientDir: process.env.CLIENT_DIR ?? defaultClientDir,
  // The tsup build inlines NODE_ENV=production, so `npm start` is production and `npm run dev`
  // is not: in dev the client comes from Vite and a stale client/dist must not be served
  isProduction: process.env.NODE_ENV === 'production',
  // Opt-in, only for deployments behind HTTPS: adds Secure to the session cookie, HSTS and
  // upgrade-insecure-requests. Over plain HTTP (LAN, a VPS without TLS) any of them breaks the app
  secureCookies: process.env.SECURE_COOKIES === 'true',
  sessionTtlSeconds: 7 * 24 * 60 * 60,
  // Per IP, per 15 minutes, on login and register
  authRateLimit: 20,
};
