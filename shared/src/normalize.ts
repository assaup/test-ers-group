/**
 * Каноническая форма ФИО для поиска без учёта регистра.
 * lower() и LIKE в SQLite понижают регистр только у ASCII, поэтому кириллицу обрабатываем здесь (ADR 003).
 */
export function normalizeForSearch(value: string): string {
  return collapseWhitespace(value).toLocaleLowerCase('ru-RU').replaceAll('ё', 'е');
}

export function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
