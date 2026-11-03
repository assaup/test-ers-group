import { fileURLToPath } from 'node:url';

// Оба пути одинаково разрешаются и из src/ (tsx), и из dist/ (собранный бандл)
const defaultDbPath = fileURLToPath(new URL('../data/app.db', import.meta.url));
const defaultClientDir = fileURLToPath(new URL('../../client/dist', import.meta.url));

export const config = {
  port: Number(process.env.PORT ?? 3000),
  dbPath: process.env.DB_PATH ?? defaultDbPath,
  /** Отдаётся только в production и только если клиент собран (`npm run build`). */
  clientDir: process.env.CLIENT_DIR ?? defaultClientDir,
  // Сборка tsup вшивает NODE_ENV=production: `npm start` — это production, а `npm run dev` — нет.
  // В разработке клиент отдаёт Vite, и устаревшую сборку из client/dist отдавать нельзя
  isProduction: process.env.NODE_ENV === 'production',
  // Включается явно и только за HTTPS: флаг Secure у cookie сессии, HSTS и
  // upgrade-insecure-requests. По обычному HTTP (локальная сеть, сервер без TLS) любой из них ломает приложение
  secureCookies: process.env.SECURE_COOKIES === 'true',
  sessionTtlSeconds: 7 * 24 * 60 * 60,
  // Неудачных попыток с одного IP за 15 минут на входе и регистрации
  authRateLimit: 30,
};
