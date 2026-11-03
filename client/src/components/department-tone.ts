export const DEPARTMENT_TONES = ['dev', 'hr', 'an', 'fin', 'mkt'] as const;
export type DepartmentTone = (typeof DEPARTMENT_TONES)[number];

// Colors from the design for the known departments
const KNOWN: Record<string, DepartmentTone> = {
  Разработка: 'dev',
  HR: 'hr',
  Аналитика: 'an',
  Финансы: 'fin',
  Маркетинг: 'mkt',
};

/** Known departments keep their design color; any other gets a stable one from its name. */
export function departmentTone(name: string): DepartmentTone {
  const known = KNOWN[name];
  if (known) return known;

  let hash = 0;
  for (const char of name) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return DEPARTMENT_TONES[hash % DEPARTMENT_TONES.length] ?? 'dev';
}
