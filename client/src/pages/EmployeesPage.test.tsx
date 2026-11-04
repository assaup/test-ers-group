import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { apiError, mockApi, signedIn, type ApiCall } from '../test/fake-api';
import { DEPARTMENTS, fakeEmployeesBackend } from '../test/fake-employees';
import { renderApp } from '../test/render';

function rowNames() {
  return within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1) // строка заголовков
    .map((row) => within(row).getAllByRole('cell')[0]?.textContent);
}

function listCalls(calls: ApiCall[]) {
  return calls.filter((call) => call.method === 'GET' && call.path === '/api/employees');
}

describe('EmployeesPage: list', () => {
  it('shows employees with their position and department', async () => {
    mockApi(fakeEmployeesBackend().routes);

    renderApp('/employees');

    expect(await screen.findByText('Иванова Анна Сергеевна')).toBeInTheDocument();
    expect(screen.getByText('Найдено: 5')).toBeInTheDocument();
    const row = screen.getByText('Петров Дмитрий Олегович').closest('tr');
    expect(row).toHaveTextContent('Frontend-разработчик');
    expect(row).toHaveTextContent('Разработка');
  });

  it('shows a skeleton until the first response arrives', async () => {
    let respond: (() => void) | undefined;
    const { routes } = fakeEmployeesBackend();
    mockApi({
      ...routes,
      'GET /api/employees': (call) =>
        new Promise((resolve) => {
          respond = () => {
            resolve(routes['GET /api/employees'](call));
          };
        }),
    });

    renderApp('/employees');

    expect(await screen.findByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Иванова Анна Сергеевна')).not.toBeInTheDocument();
    respond?.();
    expect(await screen.findByText('Иванова Анна Сергеевна')).toBeInTheDocument();
  });

  it('offers a retry when loading fails', async () => {
    const { routes } = fakeEmployeesBackend();
    let failures = 1;
    mockApi({
      ...routes,
      'GET /api/employees': (call) =>
        failures-- > 0 ? apiError(500, 'INTERNAL_ERROR') : routes['GET /api/employees'](call),
    });
    const { user } = renderApp('/employees');

    expect(await screen.findByText('Не удалось загрузить список')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Повторить' }));

    expect(await screen.findByText('Иванова Анна Сергеевна')).toBeInTheDocument();
  });

  it('invites to add the first employee when the directory is empty', async () => {
    mockApi(fakeEmployeesBackend([]).routes);
    const { user } = renderApp('/employees');

    expect(await screen.findByText('Сотрудников пока нет')).toBeInTheDocument();
    const results = screen.getByRole('region', { name: 'Список сотрудников' });
    await user.click(within(results).getByRole('button', { name: 'Добавить сотрудника' }));

    expect(screen.getByRole('dialog', { name: 'Новый сотрудник' })).toBeVisible();
  });
});

describe('EmployeesPage: search and filter', () => {
  it('searches by full name after the user stops typing', async () => {
    const { calls } = mockApi(fakeEmployeesBackend().routes);
    const { user } = renderApp('/employees');
    await screen.findByText('Найдено: 5');

    await user.type(screen.getByRole('searchbox', { name: 'Поиск по ФИО' }), 'федор');

    await waitFor(() => {
      expect(rowNames()).toEqual(['Фёдорова Мария Андреевна']);
    });
    expect(screen.getByText('Найдено: 1')).toBeInTheDocument();
    // С задержкой: один запрос на всё слово, а не на каждое нажатие
    expect(listCalls(calls).map((call) => call.query.get('search'))).toEqual([null, 'федор']);
    expect(screen.getByTestId('location')).toHaveTextContent('/employees?q=федор');
  });

  it('filters by department and keeps the filter in the URL', async () => {
    const { calls } = mockApi(fakeEmployeesBackend().routes);
    const { user } = renderApp('/employees');
    await screen.findByText('Найдено: 5');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Отдел' }), 'Разработка');

    await waitFor(() => {
      expect(rowNames()).toEqual(['Иванова Анна Сергеевна', 'Петров Дмитрий Олегович']);
    });
    expect(listCalls(calls).at(-1)?.query.get('departmentId')).toBe('1');
    expect(screen.getByTestId('location')).toHaveTextContent('/employees?dept=1');
  });

  it('restores search and filter from the URL', async () => {
    const { calls } = mockApi(fakeEmployeesBackend().routes);

    renderApp('/employees?q=петр&dept=1');

    await waitFor(() => {
      expect(rowNames()).toEqual(['Петров Дмитрий Олегович']);
    });
    expect(screen.getByRole('searchbox', { name: 'Поиск по ФИО' })).toHaveValue('петр');
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Отдел' })).toHaveValue('1');
    });
    expect(listCalls(calls)[0]?.query.toString()).toBe(
      new URLSearchParams({ search: 'петр', departmentId: '1' }).toString(),
    );
  });

  it('says nobody was found and resets the filters', async () => {
    mockApi(fakeEmployeesBackend().routes);
    const { user } = renderApp('/employees?q=сидоров&dept=4');

    expect(await screen.findByText('Никого не нашли')).toBeInTheDocument();
    expect(screen.getByText('Найдено: 0')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));

    expect(await screen.findByText('Найдено: 5')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Поиск по ФИО' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Отдел' })).toHaveValue('');
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/employees$/);
  });

  it('never lets a slow outdated response overwrite a newer one', async () => {
    const { routes } = fakeEmployeesBackend();
    const pending: Record<string, () => void> = {};
    mockApi({
      ...routes,
      'GET /api/employees': (call) =>
        new Promise((resolve) => {
          pending[call.query.get('departmentId') ?? 'all'] = () => {
            resolve(routes['GET /api/employees'](call));
          };
        }),
    });
    const { user } = renderApp('/employees');
    await waitFor(() => {
      expect(pending.all).toBeDefined();
    });
    pending.all?.();
    await screen.findByText('Найдено: 5');

    const select = screen.getByRole('combobox', { name: 'Отдел' });
    await user.selectOptions(select, 'HR');
    await user.selectOptions(select, 'Аналитика');
    // Новый запрос (Аналитика) отвечает первым, устаревший (HR) — позже
    pending['3']?.();
    await screen.findByText('Кузнецов Алексей Игоревич');
    pending['2']?.();

    await waitFor(() => {
      expect(rowNames()).toEqual(['Кузнецов Алексей Игоревич']);
    });
  });
});

describe('EmployeesPage: filters from the URL', () => {
  it.each(['/employees?dept=0', `/employees?q=${'я'.repeat(101)}`, '/employees?dept=0x1'])(
    'ignores invalid filters in %s instead of showing an error',
    async (url) => {
      const { calls } = mockApi(fakeEmployeesBackend().routes);

      renderApp(url);

      expect(await screen.findByText('Найдено: 5')).toBeInTheDocument();
      expect(listCalls(calls).every((call) => call.query.toString() === '')).toBe(true);
      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent(/^\/employees$/);
      });
    },
  );

  it('drops a department that does not exist', async () => {
    mockApi(fakeEmployeesBackend().routes);

    renderApp('/employees?dept=999&q=ов');

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/employees\?q=ов$/);
    });
    expect(await screen.findByText('Найдено: 5')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Отдел' })).toHaveValue('');
  });

  it('limits the search field to what the API accepts', async () => {
    mockApi(fakeEmployeesBackend().routes);

    renderApp('/employees');

    expect(await screen.findByRole('searchbox', { name: 'Поиск по ФИО' })).toHaveAttribute(
      'maxlength',
      '100',
    );
  });

  it('explains a rejected filter instead of blaming the network', async () => {
    const { routes } = fakeEmployeesBackend();
    mockApi({
      ...routes,
      'GET /api/employees': (call) =>
        call.query.get('search')
          ? apiError(400, 'VALIDATION_ERROR', { search: 'Слишком длинный поисковый запрос' })
          : routes['GET /api/employees'](call),
    });
    const { user } = renderApp('/employees?q=иван');

    expect(await screen.findByText('Не удалось применить фильтры')).toBeInTheDocument();
    expect(screen.queryByText(/Проверьте подключение/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));

    expect(await screen.findByText('Найдено: 5')).toBeInTheDocument();
  });

  it('resets filters with a single request and no stale search', async () => {
    const { calls } = mockApi(fakeEmployeesBackend().routes);
    const { user } = renderApp('/employees?q=сидоров&dept=4');
    await screen.findByText('Никого не нашли');
    const before = listCalls(calls).length;

    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    await screen.findByText('Найдено: 5');
    // Ждём дольше задержки поиска, чтобы поймать запоздалый запрос со старым текстом
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(
      listCalls(calls)
        .slice(before)
        .map((call) => call.query.toString()),
    ).toEqual(['']);
  });

  it('never sends the old text after the search is cleared and retyped quickly', async () => {
    const { calls } = mockApi(fakeEmployeesBackend().routes);
    const { user } = renderApp('/employees');
    const searchbox = await screen.findByRole('searchbox', { name: 'Поиск по ФИО' });
    await screen.findByText('Найдено: 5');

    await user.type(searchbox, 'ива');
    await waitFor(() => {
      expect(rowNames()).toEqual(['Иванова Анна Сергеевна']);
    });
    // Очищаем и сразу, быстрее задержки поиска, вводим новый текст
    await user.clear(searchbox);
    await user.type(searchbox, 'смир');

    await waitFor(() => {
      expect(rowNames()).toEqual(['Смирнова Ольга Викторовна']);
    });
    await new Promise((resolve) => setTimeout(resolve, 400));
    const searches = listCalls(calls).map((call) => call.query.get('search'));
    expect(searches).toEqual([null, 'ива', null, 'смир']);
  });
});

describe('EmployeesPage: adding an employee', () => {
  async function openDialog() {
    const backend = fakeEmployeesBackend();
    const api = mockApi(backend.routes);
    const app = renderApp('/employees');
    await screen.findByText('Найдено: 5');
    await app.user.click(screen.getByRole('button', { name: 'Добавить сотрудника' }));
    const dialog = screen.getByRole('dialog', { name: 'Новый сотрудник' });
    return { ...app, ...api, backend, dialog };
  }

  it('requires every field and sends nothing until they are filled', async () => {
    const { user, dialog, calls } = await openDialog();

    await user.click(within(dialog).getByRole('button', { name: 'Добавить' }));

    expect(within(dialog).getByLabelText(/ФИО/)).toHaveAccessibleDescription('Укажите ФИО');
    expect(within(dialog).getByLabelText(/Должность/)).toHaveAccessibleDescription(
      'Укажите должность',
    );
    expect(within(dialog).getByRole('combobox', { name: /Отдел/ })).toHaveAccessibleDescription(
      'Выберите отдел',
    );
    expect(within(dialog).getByLabelText(/ФИО/)).toHaveFocus();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('adds the employee, closes the dialog, confirms and highlights the new row', async () => {
    const { user, dialog, calls } = await openDialog();

    await user.type(within(dialog).getByLabelText(/ФИО/), '  Соколов   Игорь Павлович ');
    await user.type(within(dialog).getByLabelText(/Должность/), 'Дизайнер');
    await user.selectOptions(within(dialog).getByRole('combobox', { name: /Отдел/ }), 'Маркетинг');
    await user.click(within(dialog).getByRole('button', { name: 'Добавить' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Сотрудник добавлен');
    expect(dialog).not.toBeVisible();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      fullName: 'Соколов Игорь Павлович',
      position: 'Дизайнер',
      departmentId: 5,
    });
    const newRow = (await screen.findByText('Соколов Игорь Павлович')).closest('tr');
    expect(newRow).toHaveClass('employee-table__row--new');
    expect(screen.getByText('Найдено: 6')).toBeInTheDocument();
  });

  it('shows server-side field errors in the dialog', async () => {
    const { user, dialog } = await openDialog();
    // Отдел, который исчез между загрузкой списка и отправкой формы
    const select = within(dialog).getByRole('combobox', { name: /Отдел/ });
    const ghost = document.createElement('option');
    ghost.value = '999';
    ghost.textContent = 'Удалённый отдел';
    select.append(ghost);

    await user.type(within(dialog).getByLabelText(/ФИО/), 'Новый Сотрудник');
    await user.type(within(dialog).getByLabelText(/Должность/), 'Стажёр');
    await user.selectOptions(select, '999');
    await user.click(within(dialog).getByRole('button', { name: 'Добавить' }));

    await waitFor(() => {
      expect(select).toHaveAccessibleDescription('Такого отдела нет');
    });
    expect(dialog).toBeVisible();
  });

  it('discards the draft on cancel', async () => {
    const { user, dialog } = await openDialog();
    await user.type(within(dialog).getByLabelText(/ФИО/), 'Черновик');

    await user.click(within(dialog).getByRole('button', { name: 'Отмена' }));
    expect(dialog).not.toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Добавить сотрудника' }));

    expect(within(dialog).getByLabelText(/ФИО/)).toHaveValue('');
  });

  it('lists every department in the dialog', async () => {
    const { dialog } = await openDialog();

    const options = within(within(dialog).getByRole('combobox', { name: /Отдел/ })).getAllByRole(
      'option',
    );
    expect(options.map((option) => option.textContent)).toEqual([
      'Выберите отдел',
      ...DEPARTMENTS.map((d) => d.name),
    ]);
  });
});

describe('EmployeesPage: dialog edge cases', () => {
  interface MockResponse {
    status: number;
    body?: unknown;
  }

  /** Открывает диалог и отправляет форму; сервер ответит, только когда тест вызовет finish(). */
  async function openWithSlowSave() {
    const { routes } = fakeEmployeesBackend();
    let release: ((response?: MockResponse) => void) | undefined;
    mockApi({
      ...routes,
      'POST /api/employees': (call) =>
        new Promise<MockResponse>((resolve) => {
          // Без аргумента запрос уходит в фейковый бэкенд и сотрудник действительно создаётся
          release = (response) => {
            resolve(response ?? routes['POST /api/employees'](call));
          };
        }),
    });
    const { user } = renderApp('/employees');
    await screen.findByText('Найдено: 5');
    await user.click(screen.getByRole('button', { name: 'Добавить сотрудника' }));
    const dialog = screen.getByRole('dialog', { name: 'Новый сотрудник' });
    await user.type(within(dialog).getByLabelText(/ФИО/), 'Новый Сотрудник');
    await user.type(within(dialog).getByLabelText(/Должность/), 'Стажёр');
    await user.selectOptions(within(dialog).getByRole('combobox', { name: /Отдел/ }), 'HR');
    await user.click(within(dialog).getByRole('button', { name: 'Добавить' }));
    return {
      user,
      dialog: dialog as HTMLDialogElement,
      finish: (response?: MockResponse) => release?.(response),
    };
  }

  it('cannot be closed while saving', async () => {
    const { user, dialog } = await openWithSlowSave();

    const escape = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(escape);
    await user.click(dialog); // клик по фону

    expect(escape.defaultPrevented).toBe(true);
    expect(within(dialog).getByRole('button', { name: 'Отмена' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Закрыть' })).toBeDisabled();
    expect(dialog).toBeVisible();
  });

  it('still confirms a save that finishes after the dialog was closed anyway', async () => {
    const { dialog, finish } = await openWithSlowSave();

    // Chrome закрывает модальное окно по повторному Esc, игнорируя preventDefault
    dialog.close();
    finish();

    expect(await screen.findByRole('status')).toHaveTextContent('Сотрудник добавлен');
    expect(await screen.findByText('Новый Сотрудник')).toBeInTheDocument();
    expect(screen.getByText('Найдено: 6')).toBeInTheDocument();
  });

  it('keeps a dialog reopened for the next employee when the previous save finishes', async () => {
    const { user, dialog, finish } = await openWithSlowSave();
    dialog.close();
    await user.click(screen.getByRole('button', { name: 'Добавить сотрудника' }));
    await user.type(within(dialog).getByLabelText(/ФИО/), 'Следующий');

    finish();

    expect(await screen.findByRole('status')).toHaveTextContent('Сотрудник добавлен');
    expect(dialog).toBeVisible();
    expect(within(dialog).getByLabelText(/ФИО/)).toHaveValue('Следующий');
  });

  it('drops an error that arrives after the dialog was closed anyway', async () => {
    const { user, dialog, finish } = await openWithSlowSave();

    // Браузер всё равно может принудительно закрыть модальное окно (например, повторный Esc)
    dialog.close();
    finish(apiError(500, 'INTERNAL_ERROR'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    await user.click(screen.getByRole('button', { name: 'Добавить сотрудника' }));

    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText(/ФИО/)).toHaveValue('');
  });

  it('shows a department loading failure in the dialog and lets the user retry', async () => {
    const { routes } = fakeEmployeesBackend();
    let failures = 1;
    mockApi({
      ...routes,
      'GET /api/departments': () =>
        failures-- > 0 ? apiError(500, 'INTERNAL_ERROR') : routes['GET /api/departments'],
    });
    const { user } = renderApp('/employees');
    await screen.findByText('Найдено: 5');

    await user.click(screen.getByRole('button', { name: 'Добавить сотрудника' }));
    const dialog = screen.getByRole('dialog', { name: 'Новый сотрудник' });

    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      'Не удалось загрузить список отделов',
    );
    expect(within(dialog).getByRole('button', { name: 'Добавить' })).toBeDisabled();

    await user.click(within(dialog).getByRole('button', { name: 'Повторить' }));

    await waitFor(() => {
      expect(within(dialog).getByRole('button', { name: 'Добавить' })).toBeEnabled();
    });
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
    expect(within(dialog).getAllByRole('option')).toHaveLength(DEPARTMENTS.length + 1);
  });
});

describe('EmployeesPage: session', () => {
  it('returns to the login page when the session expires', async () => {
    mockApi({
      'GET /api/auth/me': signedIn,
      'GET /api/departments': apiError(401, 'UNAUTHORIZED'),
      'GET /api/employees': apiError(401, 'UNAUTHORIZED'),
    });

    renderApp('/employees');

    expect(await screen.findByRole('heading', { name: 'Вход' })).toBeInTheDocument();
  });
});
