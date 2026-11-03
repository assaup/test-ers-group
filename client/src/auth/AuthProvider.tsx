import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth';
import { isAbortError, onUnauthorized } from '../api/client';
import { AuthContext, type AuthContextValue, type AuthState } from './context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  // The session cookie is httpOnly, so the only way to know who we are is to ask the server
  useEffect(() => {
    const controller = new AbortController();
    authApi
      .me(controller.signal)
      .then(({ user }) => {
        setState({ status: 'authenticated', user });
      })
      .catch((error: unknown) => {
        if (!isAbortError(error)) setState({ status: 'anonymous' });
      });
    return () => {
      controller.abort();
    };
  }, []);

  // Any 401 from any request (expired session, logout in another tab) signs the user out
  useEffect(
    () =>
      onUnauthorized(() => {
        setState({ status: 'anonymous' });
      }),
    [],
  );

  const login = useCallback<AuthContextValue['login']>(async (input) => {
    const { user } = await authApi.login(input);
    setState({ status: 'authenticated', user });
  }, []);

  const register = useCallback<AuthContextValue['register']>(async (input) => {
    const { user } = await authApi.register(input);
    setState({ status: 'authenticated', user });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Already logged out on the server — the local outcome is the same
    }
    setState({ status: 'anonymous' });
  }, []);

  const value = useMemo(
    () => ({ state, login, register, logout }),
    [state, login, register, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
