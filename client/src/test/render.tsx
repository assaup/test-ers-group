import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { App } from '../App';
import { AuthProvider } from '../auth/AuthProvider';

function CurrentLocation() {
  const location = useLocation();
  // Обычный div: у <output> неявная роль status, и он конфликтовал бы с уведомлениями
  return (
    <div data-testid="location">{decodeURIComponent(location.pathname + location.search)}</div>
  );
}

/** Всё приложение (роутинг + авторизация) по заданному адресу, как его видит пользователь. */
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
