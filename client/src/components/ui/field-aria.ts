export function messageId(id: string) {
  return `${id}-message`;
}

/** ARIA-связки для поля внутри FieldShell. */
export function controlAria(id: string, error: string | undefined, hint: string | undefined) {
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': (error ?? hint) ? messageId(id) : undefined,
  };
}
