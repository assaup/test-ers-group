import express, { type RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { config } from './config';
import type { Database } from './db/connection';
import { AppError } from './lib/errors';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { createRequireAuth } from './middleware/require-auth';
import { serveClient } from './middleware/serve-client';
import { createAuthRouter } from './modules/auth/auth.router';
import { createAuthService } from './modules/auth/auth.service';
import { createSessionsRepository } from './modules/auth/sessions.repository';
import { createUsersRepository } from './modules/auth/users.repository';
import { createDepartmentsRepository } from './modules/departments/departments.repository';
import { createDepartmentsRouter } from './modules/departments/departments.router';
import { createEmployeesRepository } from './modules/employees/employees.repository';
import { createEmployeesRouter } from './modules/employees/employees.router';
import { createEmployeesService } from './modules/employees/employees.service';

export interface AppDeps {
  db: Database;
  secureCookies?: boolean;
  sessionTtlSeconds?: number;
  /** Requests per IP per 15 minutes on login/register; `false` disables the limit (tests). */
  authRateLimit?: number | false;
  /** Built client to serve alongside the API; omitted in development (Vite serves it). */
  clientDir?: string | undefined;
}

export function createApp({
  db,
  secureCookies = config.secureCookies,
  sessionTtlSeconds = config.sessionTtlSeconds,
  authRateLimit = config.authRateLimit,
  clientDir,
}: AppDeps) {
  const authService = createAuthService({
    users: createUsersRepository(db),
    sessions: createSessionsRepository(db),
    sessionTtlSeconds,
  });
  const requireAuth = createRequireAuth(authService);
  const departments = createDepartmentsRepository(db);
  const employeesService = createEmployeesService({
    employees: createEmployeesRepository(db),
    departments,
  });

  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok' });
  });

  app.use(
    '/api/auth',
    createAuthRouter({
      authService,
      requireAuth,
      rateLimit: createAuthRateLimit(authRateLimit),
      sessionTtlSeconds,
      secureCookies,
    }),
  );

  app.use('/api/departments', requireAuth, createDepartmentsRouter(departments));
  app.use('/api/employees', requireAuth, createEmployeesRouter(employeesService));

  app.use('/api', notFoundHandler);
  if (clientDir) {
    app.use(serveClient(clientDir));
  }
  app.use(errorHandler);

  return app;
}

function createAuthRateLimit(limit: number | false): RequestHandler {
  if (limit === false) {
    return (_req, _res, next) => {
      next();
    };
  }
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new AppError(429, 'TOO_MANY_REQUESTS', 'Слишком много попыток, попробуйте позже'));
    },
  });
}
