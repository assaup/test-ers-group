import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEPARTMENT_TONES, departmentTone } from '../components/department-tone';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates only after the value stops changing', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'и' },
    });

    rerender({ value: 'ив' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: 'ива' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('и');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('ива');
  });

  it('applies an immediate value at once and starts the next input from it', () => {
    const isEmpty = (value: string) => value === '';
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300, isEmpty), {
      initialProps: { value: 'ива' },
    });

    rerender({ value: '' });
    expect(result.current).toBe('');

    // Новый ввод меньше чем через 300 мс после очистки: старое «ива» не возвращается
    rerender({ value: 'с' });
    expect(result.current).toBe('');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('с');
  });
});

describe('departmentTone', () => {
  it('uses the design colors for known departments', () => {
    expect(departmentTone('Разработка')).toBe('dev');
    expect(departmentTone('HR')).toBe('hr');
    expect(departmentTone('Маркетинг')).toBe('mkt');
  });

  it('gives any other department a stable tone from the palette', () => {
    const tone = departmentTone('Юридический отдел');

    expect(DEPARTMENT_TONES).toContain(tone);
    expect(departmentTone('Юридический отдел')).toBe(tone);
  });
});
