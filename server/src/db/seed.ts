import { normalizeForSearch } from '@test-ers/shared';
import { hashPassword } from '../lib/password';
import { transaction, type Database } from './connection';

export const DEMO_DEPARTMENTS = ['Разработка', 'HR', 'Аналитика', 'Финансы', 'Маркетинг'];

export const DEMO_EMPLOYEES = [
  { fullName: 'Иванова Анна Сергеевна', position: 'Руководитель отдела', department: 'Разработка' },
  {
    fullName: 'Петров Дмитрий Олегович',
    position: 'Frontend-разработчик',
    department: 'Разработка',
  },
  { fullName: 'Смирнова Ольга Викторовна', position: 'HR-менеджер', department: 'HR' },
  { fullName: 'Кузнецов Алексей Игоревич', position: 'Аналитик', department: 'Аналитика' },
  { fullName: 'Фёдорова Мария Андреевна', position: 'Бухгалтер', department: 'Финансы' },
];

// Published in the README and on the login screen — this is a demo account, not a secret
export const DEMO_USER = { email: 'demo@example.com', password: 'demo12345' };

/**
 * Idempotent: departments are upserted, demo employees are added only into an empty table,
 * so restarting the server never duplicates data or overwrites what users added.
 */
export async function seedDatabase(db: Database) {
  const demoUserExists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(DEMO_USER.email);
  // Hash before the transaction: scrypt is async and the transaction must stay synchronous
  const demoPasswordHash = demoUserExists ? undefined : await hashPassword(DEMO_USER.password);

  return transaction(db, () => {
    const demoUserAdded =
      demoPasswordHash !== undefined &&
      db
        .prepare('INSERT OR IGNORE INTO users (email, password_hash) VALUES (?, ?)')
        .run(DEMO_USER.email, demoPasswordHash).changes === 1;

    const insertDepartment = db.prepare('INSERT OR IGNORE INTO departments (name) VALUES (?)');
    for (const name of DEMO_DEPARTMENTS) {
      insertDepartment.run(name);
    }

    const employeeCount = Number(
      db.prepare('SELECT COUNT(*) AS count FROM employees').get()?.count,
    );
    if (employeeCount > 0) {
      return { employeesAdded: 0, demoUserAdded };
    }

    const insertEmployee = db.prepare(`
      INSERT INTO employees (full_name, full_name_search, position, department_id)
      SELECT ?, ?, ?, id FROM departments WHERE name = ?
    `);
    for (const employee of DEMO_EMPLOYEES) {
      insertEmployee.run(
        employee.fullName,
        normalizeForSearch(employee.fullName),
        employee.position,
        employee.department,
      );
    }
    return { employeesAdded: DEMO_EMPLOYEES.length, demoUserAdded };
  });
}
