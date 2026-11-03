import { AppHeader } from '../components/AppHeader';
import './EmployeesPage.css';

export function EmployeesPage() {
  return (
    <>
      <AppHeader />
      <main className="employees-page">
        <h1 className="employees-page__title">Сотрудники</h1>
      </main>
    </>
  );
}
