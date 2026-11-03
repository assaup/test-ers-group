import type { CreateEmployeeInput, Department, Employee } from '@test-ers/shared';
import { apiRequest } from './client';

export interface EmployeeFilters {
  search?: string;
  departmentId?: number | undefined;
}

export const employeesApi = {
  list: ({ search, departmentId }: EmployeeFilters, signal?: AbortSignal) =>
    apiRequest<{ items: Employee[] }>('/employees', {
      query: { search, departmentId },
      signal,
    }).then(({ items }) => items),

  create: (input: CreateEmployeeInput) =>
    apiRequest<{ employee: Employee }>('/employees', { method: 'POST', body: input }).then(
      ({ employee }) => employee,
    ),

  departments: (signal?: AbortSignal) =>
    apiRequest<{ items: Department[] }>('/departments', { signal }).then(({ items }) => items),
};
