import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { DEMO_USER, seedDatabase } from '../src/db/seed';
import { hashSessionToken } from '../src/lib/session-token';
import { createTestApp, getSessionCookie } from './helpers';

const credentials = { email: 'anna@example.com', password: 'secret123' };

function countSessions(db: ReturnType<typeof createTestApp>['db']) {
  return db.prepare('SELECT COUNT(*) AS count FROM sessions').get()?.count;
}

function expireAllSessions(db: ReturnType<typeof createTestApp>['db']) {
  db.exec("UPDATE sessions SET expires_at = datetime('now', '-1 second')");
}

describe('POST /api/auth/register', () => {
  it('creates the user and starts a session', async () => {
    const { app } = createTestApp();
    const agent = request.agent(app);

    const res = await agent
      .post('/api/auth/register')
      .send({ email: '  Anna@Example.com ', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ user: { id: expect.any(Number), email: 'anna@example.com' } });
    expect((await agent.get('/api/auth/me')).status).toBe(200);
  });

  it('sets an httpOnly SameSite=Lax session cookie', async () => {
    const { app } = createTestApp();

    const res = await request(app).post('/api/auth/register').send(credentials);

    expect(getSessionCookie(res)).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    expect(getSessionCookie(res)?.secure).toBeFalsy();
  });

  it('marks the cookie Secure when configured for production', async () => {
    const { app } = createTestApp({ secureCookies: true });

    const res = await request(app).post('/api/auth/register').send(credentials);

    expect(getSessionCookie(res)?.secure).toBe(true);
  });

  it('stores only hashes of the password and the session token', async () => {
    const { app, db } = createTestApp();

    const res = await request(app).post('/api/auth/register').send(credentials);
    const token = getSessionCookie(res)?.value ?? '';

    const user = db.prepare('SELECT password_hash FROM users').get();
    expect(user?.password_hash).toMatch(/^scrypt\$/);
    expect(user?.password_hash).not.toContain(credentials.password);

    const session = db.prepare('SELECT token_hash FROM sessions').get();
    expect(session?.token_hash).toBe(hashSessionToken(token));
    expect(session?.token_hash).not.toBe(token);
  });

  it('never returns the password hash', async () => {
    const { app } = createTestApp();

    const res = await request(app).post('/api/auth/register').send(credentials);

    expect(JSON.stringify(res.body)).not.toMatch(/password|scrypt/i);
  });

  it('rejects a taken email regardless of case', async () => {
    const { app } = createTestApp();
    await request(app).post('/api/auth/register').send(credentials);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, email: 'ANNA@example.com' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: {
        code: 'EMAIL_TAKEN',
        message: 'Этот email уже зарегистрирован',
        fields: { email: 'Этот email уже зарегистрирован' },
      },
    });
    expect(getSessionCookie(res)).toBeUndefined();
  });

  it('returns field errors for invalid input', async () => {
    const { app } = createTestApp();

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nope', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      code: 'VALIDATION_ERROR',
      fields: {
        email: 'Введите корректный email',
        password: 'Пароль должен быть не короче 8 символов',
      },
    });
  });
});

describe('POST /api/auth/login', () => {
  it('logs in the seeded demo user', async () => {
    const { app, db } = createTestApp();
    await seedDatabase(db);

    const res = await request(app).post('/api/auth/login').send(DEMO_USER);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: expect.any(Number), email: DEMO_USER.email } });
    expect(getSessionCookie(res)?.value).toBeTruthy();
  });

  it('gives the same answer for a wrong password and an unknown email', async () => {
    const { app } = createTestApp();
    await request(app).post('/api/auth/register').send(credentials);

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, email: 'ghost@example.com' });

    for (const res of [wrongPassword, unknownEmail]) {
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: { code: 'INVALID_CREDENTIALS', message: 'Неверный email или пароль' },
      });
      expect(getSessionCookie(res)).toBeUndefined();
    }
  });

  it('keeps sessions from different devices independent', async () => {
    const { app } = createTestApp();
    await request(app).post('/api/auth/register').send(credentials);
    const laptop = request.agent(app);
    const phone = request.agent(app);
    await laptop.post('/api/auth/login').send(credentials);
    await phone.post('/api/auth/login').send(credentials);

    await laptop.post('/api/auth/logout');

    expect((await laptop.get('/api/auth/me')).status).toBe(401);
    expect((await phone.get('/api/auth/me')).status).toBe(200);
  });

  it('removes expired sessions', async () => {
    const { app, db } = createTestApp();
    await request(app).post('/api/auth/register').send(credentials);
    expireAllSessions(db);

    await request(app).post('/api/auth/login').send(credentials);

    expect(countSessions(db)).toBe(1);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user', async () => {
    const { app } = createTestApp();
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials);

    const res = await agent.get('/api/auth/me');

    expect(res.body).toEqual({ user: { id: expect.any(Number), email: credentials.email } });
  });

  it.each([
    ['no cookie', undefined],
    ['an unknown token', 'sid=made-up-token'],
    ['an empty token', 'sid='],
  ])('returns 401 with %s', async (_label, cookie) => {
    const { app } = createTestApp();

    const req = request(app).get('/api/auth/me');
    const res = await (cookie ? req.set('Cookie', cookie) : req);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Требуется вход в систему' },
    });
  });

  it('returns 401 once the session has expired', async () => {
    const { app, db } = createTestApp();
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials);

    expireAllSessions(db);

    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('deletes the session and clears the cookie', async () => {
    const { app, db } = createTestApp();
    const registered = await request(app).post('/api/auth/register').send(credentials);
    const cookie = `sid=${getSessionCookie(registered)?.value ?? ''}`;

    const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);

    expect(res.status).toBe(204);
    expect(getSessionCookie(res)).toMatchObject({ value: '', expires: new Date(0) });
    expect(countSessions(db)).toBe(0);
  });

  it('invalidates the token immediately, even if the client keeps it', async () => {
    const { app } = createTestApp();
    const registered = await request(app).post('/api/auth/register').send(credentials);
    const cookie = `sid=${getSessionCookie(registered)?.value ?? ''}`;

    await request(app).post('/api/auth/logout').set('Cookie', cookie);

    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(401);
  });

  it('requires a session', async () => {
    const { app } = createTestApp();

    expect((await request(app).post('/api/auth/logout')).status).toBe(401);
  });
});

describe('rate limiting', () => {
  it('limits login attempts per client', async () => {
    const { app } = createTestApp({ authRateLimit: 3 });
    const attempt = () =>
      request(app)
        .post('/api/auth/login')
        .send({ ...credentials, password: 'guess' });

    for (let i = 0; i < 3; i++) {
      expect((await attempt()).status).toBe(401);
    }
    const blocked = await attempt();

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      error: { code: 'TOO_MANY_REQUESTS', message: 'Слишком много попыток, попробуйте позже' },
    });
  });

  it('does not limit authenticated endpoints', async () => {
    const { app } = createTestApp({ authRateLimit: 1 });
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials);

    for (let i = 0; i < 5; i++) {
      expect((await agent.get('/api/auth/me')).status).toBe(200);
    }
  });

  it('does not count successful logins', async () => {
    const { app } = createTestApp({ authRateLimit: 2 });
    await request(app).post('/api/auth/register').send(credentials);

    for (let i = 0; i < 6; i++) {
      expect((await request(app).post('/api/auth/login').send(credentials)).status).toBe(200);
    }
    // Failures still count: two wrong passwords use up the limit
    await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, password: 'wrong' });
    await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, password: 'wrong' });

    expect((await request(app).post('/api/auth/login').send(credentials)).status).toBe(429);
  });
});
