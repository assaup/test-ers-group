import { parseSetCookie } from 'cookie';
import request, { type Response } from 'supertest';
import { createApp, type AppDeps } from '../src/app';
import { IN_MEMORY, openDatabase } from '../src/db/connection';
import { runMigrations } from '../src/db/migrate';
import { seedDatabase } from '../src/db/seed';
import { SESSION_COOKIE } from '../src/lib/session-token';

/** A fresh migrated in-memory database — real SQLite, no mocks. */
export function createTestDb() {
  const db = openDatabase(IN_MEMORY);
  runMigrations(db);
  return db;
}

/** App over a fresh database; rate limiting is off unless a test turns it on. */
export function createTestApp(options: Partial<AppDeps> = {}) {
  const db = options.db ?? createTestDb();
  const app = createApp({ authRateLimit: false, ...options, db });
  return { app, db };
}

/** Seeded app plus an agent already logged in as a fresh user. */
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
