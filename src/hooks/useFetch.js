import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeExpenses } from '../data';
import { DEFAULT_ENDPOINT } from '../settings';
import { requestJSON } from '../request';

// Luôn gọi HTTP, không chuyển sang dữ liệu giả khi request thất bại.
export function useFetch(url = DEFAULT_ENDPOINT) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const active = useRef(false);
  const controller = useRef(null);
  const busy = useRef(false);

  useEffect(() => {
    active.current = true;
    const abort = new AbortController();
    controller.current = abort;
    setError('');
    setLoading(true);
    setPending(false);
    busy.current = false;
    {
      requestJSON(url, { signal: abort.signal })
        .then(normalizeExpenses)
        .then((items) => { if (!abort.signal.aborted) setData(items); })
        .catch((err) => { if (!abort.signal.aborted) setError(err.message); })
        .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    }
    return () => { active.current = false; abort.abort(); };
  }, [url, revision]);

  const mutate = useCallback(async (method, expense) => {
    if (busy.current || loading) return false;
    busy.current = true;
    setPending(true);
    setError('');
    const signal = controller.current?.signal;
    try {
      let saved;
      {
        const target = method === 'DELETE' ? `${url.replace(/\/$/, '')}/${encodeURIComponent(expense.id)}` : url;
        const result = await requestJSON(target, {
          method, signal,
          ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(expense) } : {}),
        });
        if (method === 'POST') [saved] = normalizeExpenses([result]);
      }
      if (!active.current || signal?.aborted) return false;
      setData((items) => method === 'POST' ? [saved, ...items] : items.filter((item) => item.id !== expense.id));
      return true;
    } catch (err) {
      if (active.current && !signal?.aborted) setError(err.message);
      return false;
    } finally {
      if (active.current && !signal?.aborted) { busy.current = false; setPending(false); }
    }
  }, [url, loading]);

  return { data, loading, pending, error, add: (expense) => mutate('POST', expense), remove: (expense) => mutate('DELETE', expense), retry: () => { if (!busy.current) setRevision((value) => value + 1); } };
}
