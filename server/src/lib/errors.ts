import type { ErrorCode, FieldErrors } from '@test-ers/shared';

/** Ошибка, которую безопасно показать клиенту как есть. Любая другая превращается в 500. */
export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly fields: FieldErrors | undefined;

  constructor(status: number, code: ErrorCode, message: string, fields?: FieldErrors) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
