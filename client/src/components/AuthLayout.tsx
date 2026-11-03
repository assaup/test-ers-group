import type { ReactNode } from 'react';
import { Logo } from './ui/Logo';
import './AuthLayout.css';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="auth-layout">
      <div className="auth-layout__card">
        <header className="auth-layout__header">
          <Logo />
          <div className="auth-layout__titles">
            <h1 className="auth-layout__title">{title}</h1>
            <p className="auth-layout__subtitle">{subtitle}</p>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
