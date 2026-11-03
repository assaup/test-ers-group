import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { AppError } from '../src/lib/errors';
import { errorHandler } from '../src/middleware/error-handler';
import { createTestDb } from './helpers';

describe('createApp', () => {
  const app = createApp({ db: createTestDb() });

  it('responds to the health check', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('sets security headers', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('returns a JSON 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/nope');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Маршрут не найден' } });
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
  });
});

describe('errorHandler', () => {
  function appThrowing(error: unknown) {
    const app = express();
    app.get('/boom', () => {
      throw error;
    });
    app.use(errorHandler);
    return app;
  }

  it('passes AppError status, code and field errors through', async () => {
    const error = new AppError(400, 'VALIDATION_ERROR', 'Проверьте поля', {
      email: 'Введите email',
    });

    const res = await request(appThrowing(error)).get('/boom');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Проверьте поля',
        fields: { email: 'Введите email' },
      },
    });
  });

  it('hides details of unexpected errors behind a generic 500', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const res = await request(appThrowing(new Error('SQLITE_CORRUPT: secret detail'))).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' },
    });
    expect(JSON.stringify(res.body)).not.toContain('secret');
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});
