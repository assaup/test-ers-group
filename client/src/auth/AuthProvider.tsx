import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth';
import { isAbortError, onUnauthorized } from '../api/client';
import { AuthContext, type AuthContextValue, type AuthState } from './context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  // Cookie сессии httpOnly, поэтому узнать текущего пользователя можно только у сервера
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

  // Поднят, пока идёт явный выход, чтобы вызванный им ответ 401 тоже считался выходом
  const loggingOutRef = useRef(false);

  // Любой ответ 401 на любой запрос (сессия истекла, выход в другой вкладке) разлогинивает
  useEffect(
    () =>
      onUnauthorized(() => {
        setState({ status: 'anonymous', loggedOut: loggingOutRef.current });
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
    loggingOutRef.current = true;
    try {
      await authApi.logout();
    } catch {
      // На сервере сессии уже нет — результат для клиента тот же
    } finally {
      loggingOutRef.current = false;
    }
    setState({ status: 'anonymous', loggedOut: true });
  }, []);

  const value = useMemo(
    () => ({ state, login, register, logout }),
    [state, login, register, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
