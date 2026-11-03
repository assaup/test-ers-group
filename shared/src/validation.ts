import type { z } from 'zod';

export type FieldErrors = Record<string, string>;

/** First message per top-level field — what a form shows under each input. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    const field = key === undefined ? '_' : String(key);
    fields[field] ??= issue.message;
  }
  return fields;
}
