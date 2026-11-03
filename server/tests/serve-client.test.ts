import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers';

const clientDir = mkdtempSync(join(tmpdir(), 'test-ers-client-'));
mkdirSync(join(clientDir, 'assets'));
writeFileSync(join(clientDir, 'index.html'), '<!doctype html><div id="root"></div>');
writeFileSync(join(clientDir, 'assets', 'index-abc123.js'), 'console.log(1)');
writeFileSync(join(clientDir, 'favicon.svg'), '<svg/>');

afterAll(() => {
  rmSync(clientDir, { recursive: true, force: true });
});

describe('serving the built client', () => {
  const { app } = createTestApp({ clientDir });

  it.each(['/', '/login', '/employees?q=иван'])('serves index.html for %s', async (path) => {
    const res = await request(app).get(encodeURI(path));

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.headers['cache-control']).toBe('no-cache');
    expect(res.text).toContain('<div id="root">');
  });

  it('serves hashed assets with long-term caching', async () => {
    const res = await request(app).get('/assets/index-abc123.js');

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toContain('immutable');
  });

  it('serves other static files', async () => {
    const res = await request(app).get('/favicon.svg');

    expect(res.status).toBe(200);
  });

  it('returns 404 for a missing asset instead of index.html', async () => {
    const res = await request(app).get('/assets/missing.js');

    expect(res.status).toBe(404);
    expect(res.text).not.toContain('<div id="root">');
  });

  it('keeps JSON 404s for unknown API routes', async () => {
    const res = await request(app).get('/api/unknown');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('does not serve the client when it is not configured', async () => {
    const { app: apiOnly } = createTestApp();

    expect((await request(apiOnly).get('/')).status).toBe(404);
  });
});
