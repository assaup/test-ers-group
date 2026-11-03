import { ApiError, type ClientErrorCode } from './client';

// Текст для пользователя выбирается по коду ошибки, а не берётся из сообщения сервера как есть
const MESSAGES: Partial<Record<ClientErrorCode, string>> = {
  INVALID_CREDENTIALS: 'Неверный email или пароль',
  EMAIL_TAKEN: 'Этот email уже зарегистрирован',
  VALIDATION_ERROR: 'Проверьте правильность заполнения полей',
  TOO_MANY_REQUESTS: 'Слишком много попыток. Подождите несколько минут',
  UNAUTHORIZED: 'Сессия истекла. Войдите снова',
  NETWORK_ERROR: 'Нет связи с сервером. Проверьте подключение',
};

const FALLBACK = 'Что-то пошло не так. Попробуйте ещё раз';

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return MESSAGES[error.code] ?? FALLBACK;
  return FALLBACK;
}
