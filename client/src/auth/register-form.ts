import { registerSchema } from '@test-ers/shared';
import { z } from 'zod';

// The server only needs email + password; "repeat password" is a client-side concern
export const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string().min(1, 'Повторите пароль') })
  .refine((form) => form.password === form.confirmPassword, {
    path: ['confirmPassword'],
    error: 'Пароли не совпадают',
  });
