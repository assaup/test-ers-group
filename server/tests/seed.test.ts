import { describe, expect, it } from 'vitest';
import { DEMO_DEPARTMENTS, DEMO_EMPLOYEES, DEMO_USER, seedDatabase } from '../src/db/seed';
import { verifyPassword } from '../src/lib/password';
import { createTestDb } from './helpers';

function count(db: ReturnType<typeof createTestDb>, table: 'departments' | 'employees' | 'users') {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count;
}

describe('seedDatabase', () => {
  it('adds the demo departments, five demo employees and the demo user', async () => {
    const db = createTestDb();

    expect(await seedDatabase(db)).toEqual({ employeesAdded: 5, demoUserAdded: true });
    expect(count(db, 'departments')).toBe(DEMO_DEPARTMENTS.length);
    expect(count(db, 'employees')).toBe(5);
    expect(count(db, 'users')).toBe(1);
  });

  it('links every employee to the right department', async () => {
    const db = createTestDb();
    await seedDatabase(db);

    const rows = db
      .prepare(
        `SELECT e.full_name AS fullName, e.position, d.name AS department
         FROM employees e JOIN departments d ON d.id = e.department_id
         ORDER BY e.id`,
      )
      .all();
    expect(rows).toEqual(DEMO_EMPLOYEES);
  });

  it('stores a normalized search column', async () => {
    const db = createTestDb();
    await seedDatabase(db);

    const row = db
      .prepare("SELECT full_name_search FROM employees WHERE full_name LIKE 'Фёдорова%'")
      .get();
    expect(row?.full_name_search).toBe('федорова мария андреевна');
  });

  it('stores the demo password as a scrypt hash', async () => {
    const db = createTestDb();
    await seedDatabase(db);

    const row = db.prepare('SELECT password_hash FROM users WHERE email = ?').get(DEMO_USER.email);
    const hash = String(row?.password_hash);
    expect(hash).toMatch(/^scrypt\$/);
    expect(await verifyPassword(DEMO_USER.password, hash)).toBe(true);
  });

  it('is idempotent across restarts', async () => {
    const db = createTestDb();
    await seedDatabase(db);

    expect(await seedDatabase(db)).toEqual({ employeesAdded: 0, demoUserAdded: false });
    expect(count(db, 'departments')).toBe(DEMO_DEPARTMENTS.length);
    expect(count(db, 'employees')).toBe(5);
    expect(count(db, 'users')).toBe(1);
  });

  it('does not re-add demo employees once the table has data', async () => {
    const db = createTestDb();
    await seedDatabase(db);
    db.exec('DELETE FROM employees WHERE id > 1');

    expect(await seedDatabase(db)).toMatchObject({ employeesAdded: 0 });
    expect(count(db, 'employees')).toBe(1);
  });
});
