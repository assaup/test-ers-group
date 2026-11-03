import { Spinner } from './Spinner';
import './PageLoader.css';

export function PageLoader() {
  return (
    <div className="page-loader" role="status">
      <Spinner className="page-loader__spinner" />
      <span className="visually-hidden">Загрузка…</span>
    </div>
  );
}
