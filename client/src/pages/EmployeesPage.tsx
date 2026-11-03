import type { Employee } from '@test-ers/shared';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
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
import './EmployeesPage.css';

const SEARCH_DEBOUNCE_MS = 300;
const HIGHLIGHT_MS = 2500;

export function EmployeesPage() {
  // Filters live in the URL (?q=…&dept=…): they survive reloads and can be shared
  const [params, setParams] = useSearchParams();
  const departmentParam = params.get('dept') ?? '';
  const [searchInput, setSearchInput] = useState(() => params.get('q') ?? '');
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const departmentId = /^\d+$/.test(departmentParam) ? Number(departmentParam) : undefined;

  useEffect(() => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (search) next.set('q', search);
        else next.delete('q');
        return next;
      },
      { replace: true },
    );
  }, [search, setParams]);

  const loadEmployees = useCallback(
    (signal: AbortSignal) => employeesApi.list({ search, departmentId }, signal),
    [search, departmentId],
  );
  const employees = useRemoteData(loadEmployees);
  const departments = useRemoteData(employeesApi.departments);

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

  function handleDepartmentChange(value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set('dept', value);
        else next.delete('dept');
        return next;
      },
      { replace: true },
    );
  }

  function resetFilters() {
    setSearchInput('');
    setParams({}, { replace: true });
  }

  function handleCreated(employee: Employee) {
    setDialogOpen(false);
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
            value={departmentParam}
            onChange={(event) => {
              handleDepartmentChange(event.target.value);
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
          {employees.status === 'error' ? (
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
        onClose={() => {
          setDialogOpen(false);
        }}
        onCreated={handleCreated}
      />
      {toast && <Toast message={toast} onClose={closeToast} />}
    </>
  );
}
