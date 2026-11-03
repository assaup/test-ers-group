/**
 * Canonical form of a full name for case-insensitive search.
 * SQLite's lower()/LIKE only fold ASCII, so we fold Cyrillic here (see ADR 003).
 */
export function normalizeForSearch(value: string): string {
  return collapseWhitespace(value).toLocaleLowerCase('ru-RU').replaceAll('ё', 'е');
}

export function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
