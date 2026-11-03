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
 * Runs `load` whenever it changes (pass a useCallback) and on reload().
 * A newer request aborts the previous one, so a slow stale response can never
 * overwrite a fresh one. While reloading, the last data stays available.
 */
export function useRemoteData<T>(load: Loader<T>) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>();
  const [lastData, setLastData] = useState<T>();

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => {
        // A response can still arrive after abort(); it belongs to an outdated request
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

  // "Loading" is derived rather than stored: the settled result belongs to an older request
  const isCurrent = settled?.load === load && settled.attempt === attempt;
  const status: RemoteStatus = !isCurrent ? 'loading' : settled.ok ? 'success' : 'error';

  const reload = useCallback(() => {
    setAttempt((count) => count + 1);
  }, []);

  return {
    status,
    data: isCurrent && settled.ok ? settled.data : lastData,
    /** The failure of the current request, when status is "error". */
    error: isCurrent ? settled.error : undefined,
    reload,
  };
}
