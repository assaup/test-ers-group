import { normalizeForSearch, type Employee } from '@test-ers/shared';
import type { SQLOutputValue } from 'node:sqlite';
import type { Database } from '../../db/connection';
import { asNumber, asString } from '../../db/sqlite';

export interface EmployeeFilter {
  search?: string | undefined;
  departmentId?: number | undefined;
}

export interface NewEmployee {
  fullName: string;
  position: string;
  departmentId: number;
}

export type EmployeesRepository = ReturnType<typeof createEmployeesRepository>;

const SELECT_EMPLOYEE = `
  SELECT e.id, e.full_name, e.position, d.id AS department_id, d.name AS department_name
  FROM employees e
  JOIN departments d ON d.id = e.department_id
`;

export function createEmployeesRepository(db: Database) {
  // Параметр NULL выключает фильтр, поэтому один подготовленный запрос покрывает все сочетания
  const selectFiltered = db.prepare(`
    ${SELECT_EMPLOYEE}
    WHERE ($search IS NULL OR e.full_name_search LIKE $search ESCAPE '\\')
      AND ($departmentId IS NULL OR e.department_id = $departmentId)
    ORDER BY e.full_name_search, e.id
  `);
  const selectById = db.prepare(`${SELECT_EMPLOYEE} WHERE e.id = ?`);
  const insert = db.prepare(`
    INSERT INTO employees (full_name, full_name_search, position, department_id)
    VALUES (?, ?, ?, ?)
    RETURNING id
  `);

  function findById(id: number): Employee | undefined {
    const row = selectById.get(id);
    return row ? toEmployee(row) : undefined;
  }

  return {
    list({ search, departmentId }: EmployeeFilter): Employee[] {
      const pattern = search ? `%${escapeLike(normalizeForSearch(search))}%` : null;
      return selectFiltered
        .all({ search: pattern, departmentId: departmentId ?? null })
        .map(toEmployee);
    },

    findById,

    create({ fullName, position, departmentId }: NewEmployee): Employee {
      // Колонка для поиска вычисляется здесь, поэтому никогда не разойдётся с full_name
      const row = insert.get(fullName, normalizeForSearch(fullName), position, departmentId);
      const employee = findById(asNumber(row?.id));
      if (!employee) throw new Error('Inserted employee not found');
      return employee;
    },
  };
}

/** Введённые пользователем `%` и `_` ищутся как обычные символы, а не как шаблоны LIKE. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

function toEmployee(row: Record<string, SQLOutputValue>): Employee {
  return {
    id: asNumber(row.id),
    fullName: asString(row.full_name),
    position: asString(row.position),
    department: { id: asNumber(row.department_id), name: asString(row.department_name) },
  };
}
