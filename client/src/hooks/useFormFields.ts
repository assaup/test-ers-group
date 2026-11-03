import type { FieldErrors } from '@test-ers/shared';
import { useCallback, useEffect, useState, type ChangeEvent } from 'react';

/**
 * Text-field form state: values as strings, one error per field, focus on the first
 * invalid field after a failed submit. Validation itself stays in the shared zod schemas.
 */
export function useFormFields<Values extends Record<string, string>>(initial: Values) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [focusRequest, setFocusRequest] = useState(0);
  // Callback ref kept in state: pass it as <form ref={bindForm}>
  const [formElement, bindForm] = useState<HTMLFormElement | null>(null);

  useEffect(() => {
    if (focusRequest === 0) return;
    formElement?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusRequest, formElement]);

  const setValue = useCallback((name: keyof Values & string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    // Editing a field dismisses its error; the rest stay until the next submit
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

  /** Props for a TextField/SelectField bound to `name`. */
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
