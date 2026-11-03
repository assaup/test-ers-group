import { useCallback, useEffect, useState } from 'react';
import { isAbortError } from '../api/client';

type Loader<T> = (signal: AbortSignal) => Promise<T>;

interface Settled<T> {
  load: Loader<T>;
  attempt: number;
  ok: boolean;
  data: T | undefined;
  error: unknown;
}

export type RemoteStatus = 'loading' | 'success' | 'error';

/**
 * Вызывает `load` при каждом его изменении (передавайте useCallback) и по reload().
 * Новый запрос отменяет предыдущий, поэтому медленный устаревший ответ никогда
 * не перезапишет свежий. Во время перезагрузки последние данные остаются доступны.
 */
export function useRemoteData<T>(load: Loader<T>) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>();
  const [lastData, setLastData] = useState<T>();

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => {
        // Ответ может прийти и после abort(); он относится к устаревшему запросу
        if (controller.signal.aborted) return;
        setSettled({ load, attempt, ok: true, data, error: undefined });
        setLastData(data);
      },
      (error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        setSettled({ load, attempt, ok: false, data: undefined, error });
      },
    );
    return () => {
      controller.abort();
    };
  }, [load, attempt]);

  // «Загрузка» вычисляется, а не хранится: завершённый результат относится к более старому запросу
  const isCurrent = settled?.load === load && settled.attempt === attempt;
  const status: RemoteStatus = !isCurrent ? 'loading' : settled.ok ? 'success' : 'error';

  const reload = useCallback(() => {
    setAttempt((count) => count + 1);
  }, []);

  return {
    status,
    data: isCurrent && settled.ok ? settled.data : lastData,
    /** Ошибка текущего запроса, когда status равен "error". */
    error: isCurrent ? settled.error : undefined,
    reload,
  };
}
