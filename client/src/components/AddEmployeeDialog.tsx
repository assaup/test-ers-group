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
import { Alert } from './ui/Alert';
import { Button } from './ui/Button';
import { SelectField } from './ui/SelectField';
import { TextField } from './ui/TextField';
import './AddEmployeeDialog.css';

interface AddEmployeeDialogProps {
  open: boolean;
  departments: Department[];
  onClose: () => void;
  onCreated: (employee: Employee) => void;
}

const INITIAL = { fullName: '', position: '', departmentId: '' };

export function AddEmployeeDialog({
  open,
  departments,
  onClose,
  onCreated,
}: AddEmployeeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { values, bindForm, field, showErrors, reset } = useFormFields(INITIAL);
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  // <dialog> gives focus trapping, Esc and the backdrop for free; React only mirrors `open`
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleClosed() {
    reset();
    setFormError(undefined);
    setSubmitting(false);
    onClose();
  }

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
    try {
      const employee = await employeesApi.create(parsed.data);
      onCreated(employee);
    } catch (error) {
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
      onClick={(event) => {
        // A click on the backdrop lands on the <dialog> element itself
        if (event.target === event.currentTarget) event.currentTarget.close();
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
              onClick={() => dialogRef.current?.close()}
            >
              ×
            </button>
          </header>

          <div className="add-employee__body">
            {formError && <Alert>{formError}</Alert>}
            <TextField
              label="ФИО"
              required
              autoFocus
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
            <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
              Отмена
            </Button>
            <Button type="submit" loading={submitting}>
              {submitting ? 'Добавление…' : 'Добавить'}
            </Button>
          </footer>
        </form>
      )}
    </dialog>
  );
}
