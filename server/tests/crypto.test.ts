import { randomBytes, scryptSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/lib/password';
import { generateSessionToken, hashSessionToken } from '../src/lib/session-token';

describe('hashPassword / verifyPassword', () => {
  it('verifies the original password', async () => {
    const hash = await hashPassword('correct horse');

    expect(await verifyPassword('correct horse', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse');

    expect(await verifyPassword('correct hors', hash)).toBe(false);
    expect(await verifyPassword('', hash)).toBe(false);
  });

  it('never stores the password itself and salts every hash', async () => {
    const first = await hashPassword('пароль123');
    const second = await hashPassword('пароль123');

    expect(first).toMatch(/^scrypt\$16384\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(first).not.toContain('пароль123');
    expect(first).not.toBe(second);
  });

  it('verifies hashes stored with other parameters', async () => {
    // Как будто записано старой версией: параметры слабее, ключ короче
    const salt = randomBytes(16);
    const key = scryptSync('secret123', salt, 32, { N: 1024, r: 8, p: 1 });
    const legacy = `scrypt$1024$8$1$${salt.toString('base64')}$${key.toString('base64')}`;

    expect(await verifyPassword('secret123', legacy)).toBe(true);
    expect(await verifyPassword('secret124', legacy)).toBe(false);
  });

  it('returns false for malformed stored values', async () => {
    for (const stored of ['', 'plain-text', 'bcrypt$1$2$3$a$b', 'scrypt$x$8$1$abc$def']) {
      expect(await verifyPassword('anything', stored)).toBe(false);
    }
  });
});

describe('session tokens', () => {
  it('generates unique url-safe tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, generateSessionToken));

    expect(tokens.size).toBe(100);
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    }
  });

  it('hashes tokens deterministically with sha256', () => {
    const token = generateSessionToken();

    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashSessionToken(token)).not.toContain(token);
  });
});
