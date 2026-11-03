import type { FieldErrors } from '@test-ers/shared';
import { useCallback, useEffect, useState, type ChangeEvent } from 'react';

/**
 * Состояние формы из текстовых полей: значения — строки, по одной ошибке на поле, фокус на
 * первом ошибочном поле после неудачной отправки. Сама валидация — в общих zod-схемах.
 */
export function useFormFields<Values extends Record<string, string>>(initial: Values) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [focusRequest, setFocusRequest] = useState(0);
  // Callback-ref хранится в состоянии: передавайте его как <form ref={bindForm}>
  const [formElement, bindForm] = useState<HTMLFormElement | null>(null);

  useEffect(() => {
    if (focusRequest === 0) return;
    formElement?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusRequest, formElement]);

  const setValue = useCallback((name: keyof Values & string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    // Правка поля убирает его ошибку; остальные остаются до следующей отправки
    setErrors(({ [name]: _removed, ...rest }) => rest);
  }, []);

  const showErrors = useCallback((next: FieldErrors) => {
    setErrors(next);
    setFocusRequest((count) => count + 1);
  }, []);

  const reset = useCallback(() => {
    setValues(initial);
    setErrors({});
  }, [initial]);

  /** Пропсы для TextField/SelectField, привязанного к `name`. */
  function field(name: keyof Values & string) {
    return {
      name,
      value: values[name],
      error: errors[name],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setValue(name, event.target.value);
      },
    };
  }

  return { values, errors, bindForm, field, setValue, showErrors, reset };
}
