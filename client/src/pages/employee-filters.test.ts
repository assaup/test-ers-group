import { describe, expect, it } from 'vitest';
import { filtersToParams, readFilters } from './employee-filters';

describe('readFilters', () => {
  it('reads search and department from the URL', () => {
    expect(readFilters(new URLSearchParams('q=иван&dept=2'))).toEqual({
      search: 'иван',
      departmentId: 2,
    });
  });

  it.each(['0', '-1', '1.5', '0x1', '1e0', 'abc', ''])('drops an invalid department %j', (dept) => {
    expect(readFilters(new URLSearchParams({ dept })).departmentId).toBeUndefined();
  });

  it('drops a search longer than the API accepts', () => {
    expect(readFilters(new URLSearchParams({ q: 'я'.repeat(101) })).search).toBe('');
  });

  it('keeps a valid search when the department is invalid', () => {
    expect(readFilters(new URLSearchParams('q=петр&dept=0'))).toEqual({
      search: 'петр',
      departmentId: undefined,
    });
  });
});

describe('filtersToParams', () => {
  it('leaves empty filters out', () => {
    expect(filtersToParams({ search: '', departmentId: undefined }).toString()).toBe('');
    expect(filtersToParams({ search: 'a', departmentId: 3 }).toString()).toBe('q=a&dept=3');
  });
});
