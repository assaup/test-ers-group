import { parseSetCookie } from 'cookie';
import request, { type Response } from 'supertest';
import { createApp, type AppDeps } from '../src/app';
import { IN_MEMORY, openDatabase } from '../src/db/connection';
import { runMigrations } from '../src/db/migrate';
import { seedDatabase } from '../src/db/seed';
import { SESSION_COOKIE } from '../src/lib/session-token';

/** Новая база в памяти с применёнными миграциями — настоящий SQLite, без моков. */
export function createTestDb() {
  const db = openDatabase(IN_MEMORY);
  runMigrations(db);
  return db;
}

/** Приложение на новой базе; лимит попыток выключен, если тест не включит его сам. */
export function createTestApp(options: Partial<AppDeps> = {}) {
  const db = options.db ?? createTestDb();
  const app = createApp({ authRateLimit: false, ...options, db });
  return { app, db };
}

/** Приложение с сидом и агент, уже вошедший под новым пользователем. */
export async function createLoggedInApp(options: Partial<AppDeps> = {}) {
  const { app, db } = createTestApp(options);
  await seedDatabase(db);
  const agent = request.agent(app);
  await agent
    .post('/api/auth/register')
    .send({ email: 'tester@example.com', password: 'secret123' })
    .expect(201);
  return { app, db, agent };
}

export function getSessionCookie(res: Response) {
  const header = res.headers['set-cookie'] as string[] | string | undefined;
  const cookies = (Array.isArray(header) ? header : header ? [header] : []).map((value) =>
    parseSetCookie(value),
  );
  return cookies.find((cookie) => cookie.name === SESSION_COOKIE);
}
