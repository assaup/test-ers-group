import { employeesQuerySchema } from '@test-ers/shared';

export interface EmployeeFilters {
  search: string;
  departmentId: number | undefined;
}

/**
 * Filters from the page URL (?q=…&dept=…), checked with the same schema the API uses.
 * Anything the API would reject (dept=0, a 300-character search) is dropped instead,
 * so a hand-edited or outdated link never turns into an error screen.
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

/** URL parameters for `filters`; empty filters are left out. */
export function filtersToParams({ search, departmentId }: EmployeeFilters) {
  const params = new URLSearchParams();
  if (search) params.set('q', search);
  if (departmentId) params.set('dept', String(departmentId));
  return params;
}
