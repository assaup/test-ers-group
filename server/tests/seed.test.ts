import { describe, expect, it } from 'vitest';
import { DEMO_DEPARTMENTS, DEMO_EMPLOYEES, seedDatabase } from '../src/db/seed';
import { createTestDb } from './helpers';

function count(db: ReturnType<typeof createTestDb>, table: 'departments' | 'employees') {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count;
}

describe('seedDatabase', () => {
  it('adds the demo departments and five demo employees', () => {
    const db = createTestDb();

    expect(seedDatabase(db)).toEqual({ employeesAdded: 5 });
    expect(count(db, 'departments')).toBe(DEMO_DEPARTMENTS.length);
    expect(count(db, 'employees')).toBe(5);
  });

  it('links every employee to the right department', () => {
    const db = createTestDb();
    seedDatabase(db);

    const rows = db
      .prepare(
        `SELECT e.full_name AS fullName, e.position, d.name AS department
         FROM employees e JOIN departments d ON d.id = e.department_id
         ORDER BY e.id`,
      )
      .all();
    expect(rows).toEqual(DEMO_EMPLOYEES);
  });

  it('stores a normalized search column', () => {
    const db = createTestDb();
    seedDatabase(db);

    const row = db
      .prepare("SELECT full_name_search FROM employees WHERE full_name LIKE 'Фёдорова%'")
      .get();
    expect(row?.full_name_search).toBe('федорова мария андреевна');
  });

  it('is idempotent across restarts', () => {
    const db = createTestDb();
    seedDatabase(db);

    expect(seedDatabase(db)).toEqual({ employeesAdded: 0 });
    expect(count(db, 'departments')).toBe(DEMO_DEPARTMENTS.length);
    expect(count(db, 'employees')).toBe(5);
  });

  it('does not re-add demo employees once the table has data', () => {
    const db = createTestDb();
    seedDatabase(db);
    db.exec('DELETE FROM employees WHERE id > 1');

    expect(seedDatabase(db)).toEqual({ employeesAdded: 0 });
    expect(count(db, 'employees')).toBe(1);
  });
});
