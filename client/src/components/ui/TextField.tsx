import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import './Field.css';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
  /** Shown under the field; replaced by the error when there is one. */
  hint?: string;
  icon?: ReactNode;
}

export function TextField({
  label,
  error,
  hint,
  icon,
  required,
  className,
  ...rest
}: TextFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={cx('field', className)}>
      <label htmlFor={id} className="field__label">
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      <div className="field__control-wrap">
        {icon && <span className="field__icon">{icon}</span>}
        <input
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={cx(
            'field__control',
            icon ? 'field__control--with-icon' : false,
            error && 'field__control--invalid',
          )}
          {...rest}
        />
      </div>
      {message && (
        <span id={messageId} className={cx('field__message', error && 'field__message--error')}>
          {message}
        </span>
      )}
    </div>
  );
}
