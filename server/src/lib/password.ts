import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// See ADR 004. Params live inside the stored string, so they can be raised later
// without invalidating existing hashes.
const DEFAULT_PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

interface ScryptParams {
  N: number;
  r: number;
  p: number;
}

/** Format: `scrypt$N$r$p$<salt base64>$<hash base64>` */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt, DEFAULT_PARAMS, KEY_LENGTH);
  const { N, r, p } = DEFAULT_PARAMS;
  return ['scrypt', N, r, p, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parseHash(stored);
  if (!parsed) return false;

  const key = await deriveKey(password, parsed.salt, parsed.params, parsed.key.length);
  return timingSafeEqual(key, parsed.key);
}

function parseHash(stored: string) {
  const [algorithm, N, r, p, salt, key] = stored.split('$');
  if (algorithm !== 'scrypt' || !N || !r || !p || !salt || !key) return undefined;

  const params = { N: Number(N), r: Number(r), p: Number(p) };
  if (!Object.values(params).every(Number.isSafeInteger)) return undefined;

  return { params, salt: Buffer.from(salt, 'base64'), key: Buffer.from(key, 'base64') };
}

// Async scrypt runs on the libuv thread pool and doesn't block the event loop
function deriveKey(password: string, salt: Buffer, params: ScryptParams, length: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, length, { ...params, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}
