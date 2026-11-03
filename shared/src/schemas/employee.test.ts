import { describe, expect, it } from 'vitest';
import { toFieldErrors } from '../validation';
import { createEmployeeSchema, employeesQuerySchema } from './employee';

describe('createEmployeeSchema', () => {
  it('trims and collapses whitespace in text fields', () => {
    const result = createEmployeeSchema.parse({
      fullName: '  Иванова   Анна  Сергеевна ',
      position: ' Аналитик ',
      departmentId: 1,
    });
    expect(result).toEqual({
      fullName: 'Иванова Анна Сергеевна',
      position: 'Аналитик',
      departmentId: 1,
    });
  });

  it('requires every field', () => {
    const result = createEmployeeSchema.safeParse({ fullName: '   ', position: '' });
    expect(result.success ? {} : toFieldErrors(result.error)).toEqual({
      fullName: 'Укажите ФИО',
      position: 'Укажите должность',
      departmentId: 'Выберите отдел',
    });
  });

  it('rejects non-positive and fractional department ids', () => {
    for (const departmentId of [0, -1, 1.5]) {
      const result = createEmployeeSchema.safeParse({ fullName: 'А', position: 'Б', departmentId });
      expect(result.success ? {} : toFieldErrors(result.error)).toEqual({
        departmentId: 'Выберите отдел',
      });
    }
  });

  it('limits text length to 100 characters', () => {
    const result = createEmployeeSchema.safeParse({
      fullName: 'а'.repeat(101),
      position: 'Аналитик',
      departmentId: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe('employeesQuerySchema', () => {
  it('coerces departmentId from the query string', () => {
    expect(employeesQuerySchema.parse({ search: 'иван', departmentId: '2' })).toEqual({
      search: 'иван',
      departmentId: 2,
    });
  });

  it('treats empty values as no filter', () => {
    expect(employeesQuerySchema.parse({ search: '', departmentId: '' })).toEqual({});
  });

  it('rejects a non-numeric departmentId', () => {
    expect(employeesQuerySchema.safeParse({ departmentId: 'abc' }).success).toBe(false);
  });
});
