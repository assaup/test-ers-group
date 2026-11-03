import { describe, expect, it, vi } from 'vitest';
import { apiError, mockApi } from '../test/fake-api';
import { ApiError, apiRequest, onUnauthorized } from './client';
import { errorMessage } from './messages';

describe('apiRequest', () => {
  it('sends JSON and returns the parsed body', async () => {
    const { calls } = mockApi({ 'POST /api/things': { status: 201, body: { id: 7 } } });

    const result = await apiRequest<{ id: number }>('/things', {
      method: 'POST',
      body: { name: 'x' },
    });

    expect(result).toEqual({ id: 7 });
    expect(calls[0]).toMatchObject({ method: 'POST', path: '/api/things', body: { name: 'x' } });
  });

  it('builds the query string and skips empty values', async () => {
    const { calls } = mockApi({ 'GET /api/employees': { status: 200, body: { items: [] } } });

    await apiRequest('/employees', { query: { search: 'ёлка', departmentId: undefined, x: '' } });

    expect(calls[0]?.query.toString()).toBe('search=%D1%91%D0%BB%D0%BA%D0%B0');
  });

  it('returns undefined for 204 responses', async () => {
    mockApi({ 'POST /api/auth/logout': { status: 204 } });

    expect(await apiRequest('/auth/logout', { method: 'POST' })).toBeUndefined();
  });

  it('turns error responses into ApiError with code and fields', async () => {
    mockApi({
      'POST /api/auth/register': apiError(409, 'EMAIL_TAKEN', {
        email: 'Этот email уже зарегистрирован',
      }),
    });

    const error = await apiRequest('/auth/register', { method: 'POST', body: {} }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      code: 'EMAIL_TAKEN',
      fields: { email: 'Этот email уже зарегистрирован' },
    });
  });

  it('reports network failures as NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(apiRequest('/employees')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('handles non-JSON error bodies', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Bad gateway', { status: 502 })));

    await expect(apiRequest('/employees')).rejects.toMatchObject({
      status: 502,
      code: 'INTERNAL_ERROR',
    });
  });

  it('notifies the unauthorized handler on 401 UNAUTHORIZED only', async () => {
    const handler = vi.fn();
    const unsubscribe = onUnauthorized(handler);
    mockApi({
      'GET /api/employees': apiError(401, 'UNAUTHORIZED'),
      'POST /api/auth/login': apiError(401, 'INVALID_CREDENTIALS'),
    });

    await apiRequest('/employees').catch(() => undefined);
    await apiRequest('/auth/login', { method: 'POST', body: {} }).catch(() => undefined);
    unsubscribe();

    expect(handler).toHaveBeenCalledOnce();
  });
});

describe('errorMessage', () => {
  it('maps codes to Russian messages and falls back for the rest', () => {
    expect(errorMessage(new ApiError(401, 'INVALID_CREDENTIALS', 'x'))).toBe(
      'Неверный email или пароль',
    );
    expect(errorMessage(new ApiError(0, 'NETWORK_ERROR', 'x'))).toBe(
      'Нет связи с сервером. Проверьте подключение',
    );
    expect(errorMessage(new Error('boom'))).toBe('Что-то пошло не так. Попробуйте ещё раз');
  });
});
