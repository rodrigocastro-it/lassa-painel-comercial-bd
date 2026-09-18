import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Executa `fetcher()` sempre que `deps` mudar, com proteção contra
 * respostas fora de ordem (race conditions) ao trocar filtros rapidamente.
 */
export function useApiData(fetcher, deps, { initialData = null, skip = false } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(() => {
    if (skip) return;
    const currentId = (requestId.current += 1);
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (requestId.current !== currentId) return;
        setData(result);
      })
      .catch((err) => {
        if (requestId.current !== currentId) return;
        console.error(err);
        setError(
          err?.code === 'ERR_NETWORK'
            ? 'Não foi possível conectar à API do backend. Verifique se o servidor Node.js está rodando em ' +
                (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api') +
                '.'
            : err?.response?.data?.error || err.message || 'Erro ao carregar dados.',
        );
        setData(initialData);
      })
      .finally(() => {
        if (requestId.current !== currentId) return;
        setLoading(false);
      });
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
