import { Navigate, Outlet, useLocation } from 'react-router';
import { PageLoader } from '../components/ui/PageLoader';
import { useAuth } from './useAuth';

interface FromState {
  from?: string;
}

/** Маршруты для вошедших; остальные уходят на /login и возвращаются после входа. */
export function RequireAuth() {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === 'loading') return <PageLoader />;
  if (state.status === 'anonymous') {
    // После явного выхода следующий вошедший начинает с чистого листа, без страницы
    // и фильтров прошлого пользователя; после истёкшей сессии тот же пользователь вернётся обратно
    const from: FromState | undefined = state.loggedOut
      ? undefined
      : { from: location.pathname + location.search };
    return <Navigate to="/login" replace state={from} />;
  }
  return <Outlet />;
}

/** Страницы входа и регистрации: вошедшему пользователю там делать нечего. */
export function GuestOnly() {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === 'loading') return <PageLoader />;
  if (state.status === 'authenticated') {
    const from = (location.state as FromState | null)?.from;
    return <Navigate to={from ?? '/employees'} replace />;
  }
  return <Outlet />;
}
