import type { LoginInput, RegisterInput, User } from '@test-ers/shared';
import { apiRequest } from './client';

interface UserResponse {
  user: User;
}

export const authApi = {
  me: (signal?: AbortSignal) => apiRequest<UserResponse>('/auth/me', { signal }),
  login: (input: LoginInput) =>
    apiRequest<UserResponse>('/auth/login', { method: 'POST', body: input }),
  register: (input: RegisterInput) =>
    apiRequest<UserResponse>('/auth/register', { method: 'POST', body: input }),
  logout: () => apiRequest<undefined>('/auth/logout', { method: 'POST' }),
};
