import { join } from 'node:path';
import express, { Router } from 'express';

/**
 * Отдаёт собранное React-приложение с того же адреса, что и API (production-режим).
 * Любой другой GET вне /api получает index.html, поэтому клиентские маршруты переживают перезагрузку.
 */
export function serveClient(clientDir: string) {
  const router = Router();

  // Vite добавляет хеш содержимого в имена ассетов, поэтому их можно кэшировать навсегда
  router.use(
    '/assets',
    express.static(join(clientDir, 'assets'), { immutable: true, maxAge: '1y', index: false }),
    (_req, res) => {
      res.status(404).end();
    },
  );
  router.use(express.static(clientDir, { index: false }));

  router.get(/^\/(?!api(?:\/|$))/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(join(clientDir, 'index.html'));
  });

  return router;
}
