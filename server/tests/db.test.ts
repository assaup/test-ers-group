import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { IN_MEMORY, openDatabase, transaction } from '../src/db/connection';
import { runMigrations } from '../src/db/migrate';
import { seedDatabase } from '../src/db/seed';
import { createTestDb } from './helpers';

function tableNames(db: ReturnType<typeof openDatabase>) {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all()
    .map((row) => row.name);
}

describe('runMigrations', () => {
  it('creates the schema and records applied migrations', () => {
    const db = openDatabase(IN_MEMORY);

    expect(runMigrations(db)).toEqual(['001_initial']);
    expect(tableNames(db)).toEqual(['departments', 'employees', 'migrations', 'sessions', 'users']);
  });

  it('is a no-op on an up-to-date database', () => {
    const db = createTestDb();

    expect(runMigrations(db)).toEqual([]);
  });

  it('rolls back a failing migration and does not record it', () => {
    const db = createTestDb();
    const broken = [
      { id: '999_broken', sql: 'CREATE TABLE half_done (id INTEGER); SELECT nope FROM missing;' },
    ];

    expect(() => runMigrations(db, broken)).toThrow();
    expect(tableNames(db)).not.toContain('half_done');
    expect(db.prepare("SELECT 1 FROM migrations WHERE id = '999_broken'").get()).toBeUndefined();
  });
});

describe('schema constraints', () => {
  it('enforces foreign keys', () => {
    const db = createTestDb();
    const insert = db.prepare(
      'INSERT INTO employees (full_name, full_name_search, position, department_id) VALUES (?, ?, ?, ?)',
    );

    expect(() => insert.run('Тест', 'тест', 'Тестировщик', 999)).toThrow(/FOREIGN KEY/);
  });

  it('enforces unique emails', () => {
    const db = createTestDb();
    const insert = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    insert.run('demo@example.com', 'hash');

    expect(() => insert.run('demo@example.com', 'hash')).toThrow(/UNIQUE/);
  });

  it('rejects values of the wrong type (STRICT tables)', () => {
    const db = createTestDb();

    expect(() =>
      db.prepare("INSERT INTO departments (id, name) VALUES ('abc', 'X')").run(),
    ).toThrow();
  });
});

describe('transaction', () => {
  it('rolls back every statement when the callback throws', () => {
    const db = createTestDb();

    expect(() =>
      transaction(db, () => {
        db.prepare("INSERT INTO departments (name) VALUES ('Временный')").run();
        throw new Error('boom');
      }),
    ).toThrow('boom');
    expect(db.prepare('SELECT COUNT(*) AS count FROM departments').get()?.count).toBe(0);
  });
});

describe('persistence', () => {
  let dir: string | undefined;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it('keeps data in the database file across restarts', () => {
    dir = mkdtempSync(join(tmpdir(), 'test-ers-'));
    const path = join(dir, 'nested', 'app.db');

    const first = openDatabase(path);
    runMigrations(first);
    seedDatabase(first);
    first
      .prepare(
        `INSERT INTO employees (full_name, full_name_search, position, department_id)
         VALUES ('Новый Сотрудник', 'новый сотрудник', 'Стажёр', 1)`,
      )
      .run();
    first.close();

    const second = openDatabase(path);
    expect(runMigrations(second)).toEqual([]);
    expect(seedDatabase(second)).toEqual({ employeesAdded: 0 });
    expect(second.prepare('SELECT COUNT(*) AS count FROM employees').get()?.count).toBe(6);
    second.close();
  });
});
