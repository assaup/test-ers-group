import type { Employee } from '@test-ers/shared';
import type { ReactNode } from 'react';
import { cx } from '../lib/cx';
import { DepartmentBadge } from './DepartmentBadge';
import './EmployeeTable.css';

interface EmployeeTableProps {
  employees: Employee[];
  highlightedId?: number | undefined;
  /** Строки от предыдущего запроса, пока выполняется новый. */
  stale?: boolean;
}

const SKELETON_WIDTHS = [
  ['62%', '48%', '70px'],
  ['55%', '60%', '70px'],
  ['68%', '40%', '40px'],
  ['58%', '30%', '76px'],
  ['64%', '36%', '64px'],
];

function TableFrame({ children, busy }: { children: ReactNode; busy?: boolean }) {
  return (
    <table className={cx('employee-table', busy && 'employee-table--stale')} aria-busy={busy}>
      <caption className="visually-hidden">Сотрудники</caption>
      <thead className="employee-table__head">
        <tr>
          <th scope="col">ФИО</th>
          <th scope="col">Должность</th>
          <th scope="col">Отдел</th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function EmployeeTable({ employees, highlightedId, stale }: EmployeeTableProps) {
  return (
    <TableFrame busy={stale}>
      {employees.map((employee) => (
        <tr
          key={employee.id}
          className={cx(
            'employee-table__row',
            employee.id === highlightedId && 'employee-table__row--new',
          )}
        >
          <td className="employee-table__name">{employee.fullName}</td>
          <td className="employee-table__position">{employee.position}</td>
          <td className="employee-table__department">
            <DepartmentBadge name={employee.department.name} />
          </td>
        </tr>
      ))}
    </TableFrame>
  );
}

export function EmployeeTableSkeleton() {
  return (
    <TableFrame busy>
      {SKELETON_WIDTHS.map(([name, position, badge], index) => (
        <tr key={index} className="employee-table__row employee-table__row--skeleton">
          <td>
            <span className="skeleton" style={{ width: name }} />
          </td>
          <td>
            <span className="skeleton skeleton--soft" style={{ width: position }} />
          </td>
          <td>
            <span className="skeleton skeleton--soft skeleton--badge" style={{ width: badge }} />
          </td>
        </tr>
      ))}
    </TableFrame>
  );
}
