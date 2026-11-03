import { Router } from 'express';
import type { DepartmentsRepository } from './departments.repository';

export function createDepartmentsRouter(departments: DepartmentsRepository) {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json({ items: departments.list() });
  });

  return router;
}
