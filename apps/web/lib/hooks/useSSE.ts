'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseSSEOptions {
  onMessage: (event: MessageEvent) => void;
}

interface UseSSEReturn {
  isConnected: boolean;
  error: string | null;
}

export function useSSE(
  url: string | null,
  options: UseSSEOptions
): UseSSEReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const onMessageRef = useRef(options.onMessage);

  // Keep the callback ref updated without causing reconnections
  onMessageRef.current = options.onMessage;

  const stableOnMessage = useCallback((event: MessageEvent) => {
    onMessageRef.current(event);
  }, []);

  useEffect(() => {
    if (!url) {
      // Cleanup if url becomes null
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setError(null);

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = stableOnMessage;

    eventSource.onerror = () => {
      // EventSource will auto-reconnect on transient errors,
      // but if readyState is CLOSED it's terminal
      if (eventSource.readyState === EventSource.CLOSED) {
        setIsConnected(false);
        // Don't set error on normal close (after analysis_complete)
      }
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [url, stableOnMessage]);

  return { isConnected, error };
}
