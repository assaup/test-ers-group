import type { LoginInput, RegisterInput, User } from '@test-ers/shared';
import { AppError } from '../../lib/errors';
import { hashPassword, verifyPassword } from '../../lib/password';
import { generateSessionToken, hashSessionToken } from '../../lib/session-token';
import type { SessionsRepository } from './sessions.repository';
import type { UsersRepository } from './users.repository';

interface AuthServiceDeps {
  users: UsersRepository;
  sessions: SessionsRepository;
  sessionTtlSeconds: number;
}

export interface AuthResult {
  user: User;
  token: string;
}

export type AuthService = ReturnType<typeof createAuthService>;

export function createAuthService({ users, sessions, sessionTtlSeconds }: AuthServiceDeps) {
  // Verifying against a real hash for unknown emails keeps response time
  // from revealing which emails are registered
  const dummyHash = hashPassword('timing-equalizer');

  function startSession(user: User): AuthResult {
    const token = generateSessionToken();
    sessions.create(user.id, hashSessionToken(token), sessionTtlSeconds);
    return { user, token };
  }

  return {
    async register({ email, password }: RegisterInput): Promise<AuthResult> {
      const user = users.create(email, await hashPassword(password));
      if (!user) {
        throw new AppError(409, 'EMAIL_TAKEN', 'Этот email уже зарегистрирован', {
          email: 'Этот email уже зарегистрирован',
        });
      }
      return startSession(user);
    },

    async login({ email, password }: LoginInput): Promise<AuthResult> {
      const user = users.findByEmail(email);
      const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
      if (!user || !valid) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Неверный email или пароль');
      }

      sessions.deleteExpired();
      return startSession({ id: user.id, email: user.email });
    },

    authenticate(token: string): User | undefined {
      return sessions.findActiveUser(hashSessionToken(token));
    },

    logout(token: string) {
      sessions.delete(hashSessionToken(token));
    },
  };
}
