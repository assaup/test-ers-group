import type { ReactNode } from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  icon: string;
  tone: 'neutral' | 'accent' | 'danger';
  title: string;
  text: string;
  action: ReactNode;
}

export function EmptyState({ icon, tone, title, text, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className={`empty-state__icon empty-state__icon--${tone}`} aria-hidden="true">
        {icon}
      </span>
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__text">{text}</p>
      <div className="empty-state__action">{action}</div>
    </div>
  );
}
