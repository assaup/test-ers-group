import { normalizeForSearch, type Department, type Employee } from '@test-ers/shared';
import type { ApiCall } from './fake-api';
import { apiError, signedIn } from './fake-api';

export const DEPARTMENTS: Department[] = [
  { id: 1, name: 'Разработка' },
  { id: 2, name: 'HR' },
  { id: 3, name: 'Аналитика' },
  { id: 4, name: 'Финансы' },
  { id: 5, name: 'Маркетинг' },
];

const dept = (id: number) => DEPARTMENTS.find((d) => d.id === id) ?? { id, name: '?' };

export const SEED: Employee[] = [
  {
    id: 1,
    fullName: 'Иванова Анна Сергеевна',
    position: 'Руководитель отдела',
    department: dept(1),
  },
  {
    id: 2,
    fullName: 'Петров Дмитрий Олегович',
    position: 'Frontend-разработчик',
    department: dept(1),
  },
  { id: 3, fullName: 'Смирнова Ольга Викторовна', position: 'HR-менеджер', department: dept(2) },
  { id: 4, fullName: 'Кузнецов Алексей Игоревич', position: 'Аналитик', department: dept(3) },
  { id: 5, fullName: 'Фёдорова Мария Андреевна', position: 'Бухгалтер', department: dept(4) },
];

/** A tiny in-memory imitation of the employees API, with the same search rules. */
export function fakeEmployeesBackend(initial: Employee[] = SEED) {
  const employees = [...initial];

  return {
    employees,
    routes: {
      'GET /api/auth/me': signedIn,
      'GET /api/departments': { status: 200, body: { items: DEPARTMENTS } },
      'GET /api/employees': ({ query }: ApiCall) => {
        const search = normalizeForSearch(query.get('search') ?? '');
        const departmentId = Number(query.get('departmentId') ?? 0);
        const items = employees.filter(
          (e) =>
            (!search || normalizeForSearch(e.fullName).includes(search)) &&
            (!departmentId || e.department.id === departmentId),
        );
        return { status: 200, body: { items } };
      },
      'POST /api/employees': ({ body }: ApiCall) => {
        const input = body as { fullName: string; position: string; departmentId: number };
        if (!DEPARTMENTS.some((d) => d.id === input.departmentId)) {
          return apiError(400, 'VALIDATION_ERROR', { departmentId: 'Такого отдела нет' });
        }
        const employee = {
          id: employees.length + 100,
          fullName: input.fullName,
          position: input.position,
          department: dept(input.departmentId),
        };
        employees.push(employee);
        return { status: 201, body: { employee } };
      },
    },
  };
}
