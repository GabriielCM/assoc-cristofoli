import { useEffect, useCallback, useRef } from 'react';

interface UseInactivityTimerOptions {
  timeoutMs: number;
  onTimeout: () => void;
  events?: string[];
}

export const useInactivityTimer = ({
  timeoutMs,
  onTimeout,
  events = ['mousedown', 'touchstart', 'keydown', 'mousemove']
}: UseInactivityTimerOptions) => {
  const timeoutRef = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(onTimeout, timeoutMs);
  }, [timeoutMs, onTimeout]);

  useEffect(() => {
    resetTimer();

    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer, events]);

  return { resetTimer };
};
