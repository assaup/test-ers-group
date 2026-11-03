import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { App } from '../App';
import { AuthProvider } from '../auth/AuthProvider';

function CurrentLocation() {
  const location = useLocation();
  // A plain div: <output> has an implicit role="status" and would clash with toasts
  return (
    <div data-testid="location">{decodeURIComponent(location.pathname + location.search)}</div>
  );
}

/** The whole app (routing + auth) at a given URL, as the user would see it. */
export function renderApp(url = '/') {
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter initialEntries={[url]}>
      <AuthProvider>
        <App />
        <CurrentLocation />
      </AuthProvider>
    </MemoryRouter>,
  );
  return { user, ...result };
}
