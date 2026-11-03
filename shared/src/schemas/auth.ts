import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const emailSchema = z
  .string({ error: 'Введите email' })
  .trim()
  .toLowerCase()
  .min(1, 'Введите email')
  .max(254, 'Слишком длинный email')
  .pipe(z.email('Введите корректный email'));

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: 'Введите пароль' })
    .min(PASSWORD_MIN_LENGTH, `Пароль должен быть не короче ${PASSWORD_MIN_LENGTH} символов`)
    .max(PASSWORD_MAX_LENGTH, `Пароль должен быть не длиннее ${PASSWORD_MAX_LENGTH} символов`),
});

// Login doesn't re-check password rules: a wrong password is just INVALID_CREDENTIALS
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: 'Введите пароль' })
    .min(1, 'Введите пароль')
    .max(PASSWORD_MAX_LENGTH, 'Неверный email или пароль'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
