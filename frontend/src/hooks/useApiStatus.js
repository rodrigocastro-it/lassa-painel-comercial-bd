import { useEffect, useState } from 'react';
import { getStatus } from '../services/api';

/** Faz ping periódico em /api/status para indicar se o backend está acessível. */
export function useApiStatus(intervalMs = 30000) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = () => {
      getStatus()
        .then(() => {
          if (!cancelled) setOnline(true);
        })
        .catch(() => {
          if (!cancelled) setOnline(false);
        });
    };

    check();
    const id = setInterval(check, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return { online };
}
