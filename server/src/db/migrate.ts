import { transaction, type Database } from './connection';
import { migrations as defaultMigrations, type Migration } from './migrations';

/** Применяет новые миграции по порядку, каждую в своей транзакции. Возвращает их id. */
export function runMigrations(db: Database, migrations: readonly Migration[] = defaultMigrations) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id         TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    ) STRICT
  `);

  const applied = new Set(
    db
      .prepare('SELECT id FROM migrations')
      .all()
      .map((row) => String(row.id)),
  );
  const recordMigration = db.prepare('INSERT INTO migrations (id) VALUES (?)');

  const newlyApplied: string[] = [];
  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;

    transaction(db, () => {
      db.exec(migration.sql);
      recordMigration.run(migration.id);
    });
    newlyApplied.push(migration.id);
  }
  return newlyApplied;
}
