import { useId, type SelectHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import { controlAria } from './field-aria';
import { FieldShell } from './FieldShell';
import { ChevronIcon } from './icons';

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hideLabel?: boolean;
  error?: string | undefined;
  options: Option[];
  /** Первый пункт с пустым значением («Все отделы», «Выберите отдел»). */
  placeholder: string;
}

/** Нативный <select> в стиле полей ввода: клавиатура и экранные дикторы работают сами. */
export function SelectField({
  label,
  hideLabel,
  error,
  options,
  placeholder,
  required,
  className,
  value,
  ...rest
}: SelectFieldProps) {
  const id = useId();

  return (
    <FieldShell {...{ id, label, hideLabel, required, error, className }}>
      <select
        id={id}
        required={required}
        value={value}
        {...controlAria(id, error, undefined)}
        className={cx(
          'field__control',
          'field__control--select',
          value === '' && 'field__control--placeholder',
          error && 'field__control--invalid',
        )}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="field__chevron">
        <ChevronIcon />
      </span>
    </FieldShell>
  );
}
