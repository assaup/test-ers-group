import { employeesQuerySchema } from '@test-ers/shared';

export interface EmployeeFilters {
  search: string;
  departmentId: number | undefined;
}

/**
 * Фильтры из адреса страницы (?q=…&dept=…), проверенные той же схемой, что и в API.
 * Всё, что API отклонил бы (dept=0, поиск из 300 символов), просто отбрасывается,
 * поэтому отредактированная вручную или устаревшая ссылка не приводит к экрану ошибки.
 */
export function readFilters(params: URLSearchParams): EmployeeFilters {
  const { search, departmentId } = employeesQuerySchema.shape;
  const parsedSearch = search.safeParse(params.get('q') ?? undefined);
  const parsedDepartment = departmentId.safeParse(params.get('dept') ?? undefined);

  return {
    search: (parsedSearch.success ? parsedSearch.data : undefined) ?? '',
    departmentId: parsedDepartment.success ? parsedDepartment.data : undefined,
  };
}

/** Параметры адреса для `filters`; пустые фильтры не попадают в адрес. */
export function filtersToParams({ search, departmentId }: EmployeeFilters) {
  const params = new URLSearchParams();
  if (search) params.set('q', search);
  if (departmentId) params.set('dept', String(departmentId));
  return params;
}
