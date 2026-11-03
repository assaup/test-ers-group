import { createHash, randomBytes } from 'node:crypto';

export const SESSION_COOKIE = 'sid';

/** 256 бит случайности; сам токен хранится только в cookie клиента. */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** То, что хранится в базе (ADR 001): утечка таблицы не даёт рабочих токенов. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
