import { normalizeForSearch } from '@test-ers/shared';
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

/**
 * Idempotent: departments are upserted, demo employees are added only into an empty table,
 * so restarting the server never duplicates data or overwrites what users added.
 */
export function seedDatabase(db: Database) {
  return transaction(db, () => {
    const insertDepartment = db.prepare('INSERT OR IGNORE INTO departments (name) VALUES (?)');
    for (const name of DEMO_DEPARTMENTS) {
      insertDepartment.run(name);
    }

    const employeeCount = Number(
      db.prepare('SELECT COUNT(*) AS count FROM employees').get()?.count,
    );
    if (employeeCount > 0) {
      return { employeesAdded: 0 };
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
    return { employeesAdded: DEMO_EMPLOYEES.length };
  });
}
