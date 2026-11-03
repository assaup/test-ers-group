import { useEffect } from 'react';
import './Toast.css';

interface ToastProps {
  message: string;
  onClose: () => void;
  /** Через сколько миллисекунд скрыть автоматически. */
  duration?: number;
}

export function Toast({ message, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => {
      clearTimeout(timer);
    };
  }, [onClose, duration]);

  return (
    <div className="toast" role="status">
      <span className="toast__icon" aria-hidden="true">
        ✓
      </span>
      <span className="toast__message">{message}</span>
      <button type="button" className="toast__close" aria-label="Закрыть" onClick={onClose}>
        ×
      </button>
    </div>
  );
}
