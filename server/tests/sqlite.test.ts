import { describe, expect, it } from 'vitest';
import { asNumber, asString, isUniqueViolation } from '../src/db/sqlite';
import { createTestDb } from './helpers';

describe('isUniqueViolation', () => {
  it('recognizes a real UNIQUE error from node:sqlite', () => {
    const db = createTestDb();
    const insert = db.prepare('INSERT INTO departments (name) VALUES (?)');
    insert.run('HR');

    let error: unknown;
    try {
      insert.run('HR');
    } catch (caught) {
      error = caught;
    }

    expect(isUniqueViolation(error)).toBe(true);
  });

  it('falls back to the SQLite message when there is no extended error code', () => {
    expect(isUniqueViolation(new Error('UNIQUE constraint failed: users.email'))).toBe(true);
  });

  it('ignores other errors', () => {
    expect(isUniqueViolation(new Error('FOREIGN KEY constraint failed'))).toBe(false);
    expect(isUniqueViolation('UNIQUE constraint failed')).toBe(false);
  });
});

describe('row narrowing', () => {
  it('accepts matching column types and rejects others', () => {
    expect(asNumber(5)).toBe(5);
    expect(asNumber(5n)).toBe(5);
    expect(asString('a')).toBe('a');
    expect(() => asNumber('5')).toThrow(TypeError);
    expect(() => asString(null)).toThrow(TypeError);
  });
});
