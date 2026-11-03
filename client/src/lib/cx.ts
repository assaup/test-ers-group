/** Склеивает непустые имена классов: cx('btn', isActive && 'btn--active'). */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
