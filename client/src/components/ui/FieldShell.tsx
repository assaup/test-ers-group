import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { messageId } from './field-aria';
import './Field.css';

export interface FieldShellProps {
  id: string;
  label: string;
  /** Оставляет подпись для экранных дикторов, когда в макете её не видно. */
  hideLabel?: boolean;
  required?: boolean | undefined;
  error?: string | undefined;
  /** Показывается под полем; при ошибке заменяется ею. */
  hint?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}

/** Подпись + поле + сообщение, общее для TextField и SelectField. */
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
