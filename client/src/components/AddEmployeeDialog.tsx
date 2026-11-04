import {
  createEmployeeSchema,
  toFieldErrors,
  type Department,
  type Employee,
} from '@test-ers/shared';
import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { ApiError } from '../api/client';
import { employeesApi } from '../api/employees';
import { errorMessage } from '../api/messages';
import { useFormFields } from '../hooks/useFormFields';
import type { RemoteStatus } from '../hooks/useRemoteData';
import { Alert } from './ui/Alert';
import { Button } from './ui/Button';
import { SelectField } from './ui/SelectField';
import { TextField } from './ui/TextField';
import './AddEmployeeDialog.css';

interface AddEmployeeDialogProps {
  open: boolean;
  departments: Department[];
  departmentsStatus: RemoteStatus;
  onRetryDepartments: () => void;
  onClose: () => void;
  onCreated: (employee: Employee) => void;
}

const INITIAL = { fullName: '', position: '', departmentId: '' };

export function AddEmployeeDialog({
  open,
  departments,
  departmentsStatus,
  onRetryDepartments,
  onClose,
  onCreated,
}: AddEmployeeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Увеличивается при каждой отправке и каждом закрытии. По нему видно, что ответ пришёл уже
  // после закрытия диалога: такой ответ не должен трогать форму и следующий черновик
  const requestIdRef = useRef(0);
  const { values, bindForm, field, showErrors, reset } = useFormFields(INITIAL);
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  // <dialog> сам удерживает фокус, закрывается по Esc и рисует фон; React лишь отражает `open`
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal() фокусирует первый фокусируемый элемент (кнопку «×»); autoFocus из React
      // не помогает: он не ставит DOM-атрибут, который диалог мог бы найти
      dialog.querySelector('input')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function requestClose() {
    if (!submitting) dialogRef.current?.close();
  }

  function handleClosed() {
    requestIdRef.current += 1;
    reset();
    setFormError(undefined);
    setSubmitting(false);
    onClose();
  }

  const departmentsReady = departmentsStatus === 'success';

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setFormError(undefined);

    const parsed = createEmployeeSchema.safeParse({
      ...values,
      departmentId: values.departmentId ? Number(values.departmentId) : undefined,
    });
    if (!parsed.success) {
      showErrors(toFieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    const requestId = ++requestIdRef.current;
    try {
      const employee = await employeesApi.create(parsed.data);
      // Сотрудник уже сохранён, даже если диалог успели закрыть: страница всё равно должна
      // обновить список и показать уведомление, иначе пользователь добавит его ещё раз
      onCreated(employee);
      if (requestId === requestIdRef.current) dialogRef.current?.close();
    } catch (error) {
      // Ошибку показывать некуда: диалог закрыт, а в новом открытии она была бы чужой
      if (requestId !== requestIdRef.current) return;
      if (error instanceof ApiError && Object.keys(error.fields).length > 0) {
        showErrors(error.fields);
      } else {
        setFormError(errorMessage(error));
      }
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="add-employee"
      aria-labelledby="add-employee-title"
      onClose={handleClosed}
      onCancel={(event) => {
        // Esc во время сохранения: диалог остаётся, чтобы результату (или ошибке) было куда прийти
        if (submitting) event.preventDefault();
      }}
      onClick={(event) => {
        // Клик по фону приходится на сам элемент <dialog>
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      {open && (
        <form
          ref={bindForm}
          className="add-employee__form"
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
        >
          <header className="add-employee__header">
            <h2 id="add-employee-title" className="add-employee__title">
              Новый сотрудник
            </h2>
            <button
              type="button"
              className="add-employee__close"
              aria-label="Закрыть"
              disabled={submitting}
              onClick={requestClose}
            >
              ×
            </button>
          </header>

          <div className="add-employee__body">
            {formError && <Alert>{formError}</Alert>}
            {departmentsStatus === 'error' && (
              <Alert
                action={
                  <Button variant="text" size="sm" onClick={onRetryDepartments}>
                    Повторить
                  </Button>
                }
              >
                Не удалось загрузить список отделов
              </Alert>
            )}
            <TextField
              label="ФИО"
              required
              autoComplete="off"
              placeholder="Иванов Иван Иванович"
              {...field('fullName')}
            />
            <TextField
              label="Должность"
              required
              autoComplete="off"
              placeholder="Например, аналитик"
              {...field('position')}
            />
            <SelectField
              label="Отдел"
              required
              placeholder="Выберите отдел"
              options={departments.map((d) => ({ value: String(d.id), label: d.name }))}
              {...field('departmentId')}
            />
            <p className="add-employee__note">
              <span className="add-employee__star" aria-hidden="true">
                *
              </span>{' '}
              — обязательные поля
            </p>
          </div>

          <footer className="add-employee__footer">
            <Button variant="secondary" disabled={submitting} onClick={requestClose}>
              Отмена
            </Button>
            <Button type="submit" loading={submitting} disabled={!departmentsReady || submitting}>
              {submitting ? 'Добавление…' : 'Добавить'}
            </Button>
          </footer>
        </form>
      )}
    </dialog>
  );
}
