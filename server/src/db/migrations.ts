export interface Migration {
  id: string;
  sql: string;
}

// Только дописываем: выпущенную миграцию не меняем, а добавляем новую
export const migrations: readonly Migration[] = [
  {
    id: '001_initial',
    sql: `
      CREATE TABLE users (
        id            INTEGER PRIMARY KEY,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at    TEXT NOT NULL DEFAULT (datetime('now'))
      ) STRICT;

      CREATE TABLE sessions (
        id         INTEGER PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      ) STRICT;

      CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

      CREATE TABLE departments (
        id   INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      ) STRICT;

      CREATE TABLE employees (
        id               INTEGER PRIMARY KEY,
        full_name        TEXT NOT NULL,
        full_name_search TEXT NOT NULL,
        position         TEXT NOT NULL,
        department_id    INTEGER NOT NULL REFERENCES departments (id),
        created_at       TEXT NOT NULL DEFAULT (datetime('now'))
      ) STRICT;

      CREATE INDEX employees_department_id_idx ON employees (department_id);
      CREATE INDEX employees_full_name_search_idx ON employees (full_name_search);
    `,
  },
];
