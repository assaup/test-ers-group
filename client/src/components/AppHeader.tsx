import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { Button } from './ui/Button';
import { Logo } from './ui/Logo';
import './AppHeader.css';

export function AppHeader() {
  const { state, logout } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const email = state.status === 'authenticated' ? state.user.email : '';

  function handleLogout() {
    setLeaving(true);
    void logout();
  }

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <Logo size="sm" />
        <span className="app-header__title">
          Справочник<span className="app-header__title-rest"> сотрудников</span>
        </span>
      </div>
      <div className="app-header__user">
        <span className="app-header__email" title={email}>
          {email}
        </span>
        <Button variant="secondary" size="sm" loading={leaving} onClick={handleLogout}>
          Выйти
        </Button>
      </div>
    </header>
  );
}
