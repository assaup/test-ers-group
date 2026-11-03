import type { User } from '@test-ers/shared';
import type { Database } from '../../db/connection';
import { asNumber, asString } from '../../db/sqlite';

export type SessionsRepository = ReturnType<typeof createSessionsRepository>;

// Timestamps are compared inside SQLite with datetime('now'), so the format always matches
export function createSessionsRepository(db: Database) {
  const insert = db.prepare(
    "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, datetime('now', ?))",
  );
  const selectUser = db.prepare(`
    SELECT u.id, u.email
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > datetime('now')
  `);
  const deleteByHash = db.prepare('DELETE FROM sessions WHERE token_hash = ?');
  const deleteExpired = db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')");

  return {
    create(userId: number, tokenHash: string, ttlSeconds: number) {
      insert.run(userId, tokenHash, `+${ttlSeconds} seconds`);
    },

    findActiveUser(tokenHash: string): User | undefined {
      const row = selectUser.get(tokenHash);
      if (!row) return undefined;
      return { id: asNumber(row.id), email: asString(row.email) };
    },

    delete(tokenHash: string) {
      deleteByHash.run(tokenHash);
    },

    deleteExpired(): number {
      return Number(deleteExpired.run().changes);
    },
  };
}
