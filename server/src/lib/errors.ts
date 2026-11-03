import type { ErrorCode, FieldErrors } from '@test-ers/shared';

/** An error that is safe to show to the client as-is. Anything else becomes a 500. */
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
