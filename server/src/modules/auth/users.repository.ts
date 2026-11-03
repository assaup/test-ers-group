import type { User } from '@test-ers/shared';
import type { Database } from '../../db/connection';
import { asNumber, asString, isUniqueViolation } from '../../db/sqlite';

export interface UserWithPassword extends User {
  passwordHash: string;
}

export type UsersRepository = ReturnType<typeof createUsersRepository>;

export function createUsersRepository(db: Database) {
  const selectByEmail = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?');
  const insert = db.prepare(
    'INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id, email',
  );

  return {
    findByEmail(email: string): UserWithPassword | undefined {
      const row = selectByEmail.get(email);
      if (!row) return undefined;
      return {
        id: asNumber(row.id),
        email: asString(row.email),
        passwordHash: asString(row.password_hash),
      };
    },

    /** Возвращает `undefined`, если email уже занят. */
    create(email: string, passwordHash: string): User | undefined {
      try {
        const row = insert.get(email, passwordHash);
        return { id: asNumber(row?.id), email: asString(row?.email) };
      } catch (error) {
        if (isUniqueViolation(error)) return undefined;
        throw error;
      }
    },
  };
}
