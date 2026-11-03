import { vi } from 'vitest';

export interface ApiCall {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
}

interface MockResponse {
  status: number;
  body?: unknown;
}

type Route = MockResponse | ((call: ApiCall) => MockResponse | Promise<MockResponse>);

/**
 * Подменяет fetch таблицей маршрутов ("GET /api/auth/me" → ответ).
 * Компоненты тестируются с настоящим API-клиентом, поддельна только сеть.
 */
export function mockApi(routes: Record<string, Route>) {
  const calls: ApiCall[] = [];

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(href, 'http://localhost');
    const method = init?.method ?? 'GET';
    const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    const call = { method, path: url.pathname, query: url.searchParams, body };
    calls.push(call);

    const route = routes[`${method} ${url.pathname}`];
    if (!route) {
      return json({
        status: 501,
        body: {
          error: { code: 'INTERNAL_ERROR', message: `No mock for ${method} ${url.pathname}` },
        },
      });
    }
    return json(typeof route === 'function' ? await route(call) : route);
  });

  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock };
}

function json({ status, body }: MockResponse) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function apiError(
  status: number,
  code: string,
  fields?: Record<string, string>,
): MockResponse {
  return { status, body: { error: { code, message: code, ...(fields && { fields }) } } };
}

export const demoUser = { id: 1, email: 'demo@example.com' };

export const signedIn: MockResponse = { status: 200, body: { user: demoUser } };
export const signedOut = apiError(401, 'UNAUTHORIZED');
