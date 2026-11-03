import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { controlAria } from './field-aria';
import { FieldShell } from './FieldShell';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hideLabel?: boolean;
  error?: string | undefined;
  hint?: string;
  icon?: ReactNode;
}

export function TextField({
  label,
  hideLabel,
  error,
  hint,
  icon,
  required,
  className,
  ...rest
}: TextFieldProps) {
  const id = useId();

  return (
    <FieldShell {...{ id, label, hideLabel, required, error, hint, className }}>
      {icon && <span className="field__icon">{icon}</span>}
      <input
        id={id}
        required={required}
        {...controlAria(id, error, hint)}
        className={cx(
          'field__control',
          icon ? 'field__control--with-icon' : false,
          error && 'field__control--invalid',
        )}
        {...rest}
      />
    </FieldShell>
  );
}
