import { registerSchema } from '@test-ers/shared';
import { z } from 'zod';

// Серверу нужны только email и пароль; «повторите пароль» — забота клиента
export const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string().min(1, 'Повторите пароль') })
  .refine((form) => form.password === form.confirmPassword, {
    path: ['confirmPassword'],
    error: 'Пароли не совпадают',
  });
