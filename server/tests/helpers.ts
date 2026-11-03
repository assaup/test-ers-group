import { IN_MEMORY, openDatabase } from '../src/db/connection';
import { runMigrations } from '../src/db/migrate';

/** A fresh migrated in-memory database — real SQLite, no mocks. */
export function createTestDb() {
  const db = openDatabase(IN_MEMORY);
  runMigrations(db);
  return db;
}
