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
  return error instanceof Error && 'errcode' in error && error.errcode === SQLITE_CONSTRAINT_UNIQUE;
}
