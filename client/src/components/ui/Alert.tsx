import type { ReactNode } from 'react';
import './Alert.css';

interface AlertProps {
  children: string;
  /** Необязательный элемент рядом с сообщением, например кнопка повтора. */
  action?: ReactNode;
}

/** Ошибка всей формы над полями (в макете — «Сообщение об ошибке над формой»). */
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
