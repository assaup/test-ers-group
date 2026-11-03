import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { messageId } from './field-aria';
import './Field.css';

export interface FieldShellProps {
  id: string;
  label: string;
  /** Keeps the label for screen readers when the design has no visible one. */
  hideLabel?: boolean;
  required?: boolean | undefined;
  error?: string | undefined;
  /** Shown under the field; replaced by the error when there is one. */
  hint?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}

/** Label + control + message, shared by TextField and SelectField. */
export function FieldShell({
  id,
  label,
  hideLabel,
  required,
  error,
  hint,
  className,
  children,
}: FieldShellProps) {
  const message = error ?? hint;

  return (
    <div className={cx('field', className)}>
      <label htmlFor={id} className={hideLabel ? 'visually-hidden' : 'field__label'}>
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      <div className="field__control-wrap">{children}</div>
      {message && (
        <span id={messageId(id)} className={cx('field__message', error && 'field__message--error')}>
          {message}
        </span>
      )}
    </div>
  );
}
