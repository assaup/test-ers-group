import type { ReactNode } from 'react';
import './Alert.css';

interface AlertProps {
  children: string;
  /** Optional control next to the message, e.g. a retry button. */
  action?: ReactNode;
}

/** Form-level error shown above the fields (design: "Сообщение об ошибке над формой"). */
export function Alert({ children, action }: AlertProps) {
  return (
    <div className="alert" role="alert">
      <span className="alert__icon" aria-hidden="true">
        !
      </span>
      <span className="alert__text">{children}</span>
      {action && <span className="alert__action">{action}</span>}
    </div>
  );
}
