import type { SQLOutputValue } from 'node:sqlite';

// node:sqlite возвращает строки со слабой типизацией; репозитории сужают типы этими хелперами,
// чтобы расхождение со схемой падало явно, а не утекало в API как `[object Uint8Array]`.

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
  // `errcode` — точный признак; текст ошибки — собственное сообщение SQLite, оно работает и на
  // версиях Node, где ошибки node:sqlite не содержат расширенного кода
  if ('errcode' in error && error.errcode === SQLITE_CONSTRAINT_UNIQUE) return true;
  return error.message.includes('UNIQUE constraint failed');
}
