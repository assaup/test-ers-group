import { departmentTone } from './department-tone';
import './DepartmentBadge.css';

export function DepartmentBadge({ name }: { name: string }) {
  return <span className={`dept-badge dept-badge--${departmentTone(name)}`}>{name}</span>;
}
