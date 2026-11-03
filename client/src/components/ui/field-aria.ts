export function messageId(id: string) {
  return `${id}-message`;
}

/** ARIA wiring for the control inside a FieldShell. */
export function controlAria(id: string, error: string | undefined, hint: string | undefined) {
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': (error ?? hint) ? messageId(id) : undefined,
  };
}
