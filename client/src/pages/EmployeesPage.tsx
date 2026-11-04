import { EMPLOYEE_TEXT_MAX_LENGTH, type Employee } from '@test-ers/shared';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ApiError } from '../api/client';
import { employeesApi } from '../api/employees';
import { AddEmployeeDialog } from '../components/AddEmployeeDialog';
import { AppHeader } from '../components/AppHeader';
import { EmployeeTable, EmployeeTableSkeleton } from '../components/EmployeeTable';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/ui/Button';
import { PlusIcon, SearchIcon } from '../components/ui/icons';
import { SelectField } from '../components/ui/SelectField';
import { TextField } from '../components/ui/TextField';
import { Toast } from '../components/ui/Toast';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useRemoteData } from '../hooks/useRemoteData';
import { filtersToParams, readFilters } from './employee-filters';
import './EmployeesPage.css';

const SEARCH_DEBOUNCE_MS = 300;
const HIGHLIGHT_MS = 2500;

export function EmployeesPage() {
  // Фильтры — состояние страницы: один раз читаются из адреса (?q=…&dept=…) и отражаются в нём,
  // поэтому переживают перезагрузку и ими можно поделиться. Адрес не становится вторым источником правды
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(() => readFilters(params).search);
  const [selectedDepartment, setSelectedDepartment] = useState(
    () => readFilters(params).departmentId,
  );
  const debouncedSearch = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  // Очистка применяется сразу: сброс не должен отправить ещё один запрос со старым текстом
  const search = searchInput.trim() ? debouncedSearch : '';

  const departments = useRemoteData(employeesApi.departments);
  // Несуществующий отдел (старая ссылка, ?dept=999) отбрасывается, как только список отделов
  // загружен; иначе страница писала бы «Никого не нашли», а в селекте было бы «Все отделы»
  const departmentExists =
    selectedDepartment === undefined ||
    !departments.data ||
    departments.data.some((department) => department.id === selectedDepartment);
  const departmentId = departmentExists ? selectedDepartment : undefined;

  // Отражаем применённые фильтры в адресе; заодно это убирает из него невалидные значения
  useEffect(() => {
    setParams(filtersToParams({ search, departmentId }), { replace: true });
  }, [search, departmentId, setParams]);

  const loadEmployees = useCallback(
    (signal: AbortSignal) => employeesApi.list({ search, departmentId }, signal),
    [search, departmentId],
  );
  const employees = useRemoteData(loadEmployees);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState<string>();
  const [highlightedId, setHighlightedId] = useState<number>();

  useEffect(() => {
    if (highlightedId === undefined) return;
    const timer = setTimeout(() => {
      setHighlightedId(undefined);
    }, HIGHLIGHT_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [highlightedId]);

  const closeToast = useCallback(() => {
    setToast(undefined);
  }, []);

  function resetFilters() {
    setSearchInput('');
    setSelectedDepartment(undefined);
  }

  // Диалог закрывается сам; здесь — только то, что касается списка. Ответ может прийти и после
  // закрытия, когда пользователь уже открыл диалог заново, — новый черновик это не трогает
  function handleCreated(employee: Employee) {
    setToast('Сотрудник добавлен');
    setHighlightedId(employee.id);
    employees.reload();
  }

  const hasFilters = Boolean(search || departmentId);
  const items = employees.data ?? [];

  return (
    <>
      <AppHeader />
      <main className="employees-page">
        <h1 className="employees-page__title">Сотрудники</h1>

        <div className="employees-page__toolbar" role="search">
          <TextField
            className="employees-page__search"
            label="Поиск по ФИО"
            hideLabel
            type="search"
            placeholder="Поиск по ФИО"
            icon={<SearchIcon />}
            maxLength={EMPLOYEE_TEXT_MAX_LENGTH}
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
            }}
          />
          <SelectField
            className="employees-page__department"
            label="Отдел"
            hideLabel
            placeholder="Все отделы"
            options={(departments.data ?? []).map((d) => ({ value: String(d.id), label: d.name }))}
            value={departmentId ? String(departmentId) : ''}
            onChange={(event) => {
              setSelectedDepartment(event.target.value ? Number(event.target.value) : undefined);
            }}
          />
          <Button
            className="employees-page__add"
            icon={<PlusIcon />}
            onClick={() => {
              setDialogOpen(true);
            }}
          >
            Добавить сотрудника
          </Button>
        </div>

        <p className="employees-page__count" aria-live="polite">
          {employees.status === 'loading' && !employees.data ? (
            <span className="skeleton employees-page__count-skeleton" aria-label="Загрузка" />
          ) : employees.status === 'error' ? null : (
            `Найдено: ${items.length}`
          )}
        </p>

        <section className="employees-page__results" aria-label="Список сотрудников">
          {employees.status === 'error' && isRejectedRequest(employees.error) ? (
            // Сервер отклонил сами фильтры: повтор того же запроса не поможет
            <EmptyState
              icon="!"
              tone="danger"
              title="Не удалось применить фильтры"
              text="Проверьте поисковый запрос или сбросьте фильтры."
              action={
                <Button variant="secondary" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
              }
            />
          ) : employees.status === 'error' ? (
            <EmptyState
              icon="!"
              tone="danger"
              title="Не удалось загрузить список"
              text="Проверьте подключение к сети и попробуйте ещё раз."
              action={
                <Button variant="secondary" onClick={employees.reload}>
                  Повторить
                </Button>
              }
            />
          ) : !employees.data ? (
            <EmployeeTableSkeleton />
          ) : items.length === 0 && hasFilters ? (
            <EmptyState
              icon="?"
              tone="neutral"
              title="Никого не нашли"
              text="Попробуйте изменить запрос или выбрать другой отдел."
              action={
                <Button variant="secondary" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
              }
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon="+"
              tone="accent"
              title="Сотрудников пока нет"
              text="Добавьте первого сотрудника — он появится в этом списке."
              action={
                <Button
                  icon={<PlusIcon />}
                  onClick={() => {
                    setDialogOpen(true);
                  }}
                >
                  Добавить сотрудника
                </Button>
              }
            />
          ) : (
            <EmployeeTable
              employees={items}
              highlightedId={highlightedId}
              stale={employees.status === 'loading'}
            />
          )}
        </section>
      </main>

      <AddEmployeeDialog
        open={dialogOpen}
        departments={departments.data ?? []}
        departmentsStatus={departments.status}
        onRetryDepartments={departments.reload}
        onClose={() => {
          setDialogOpen(false);
        }}
        onCreated={handleCreated}
      />
      {toast && <Toast message={toast} onClose={closeToast} />}
    </>
  );
}

function isRejectedRequest(error: unknown) {
  return error instanceof ApiError && error.status === 400;
}
