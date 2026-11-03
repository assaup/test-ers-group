import express from 'express';
import helmet from 'helmet';
import type { Database } from './db/connection';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

export interface AppDeps {
  db: Database;
}

export function createApp({ db }: AppDeps) {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok' });
  });

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}
