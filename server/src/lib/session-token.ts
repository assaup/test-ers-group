import { createHash, randomBytes } from 'node:crypto';

export const SESSION_COOKIE = 'sid';

/** 256 bits of randomness; the raw value lives only in the client's cookie. */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** What the database stores (ADR 001): a leaked table yields no usable tokens. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
