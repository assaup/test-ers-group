import { loginSchema, toFieldErrors } from '@test-ers/shared';
import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api/client';
import { errorMessage } from '../api/messages';
import { useAuth } from '../auth/useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useFormFields } from '../hooks/useFormFields';

const INITIAL = { email: '', password: '' };

export function LoginPage() {
  const { login } = useAuth();
  const { values, bindForm, field, showErrors } = useFormFields(INITIAL);
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setFormError(undefined);

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      showErrors(toFieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      // При успехе GuestOnly сам уводит со страницы, поэтому сбрасывать состояние не нужно
      await login(parsed.data);
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
    <AuthLayout title="Вход" subtitle="Справочник сотрудников компании">
      <form
        ref={bindForm}
        className="auth-form"
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
      >
        {formError && <Alert>{formError}</Alert>}

        <div className="auth-form__fields">
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="name@company.ru"
            autoFocus
            {...field('email')}
          />
          <TextField
            label="Пароль"
            type="password"
            autoComplete="current-password"
            placeholder="Введите пароль"
            {...field('password')}
          />
        </div>

        <div className="auth-form__actions">
          <Button type="submit" size="lg" block loading={submitting}>
            {submitting ? 'Входим…' : 'Войти'}
          </Button>
          <p className="auth-form__switch">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>

        <p className="auth-form__demo">
          Демо-доступ: <code>demo@example.com</code> / <code>demo12345</code>
        </p>
      </form>
    </AuthLayout>
  );
}
