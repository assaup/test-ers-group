import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { apiRequest } from '../api/client';
import { apiError, demoUser, mockApi, signedIn, signedOut } from '../test/fake-api';
import { renderApp } from '../test/render';

const employees = { status: 200, body: { items: [] } };
const departments = { status: 200, body: { items: [] } };

describe('routing', () => {
  it('sends anonymous users to the login page', async () => {
    mockApi({ 'GET /api/auth/me': signedOut });

    renderApp('/employees');

    expect(await screen.findByRole('heading', { name: 'Вход' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });

  it('sends signed-in users from the login page to the list', async () => {
    mockApi({
      'GET /api/auth/me': signedIn,
      'GET /api/employees': employees,
      'GET /api/departments': departments,
    });

    renderApp('/login');

    expect(await screen.findByRole('heading', { name: 'Сотрудники' })).toBeInTheDocument();
    expect(screen.getByText(demoUser.email)).toBeInTheDocument();
  });

  it('redirects unknown URLs to the list', async () => {
    mockApi({ 'GET /api/auth/me': signedOut });

    renderApp('/nowhere');

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/login');
    });
  });
});

describe('LoginPage', () => {
  it('validates fields before calling the API and focuses the first invalid one', async () => {
    const { calls } = mockApi({ 'GET /api/auth/me': signedOut });
    const { user } = renderApp('/login');

    await user.click(await screen.findByRole('button', { name: 'Войти' }));

    const email = screen.getByLabelText('Email');
    expect(email).toHaveAccessibleDescription('Введите email');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveFocus();
    expect(screen.getByLabelText('Пароль')).toHaveAccessibleDescription('Введите пароль');
    expect(calls.filter((call) => call.path === '/api/auth/login')).toHaveLength(0);
  });

  it('clears a field error as soon as the user edits the field', async () => {
    mockApi({ 'GET /api/auth/me': signedOut });
    const { user } = renderApp('/login');
    await user.click(await screen.findByRole('button', { name: 'Войти' }));

    await user.type(screen.getByLabelText('Email'), 'a');

    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText('Пароль')).toHaveAttribute('aria-invalid', 'true');
  });

  it('logs in and returns to the page the user wanted', async () => {
    const { calls } = mockApi({
      'GET /api/auth/me': signedOut,
      'POST /api/auth/login': signedIn,
      'GET /api/employees': employees,
      'GET /api/departments': departments,
    });
    const { user } = renderApp('/employees?q=иван');

    await user.type(await screen.findByLabelText('Email'), ' Demo@Example.com ');
    await user.type(screen.getByLabelText('Пароль'), 'demo12345');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByRole('heading', { name: 'Сотрудники' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/employees?q=иван');
    expect(calls.find((call) => call.path === '/api/auth/login')?.body).toEqual({
      email: 'demo@example.com',
      password: 'demo12345',
    });
  });

  it('shows the error above the form for wrong credentials', async () => {
    mockApi({
      'GET /api/auth/me': signedOut,
      'POST /api/auth/login': apiError(401, 'INVALID_CREDENTIALS'),
    });
    const { user } = renderApp('/login');

    await user.type(await screen.findByLabelText('Email'), 'demo@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный email или пароль');
    expect(screen.getByRole('button', { name: 'Войти' })).toBeEnabled();
  });

  it('tells the user when the rate limit kicks in', async () => {
    mockApi({
      'GET /api/auth/me': signedOut,
      'POST /api/auth/login': apiError(429, 'TOO_MANY_REQUESTS'),
    });
    const { user } = renderApp('/login');

    await user.type(await screen.findByLabelText('Email'), 'demo@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'x');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Слишком много попыток');
  });

  it('links to registration', async () => {
    mockApi({ 'GET /api/auth/me': signedOut });
    const { user } = renderApp('/login');

    await user.click(await screen.findByRole('link', { name: 'Зарегистрироваться' }));

    expect(await screen.findByRole('heading', { name: 'Регистрация' })).toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  async function fillForm(
    user: ReturnType<typeof renderApp>['user'],
    { email = 'new@example.com', password = 'secret123', confirm = 'secret123' } = {},
  ) {
    await user.type(await screen.findByLabelText('Email'), email);
    await user.type(screen.getByLabelText('Пароль'), password);
    await user.type(screen.getByLabelText('Повторите пароль'), confirm);
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));
  }

  it('checks that passwords match and are long enough', async () => {
    mockApi({ 'GET /api/auth/me': signedOut });
    const { user } = renderApp('/register');

    await fillForm(user, { password: '1234', confirm: '12345' });

    expect(screen.getByLabelText('Пароль')).toHaveAccessibleDescription(
      'Пароль должен быть не короче 8 символов',
    );
    expect(screen.getByLabelText('Повторите пароль')).toHaveAccessibleDescription(
      'Пароли не совпадают',
    );
  });

  it('shows the password hint until there is an error', async () => {
    mockApi({ 'GET /api/auth/me': signedOut });
    renderApp('/register');

    expect(await screen.findByLabelText('Пароль')).toHaveAccessibleDescription(
      'Не меньше 8 символов',
    );
  });

  it('puts "email taken" under the email field', async () => {
    mockApi({
      'GET /api/auth/me': signedOut,
      'POST /api/auth/register': apiError(409, 'EMAIL_TAKEN', {
        email: 'Этот email уже зарегистрирован',
      }),
    });
    const { user } = renderApp('/register');

    await fillForm(user);

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
        'Этот email уже зарегистрирован',
      );
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('registers without sending the confirmation field and opens the list', async () => {
    const { calls } = mockApi({
      'GET /api/auth/me': signedOut,
      'POST /api/auth/register': {
        status: 201,
        body: { user: { id: 2, email: 'new@example.com' } },
      },
      'GET /api/employees': employees,
      'GET /api/departments': departments,
    });
    const { user } = renderApp('/register');

    await fillForm(user);

    expect(await screen.findByRole('heading', { name: 'Сотрудники' })).toBeInTheDocument();
    expect(calls.find((call) => call.path === '/api/auth/register')?.body).toEqual({
      email: 'new@example.com',
      password: 'secret123',
    });
  });

  it('shows a network problem above the form', async () => {
    mockApi({
      'GET /api/auth/me': signedOut,
      'POST /api/auth/register': () => {
        throw new TypeError('Failed to fetch');
      },
    });
    const { user } = renderApp('/register');

    await fillForm(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Нет связи с сервером');
  });
});

describe('logout', () => {
  it('signs out from the header and returns to the login page', async () => {
    const { calls } = mockApi({
      'GET /api/auth/me': signedIn,
      'GET /api/employees': employees,
      'GET /api/departments': departments,
      'POST /api/auth/logout': { status: 204 },
    });
    const { user } = renderApp('/employees');

    await user.click(await screen.findByRole('button', { name: 'Выйти' }));

    expect(await screen.findByRole('heading', { name: 'Вход' })).toBeInTheDocument();
    expect(calls.some((call) => call.path === '/api/auth/logout')).toBe(true);
  });

  it('signs out when any request reports an expired session', async () => {
    mockApi({
      'GET /api/auth/me': signedIn,
      'GET /api/employees': signedOut,
      'GET /api/departments': signedOut,
    });

    renderApp('/employees');

    // Any request will do: the client reacts to the 401 itself
    await screen.findByRole('heading', { name: 'Сотрудники' });
    await apiRequest('/employees').catch(() => undefined);

    expect(await screen.findByRole('heading', { name: 'Вход' })).toBeInTheDocument();
  });
});
