import type { User } from '@test-ers/shared';
import { parseCookie } from 'cookie';
import type { Request, RequestHandler } from 'express';
import { AppError } from '../lib/errors';
import { SESSION_COOKIE } from '../lib/session-token';
import type { AuthService } from '../modules/auth/auth.service';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

export function readSessionToken(req: Request): string | undefined {
  return parseCookie(req.headers.cookie ?? '')[SESSION_COOKIE];
}

export function createRequireAuth(authService: AuthService): RequestHandler {
  return (req, _res, next) => {
    const token = readSessionToken(req);
    const user = token ? authService.authenticate(token) : undefined;
    if (!user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Требуется вход в систему'));
      return;
    }
    req.user = user;
    next();
  };
}

/** For handlers behind requireAuth: the user is guaranteed to be set. */
export function getAuthUser(req: Request): User {
  if (!req.user) {
    throw new Error('getAuthUser() called on a route without requireAuth');
  }
  return req.user;
}
