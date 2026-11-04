import { useEffect, useState } from 'react';

/**
 * Значение, но только после того, как оно не менялось `delay` мс.
 * Если `isImmediate(value)` истинно (например, поиск очищен), значение применяется сразу и
 * становится новой точкой отсчёта: следующий ввод не покажет ничего из того, что было до очистки.
 */
export function useDebouncedValue<T>(
  value: T,
  delay: number,
  isImmediate?: (value: T) => boolean,
): T {
  const [debounced, setDebounced] = useState(value);
  const immediate = isImmediate?.(value) ?? false;

  // Обновление состояния прямо во время рендера — штатный приём React для производного состояния:
  // без него после очистки и быстрого нового ввода вернулось бы значение до очистки
  if (immediate && !Object.is(debounced, value)) {
    setDebounced(value);
  }

  useEffect(() => {
    if (immediate) return;
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay, immediate]);

  return immediate ? value : debounced;
}
