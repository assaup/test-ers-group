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
      // Checked explicitly (not via the FK error) to point the form at the right field
      if (!departments.findById(input.departmentId)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Проверьте правильность заполнения полей', {
          departmentId: 'Такого отдела нет',
        });
      }
      return employees.create(input);
    },
  };
}
