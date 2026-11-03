import type { LoginInput, RegisterInput, User } from '@test-ers/shared';
import { createContext } from 'react';

export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  /** `loggedOut`: the user pressed "Выйти", as opposed to an expired or missing session. */
  | { status: 'anonymous'; loggedOut?: boolean };

export interface AuthContextValue {
  state: AuthState;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
