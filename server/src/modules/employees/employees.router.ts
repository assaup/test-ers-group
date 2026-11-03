import { createEmployeeSchema, employeesQuerySchema } from '@test-ers/shared';
import { Router } from 'express';
import { parseInput } from '../../middleware/validate';
import type { EmployeesService } from './employees.service';

export function createEmployeesRouter(employeesService: EmployeesService) {
  const router = Router();

  router.get('/', (req, res) => {
    const query = parseInput(employeesQuerySchema, req.query);
    res.json({ items: employeesService.list(query) });
  });

  router.post('/', (req, res) => {
    const input = parseInput(createEmployeeSchema, req.body);
    res.status(201).json({ employee: employeesService.create(input) });
  });

  return router;
}
