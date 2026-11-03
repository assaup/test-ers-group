import type { SQLOutputValue } from 'node:sqlite';

// node:sqlite returns loosely typed rows; repositories narrow them through these helpers
// so a schema mismatch fails loudly instead of leaking `[object Uint8Array]` into the API.

export function asNumber(value: SQLOutputValue | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  throw new TypeError(`Expected a number column, got ${typeof value}`);
}

export function asString(value: SQLOutputValue | undefined): string {
  if (typeof value === 'string') return value;
  throw new TypeError(`Expected a text column, got ${typeof value}`);
}

const SQLITE_CONSTRAINT_UNIQUE = 2067;

export function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  // `errcode` is the precise signal; the message is SQLite's own text and works even on Node
  // versions whose node:sqlite errors don't carry the extended code
  if ('errcode' in error && error.errcode === SQLITE_CONSTRAINT_UNIQUE) return true;
  return error.message.includes('UNIQUE constraint failed');
}
