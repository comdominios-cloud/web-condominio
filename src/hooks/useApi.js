import { useCallback, useEffect, useRef, useState } from 'react';

export function useApi(fetcher, deps = [], options = {}) {
  const { enabled = true, initialData = null } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const mountedRef = useRef(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setData(initialData);
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((result) => {
        if (active && mountedRef.current) setData(result);
      })
      .catch((err) => {
        if (active && mountedRef.current) setError(err);
      })
      .finally(() => {
        if (active && mountedRef.current) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [enabled, nonce, ...deps]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { data, loading, error, reload };
}
