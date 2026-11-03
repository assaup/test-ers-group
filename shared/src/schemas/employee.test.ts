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

  it.each(['0', '-1', '1.5', '01', '0x1', '1e0', ' 2 ', '1234567890'])(
    'accepts only a plain positive integer as departmentId, not %j',
    (departmentId) => {
      const result = employeesQuerySchema.safeParse({ departmentId });

      expect(result.success ? {} : toFieldErrors(result.error)).toEqual({
        departmentId: 'Некорректный отдел',
      });
    },
  );

  it('explains a too long search in Russian', () => {
    const result = employeesQuerySchema.safeParse({ search: 'я'.repeat(101) });

    expect(result.success ? {} : toFieldErrors(result.error)).toEqual({
      search: 'Слишком длинный поисковый запрос',
    });
  });
});

describe('error messages', () => {
  const cyrillic = /[а-яё]/i;

  it.each([
    ['create: no body', createEmployeeSchema, undefined],
    ['create: wrong types', createEmployeeSchema, { fullName: 5, position: [], departmentId: '1' }],
    ['query: not an object', employeesQuerySchema, 'search=1'],
    [
      'query: repeated parameters',
      employeesQuerySchema,
      { search: ['a', 'b'], departmentId: ['1'] },
    ],
  ])('are in Russian for %s', (_label, schema, input) => {
    const result = schema.safeParse(input);

    expect(result.success).toBe(false);
    for (const issue of result.error?.issues ?? []) {
      expect(issue.message).toMatch(cyrillic);
    }
  });
});
