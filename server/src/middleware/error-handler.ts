import type { ApiErrorBody } from '@test-ers/shared';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppError } from '../lib/errors';

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', 'Маршрут не найден'));
};

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const appError = toAppError(error);
  if (!appError) {
    console.error(error);
  }

  const { status, code, message, fields } =
    appError ?? new AppError(500, 'INTERNAL_ERROR', 'Внутренняя ошибка сервера');

  const body: ApiErrorBody = { error: { code, message, ...(fields && { fields }) } };
  res.status(status).json(body);
}

function toAppError(error: unknown): AppError | undefined {
  if (error instanceof AppError) return error;

  // express.json() rejects malformed bodies with a body-parser error
  if (isBodyParserError(error, 'entity.parse.failed')) {
    return new AppError(400, 'VALIDATION_ERROR', 'Некорректный JSON в теле запроса');
  }
  if (isBodyParserError(error, 'entity.too.large')) {
    return new AppError(413, 'VALIDATION_ERROR', 'Слишком большой запрос');
  }
  return undefined;
}

function isBodyParserError(error: unknown, type: string) {
  return error instanceof Error && 'type' in error && error.type === type;
}
