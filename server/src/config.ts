import { fileURLToPath } from 'node:url';

// Resolves to server/data/app.db both from src/ (tsx) and from dist/ (bundled build)
const defaultDbPath = fileURLToPath(new URL('../data/app.db', import.meta.url));

export const config = {
  port: Number(process.env.PORT ?? 3000),
  dbPath: process.env.DB_PATH ?? defaultDbPath,
  isProduction: process.env.NODE_ENV === 'production',
};
