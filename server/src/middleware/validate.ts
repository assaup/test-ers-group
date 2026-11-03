import { toFieldErrors } from '@test-ers/shared';
import type { z } from 'zod';
import { AppError } from '../lib/errors';

/** Разбирает данные запроса общей схемой; ошибки превращаются в 400 с сообщениями по полям. */
export function parseInput<Schema extends z.ZodType>(
  schema: Schema,
  data: unknown,
): z.output<Schema> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Проверьте правильность заполнения полей',
      toFieldErrors(result.error),
    );
  }
  return result.data;
}
