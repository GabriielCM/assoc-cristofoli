import React, { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface KioskLayoutProps {
  children: React.ReactNode;
  onTimeout?: () => void;
  timeoutMs?: number;
  showLogo?: boolean;
}

export const KioskLayout: React.FC<KioskLayoutProps> = ({
  children,
  onTimeout,
  timeoutMs = 120000, // 2 minutes default
  showLogo = true
}) => {
  const navigate = useNavigate();
  const timeoutRef = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      if (onTimeout) {
        onTimeout();
      } else {
        navigate('/kiosk');
      }
    }, timeoutMs);
  }, [timeoutMs, onTimeout, navigate]);

  useEffect(() => {
    resetTimer();

    const events = ['mousedown', 'touchstart', 'keydown', 'mousemove'];
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
  }, [resetTimer]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      {/* Header */}
      {showLogo && (
        <div className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary-700">Geladeira</h1>
            <p className="text-sm text-primary-500">Associacao Cristofoli</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col p-4">
        {children}
      </div>
    </div>
  );
};
