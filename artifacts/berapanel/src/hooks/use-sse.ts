import { useEffect, useState } from 'react';

export function useSSE(url: string | null) {
  const [data, setData] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);

  useEffect(() => {
    if (!url) return;

    setData([]);
    const es = new EventSource(url, { withCredentials: true });

    es.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    es.onmessage = (e) => {
      setData((prev) => [...prev, e.data]);
    };

    es.onerror = (err) => {
      setError(err);
      setIsConnected(false);
      es.close();
    };

    return () => {
      es.close();
      setIsConnected(false);
    };
  }, [url]);

  return { data, isConnected, error };
}
