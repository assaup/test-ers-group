import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { openDatabase, type Database } from '../src/db/connection';
import { runMigrations } from '../src/db/migrate';
import { seedDatabase } from '../src/db/seed';
import { createTestApp, getSessionCookie } from './helpers';

const PROTECTED_ROUTES = [
  ['GET', '/api/auth/me'],
  ['POST', '/api/auth/logout'],
  ['GET', '/api/departments'],
  ['GET', '/api/employees'],
  ['GET', '/api/employees?search=иван'],
  ['POST', '/api/employees'],
] as const;

describe('access control', () => {
  it.each(PROTECTED_ROUTES)('%s %s requires a session', async (method, path) => {
    const { app, db } = createTestApp();
    await seedDatabase(db);

    const req = method === 'GET' ? request(app).get(path) : request(app).post(path);
    const res = await req.send({ fullName: 'Взлом', position: 'Хакер', departmentId: 1 });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('does not create employees for anonymous requests', async () => {
    const { app, db } = createTestApp();
    await seedDatabase(db);

    await request(app)
      .post('/api/employees')
      .send({ fullName: 'Взлом', position: 'Хакер', departmentId: 1 });

    expect(db.prepare('SELECT COUNT(*) AS count FROM employees').get()?.count).toBe(5);
  });

  it.each(['/api/health', '/api/auth/register', '/api/auth/login'])(
    '%s is reachable without a session',
    async (path) => {
      const { app } = createTestApp();

      const res =
        path === '/api/health'
          ? await request(app).get(path)
          : await request(app).post(path).send({});

      expect(res.status).not.toBe(401);
    },
  );
});

describe('full user journey', () => {
  it('register → logout → login → browse → add → search → logout', async () => {
    const { app, db } = createTestApp();
    await seedDatabase(db);
    const user = request.agent(app);
    const credentials = { email: 'olga@example.com', password: 'strong-pass' };

    await user.post('/api/auth/register').send(credentials).expect(201);
    await user.post('/api/auth/logout').expect(204);
    await user.get('/api/employees').expect(401);

    await user.post('/api/auth/login').send(credentials).expect(200);
    const list = await user.get('/api/employees').expect(200);
    expect(list.body.items).toHaveLength(5);

    const departments = await user.get('/api/departments').expect(200);
    const hr = (departments.body.items as { id: number; name: string }[]).find(
      (d) => d.name === 'HR',
    );
    const created = await user
      .post('/api/employees')
      .send({ fullName: 'Орлова Наталья Павловна', position: 'Рекрутер', departmentId: hr?.id })
      .expect(201);

    const found = await user.get('/api/employees').query({ search: 'орлова' }).expect(200);
    expect(found.body.items).toEqual([created.body.employee]);
    const inHr = await user.get('/api/employees').query({ departmentId: hr?.id }).expect(200);
    expect(inHr.body.items.map((e: { fullName: string }) => e.fullName)).toEqual([
      'Орлова Наталья Павловна',
      'Смирнова Ольга Викторовна',
    ]);

    await user.post('/api/auth/logout').expect(204);
    await user.get('/api/employees').expect(401);
  });

  it('shares the employee list between users', async () => {
    const { app, db } = createTestApp();
    await seedDatabase(db);
    const first = request.agent(app);
    const second = request.agent(app);
    await first.post('/api/auth/register').send({ email: 'a@example.com', password: 'secret123' });
    await second.post('/api/auth/register').send({ email: 'b@example.com', password: 'secret123' });

    await first
      .post('/api/employees')
      .send({ fullName: 'Общий Сотрудник', position: 'Стажёр', departmentId: 1 })
      .expect(201);

    const res = await second.get('/api/employees').query({ search: 'общий' });
    expect(res.body.items).toHaveLength(1);
  });
});

describe('server restart', () => {
  let dir: string;
  const opened: Database[] = [];

  afterEach(() => {
    for (const db of opened.splice(0)) db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  async function startServer(path: string) {
    const db = openDatabase(path);
    opened.push(db);
    runMigrations(db);
    await seedDatabase(db);
    return { app: createApp({ db, authRateLimit: false }), db };
  }

  it('keeps users, sessions and added employees', async () => {
    dir = mkdtempSync(join(tmpdir(), 'test-ers-api-'));
    const path = join(dir, 'app.db');

    const before = await startServer(path);
    const registered = await request(before.app)
      .post('/api/auth/register')
      .send({ email: 'keep@example.com', password: 'secret123' });
    const cookie = `sid=${getSessionCookie(registered)?.value ?? ''}`;
    await request(before.app)
      .post('/api/employees')
      .set('Cookie', cookie)
      .send({ fullName: 'Сохранённый Сотрудник', position: 'Архивариус', departmentId: 1 })
      .expect(201);
    before.db.close();
    opened.splice(0);

    const after = await startServer(path);

    // The same cookie still works: sessions live in the database, not in memory
    const list = await request(after.app).get('/api/employees').set('Cookie', cookie).expect(200);
    expect(list.body.items).toHaveLength(6);

    await request(after.app)
      .post('/api/auth/login')
      .send({ email: 'keep@example.com', password: 'secret123' })
      .expect(200);
  });
});

describe('validation messages', () => {
  it.each([
    ['POST', '/api/auth/register', undefined],
    ['POST', '/api/auth/register', { email: 'a@example.com', password: '        ' }],
    ['POST', '/api/employees', undefined],
    ['GET', `/api/employees?search=${'я'.repeat(101)}`, undefined],
    ['GET', '/api/employees?departmentId=0x1', undefined],
    ['GET', '/api/employees?search=a&search=b', undefined],
  ] as const)('are in Russian for %s %s', async (method, path, body) => {
    const { app, db } = createTestApp();
    await seedDatabase(db);
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ email: 'ru@example.com', password: 'secret123' });

    const req = method === 'GET' ? agent.get(encodeURI(path)) : agent.post(path);
    const res = await (body === undefined ? req : req.send(body));

    expect(res.status).toBe(400);
    const messages = Object.values(res.body.error.fields as Record<string, string>);
    expect(messages.length).toBeGreaterThan(0);
    for (const message of messages) {
      expect(message).toMatch(/[а-яё]/i);
    }
  });
});
