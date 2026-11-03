import { Navigate, Outlet, useLocation } from 'react-router';
import { PageLoader } from '../components/ui/PageLoader';
import { useAuth } from './useAuth';

interface FromState {
  from?: string;
}

/** Routes for signed-in users; everyone else goes to /login and comes back after. */
export function RequireAuth() {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === 'loading') return <PageLoader />;
  if (state.status === 'anonymous') {
    // After an explicit logout the next person to sign in starts fresh, without the
    // previous user's page and filters; an expired session brings the same user back
    const from: FromState | undefined = state.loggedOut
      ? undefined
      : { from: location.pathname + location.search };
    return <Navigate to="/login" replace state={from} />;
  }
  return <Outlet />;
}

/** Login and register pages: a signed-in user has nothing to do there. */
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
