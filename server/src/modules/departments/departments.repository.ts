import type { Department } from '@test-ers/shared';
import type { Database } from '../../db/connection';
import { asNumber, asString } from '../../db/sqlite';

export type DepartmentsRepository = ReturnType<typeof createDepartmentsRepository>;

export function createDepartmentsRepository(db: Database) {
  const selectAll = db.prepare('SELECT id, name FROM departments ORDER BY name');
  const selectById = db.prepare('SELECT id, name FROM departments WHERE id = ?');

  return {
    list(): Department[] {
      return selectAll.all().map((row) => ({ id: asNumber(row.id), name: asString(row.name) }));
    },

    findById(id: number): Department | undefined {
      const row = selectById.get(id);
      return row ? { id: asNumber(row.id), name: asString(row.name) } : undefined;
    },
  };
}
