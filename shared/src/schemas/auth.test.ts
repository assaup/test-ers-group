import { describe, expect, it } from 'vitest';
import { toFieldErrors } from '../validation';
import { loginSchema, registerSchema } from './auth';

function fieldErrors(result: ReturnType<typeof registerSchema.safeParse>) {
  return result.success ? {} : toFieldErrors(result.error);
}

describe('registerSchema', () => {
  it('normalizes email to trimmed lowercase', () => {
    const result = registerSchema.parse({ email: '  Demo@Example.COM ', password: 'secret123' });
    expect(result.email).toBe('demo@example.com');
  });

  it('requires email and password', () => {
    expect(fieldErrors(registerSchema.safeParse({}))).toEqual({
      email: 'Введите email',
      password: 'Введите пароль',
    });
  });

  it('reports one message per field', () => {
    const errors = fieldErrors(registerSchema.safeParse({ email: '', password: '1' }));
    expect(errors).toEqual({
      email: 'Введите email',
      password: 'Пароль должен быть не короче 8 символов',
    });
  });

  it('rejects malformed email', () => {
    const errors = fieldErrors(
      registerSchema.safeParse({ email: 'not-an-email', password: 'secret123' }),
    );
    expect(errors).toEqual({ email: 'Введите корректный email' });
  });

  it('rejects passwords longer than 128 characters', () => {
    const result = registerSchema.safeParse({ email: 'a@b.ru', password: 'x'.repeat(129) });
    expect(result.success).toBe(false);
  });

  it('rejects a password made only of spaces', () => {
    const errors = fieldErrors(
      registerSchema.safeParse({ email: 'a@b.ru', password: ' '.repeat(8) }),
    );
    expect(errors).toEqual({ password: 'Пароль не может состоять только из пробелов' });
  });

  it('keeps spaces inside a password as typed', () => {
    const result = registerSchema.parse({ email: 'a@b.ru', password: ' my pass ' });
    expect(result.password).toBe(' my pass ');
  });

  it('reports a missing body in Russian', () => {
    expect(fieldErrors(registerSchema.safeParse(undefined))).toEqual({
      _: 'Некорректный формат запроса',
    });
  });
});

describe('loginSchema', () => {
  it('does not enforce the minimum password length', () => {
    expect(loginSchema.safeParse({ email: 'a@b.ru', password: '1' }).success).toBe(true);
  });

  it('requires a non-empty password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.ru', password: '' });
    expect(result.success ? {} : toFieldErrors(result.error)).toEqual({
      password: 'Введите пароль',
    });
  });
});
