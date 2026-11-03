import { PASSWORD_MIN_LENGTH, toFieldErrors } from '@test-ers/shared';
import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api/client';
import { errorMessage } from '../api/messages';
import { registerFormSchema } from '../auth/register-form';
import { useAuth } from '../auth/useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useFormFields } from '../hooks/useFormFields';

const INITIAL = { email: '', password: '', confirmPassword: '' };

export function RegisterPage() {
  const { register } = useAuth();
  const { values, bindForm, field, showErrors } = useFormFields(INITIAL);
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setFormError(undefined);

    const parsed = registerFormSchema.safeParse(values);
    if (!parsed.success) {
      showErrors(toFieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      await register({ email: parsed.data.email, password: parsed.data.password });
    } catch (error) {
      // EMAIL_TAKEN приходит с fields.email, поэтому ошибка встаёт под полем email
      if (error instanceof ApiError && Object.keys(error.fields).length > 0) {
        showErrors(error.fields);
      } else {
        setFormError(errorMessage(error));
      }
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Регистрация" subtitle="Создайте аккаунт для доступа к справочнику">
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
            autoComplete="new-password"
            placeholder="Придумайте пароль"
            hint={`Не меньше ${PASSWORD_MIN_LENGTH} символов`}
            {...field('password')}
          />
          <TextField
            label="Повторите пароль"
            type="password"
            autoComplete="new-password"
            placeholder="Повторите пароль"
            {...field('confirmPassword')}
          />
        </div>

        <div className="auth-form__actions">
          <Button type="submit" size="lg" block loading={submitting}>
            {submitting ? 'Создаём…' : 'Создать аккаунт'}
          </Button>
          <p className="auth-form__switch">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
