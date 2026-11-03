import { join } from 'node:path';
import express, { Router } from 'express';

/**
 * Serves the built React app from the same origin as the API (production mode).
 * Any other GET outside /api gets index.html, so client-side routes survive a page reload.
 */
export function serveClient(clientDir: string) {
  const router = Router();

  // Vite puts a content hash into asset names, so they can be cached forever
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
