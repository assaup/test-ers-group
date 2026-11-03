import { z } from './zod';
import { collapseWhitespace } from '../normalize';
import { INVALID_BODY_MESSAGE } from './auth';

export const EMPLOYEE_TEXT_MAX_LENGTH = 100;

function requiredText(emptyMessage: string, tooLongMessage: string) {
  return z
    .string({ error: emptyMessage })
    .trim()
    .min(1, emptyMessage)
    .max(EMPLOYEE_TEXT_MAX_LENGTH, tooLongMessage)
    .transform(collapseWhitespace);
}

export const createEmployeeSchema = z.object(
  {
    fullName: requiredText('Укажите ФИО', 'ФИО должно быть не длиннее 100 символов'),
    position: requiredText('Укажите должность', 'Должность должна быть не длиннее 100 символов'),
    departmentId: z
      .number({ error: 'Выберите отдел' })
      .int('Выберите отдел')
      .positive('Выберите отдел'),
  },
  { error: INVALID_BODY_MESSAGE },
);

// Query string values arrive as strings; an empty value means "no filter"
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

const INVALID_DEPARTMENT = 'Некорректный отдел';

/** Shared by the API and by the client when it reads filters from the page URL. */
export const employeesQuerySchema = z.object(
  {
    search: z.preprocess(
      emptyToUndefined,
      z
        .string({ error: 'Некорректный поисковый запрос' })
        .trim()
        .max(EMPLOYEE_TEXT_MAX_LENGTH, 'Слишком длинный поисковый запрос')
        .optional(),
    ),
    // A plain positive integer only: Number() would also accept "0x1", "1e0" or " 2 "
    departmentId: z.preprocess(
      emptyToUndefined,
      z
        .string({ error: INVALID_DEPARTMENT })
        .regex(/^[1-9]\d{0,8}$/, INVALID_DEPARTMENT)
        .transform(Number)
        .optional(),
    ),
  },
  { error: 'Некорректные параметры запроса' },
);

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type EmployeesQuery = z.infer<typeof employeesQuerySchema>;
