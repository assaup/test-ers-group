import type { z } from 'zod';

export type FieldErrors = Record<string, string>;

/** Первое сообщение для каждого поля верхнего уровня — то, что форма показывает под полем. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    const field = key === undefined ? '_' : String(key);
    fields[field] ??= issue.message;
  }
  return fields;
}
