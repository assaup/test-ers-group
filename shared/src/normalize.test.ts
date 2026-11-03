import { describe, expect, it } from 'vitest';
import { collapseWhitespace, normalizeForSearch } from './normalize';

describe('normalizeForSearch', () => {
  it('lowercases Cyrillic', () => {
    expect(normalizeForSearch('ИВАНОВА Анна')).toBe('иванова анна');
  });

  it('treats ё as е', () => {
    expect(normalizeForSearch('Фёдорова')).toBe('федорова');
    expect(normalizeForSearch('ЁЛКИН')).toBe('елкин');
  });

  it('trims and collapses whitespace', () => {
    expect(normalizeForSearch('  Петров \t Дмитрий\n Олегович ')).toBe('петров дмитрий олегович');
  });

  it('handles Latin names', () => {
    expect(normalizeForSearch('John SMITH')).toBe('john smith');
  });
});

describe('collapseWhitespace', () => {
  it('keeps the original case', () => {
    expect(collapseWhitespace('  Иванова   Анна ')).toBe('Иванова Анна');
  });
});
