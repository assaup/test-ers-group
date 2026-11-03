import { z } from 'zod';
import { collapseWhitespace } from '../normalize';

export const EMPLOYEE_TEXT_MAX_LENGTH = 100;

function requiredText(emptyMessage: string, tooLongMessage: string) {
  return z
    .string({ error: emptyMessage })
    .trim()
    .min(1, emptyMessage)
    .max(EMPLOYEE_TEXT_MAX_LENGTH, tooLongMessage)
    .transform(collapseWhitespace);
}

export const createEmployeeSchema = z.object({
  fullName: requiredText('Укажите ФИО', 'ФИО должно быть не длиннее 100 символов'),
  position: requiredText('Укажите должность', 'Должность должна быть не длиннее 100 символов'),
  departmentId: z
    .number({ error: 'Выберите отдел' })
    .int('Выберите отдел')
    .positive('Выберите отдел'),
});

// Query string values arrive as strings; an empty value means "no filter"
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

export const employeesQuerySchema = z.object({
  search: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(EMPLOYEE_TEXT_MAX_LENGTH).optional(),
  ),
  departmentId: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type EmployeesQuery = z.infer<typeof employeesQuerySchema>;
