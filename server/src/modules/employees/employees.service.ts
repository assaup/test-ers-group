import type { CreateEmployeeInput, Employee, EmployeesQuery } from '@test-ers/shared';
import { AppError } from '../../lib/errors';
import type { DepartmentsRepository } from '../departments/departments.repository';
import type { EmployeesRepository } from './employees.repository';

interface EmployeesServiceDeps {
  employees: EmployeesRepository;
  departments: DepartmentsRepository;
}

export type EmployeesService = ReturnType<typeof createEmployeesService>;

export function createEmployeesService({ employees, departments }: EmployeesServiceDeps) {
  return {
    list(query: EmployeesQuery): Employee[] {
      return employees.list(query);
    },

    create(input: CreateEmployeeInput): Employee {
      // Проверяем явно (а не по ошибке внешнего ключа), чтобы указать форме на нужное поле
      if (!departments.findById(input.departmentId)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Проверьте правильность заполнения полей', {
          departmentId: 'Такого отдела нет',
        });
      }
      return employees.create(input);
    },
  };
}
