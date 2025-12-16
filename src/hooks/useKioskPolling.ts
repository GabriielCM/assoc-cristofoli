import { useEffect, useRef, useCallback } from 'react';

interface UseKioskPollingOptions {
  enabled: boolean;
  intervalMs: number;
  onPoll: () => void;
}

export const useKioskPolling = ({
  enabled,
  intervalMs,
  onPoll
}: UseKioskPollingOptions) => {
  const intervalRef = useRef<number | null>(null);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(onPoll, intervalMs);
  }, [intervalMs, onPoll]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, startPolling, stopPolling]);

  return { startPolling, stopPolling };
};
