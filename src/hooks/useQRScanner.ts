import { useState, useRef, useCallback, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export type ScannerStatus = 'idle' | 'initializing' | 'scanning' | 'processing' | 'cooldown' | 'success' | 'error';

export interface ScanResult {
  success: boolean;
  message: string;
  points?: number;
  totalPoints?: number;
  scanCount?: number;
  maxScans?: number;
}

export interface UseQRScannerOptions {
  containerId: string;
  onScan: (data: string) => Promise<ScanResult>;
  cooldownKey?: string;
  fps?: number;
  qrboxSize?: number;
  enabled?: boolean;
}

export interface UseQRScannerReturn {
  status: ScannerStatus;
  result: ScanResult | null;
  cooldownSeconds: number;
  cameraEnabled: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => void;
  tryAgain: () => Promise<void>;
  formatCooldown: () => string;
  canTryAgain: boolean;
}

const COOLDOWN_STORAGE_PREFIX = 'qr-scanner-cooldown-';

// Regex para extrair minutos da mensagem de erro
const COOLDOWN_REGEX = /Aguarde (\d+) minuto/i;

export function useQRScanner({
  containerId,
  onScan,
  cooldownKey,
  fps = 10,
  qrboxSize = 250,
  enabled = true,
}: UseQRScannerOptions): UseQRScannerReturn {
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasProcessedRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Carregar cooldown do localStorage ao montar ou quando cooldownKey mudar
  useEffect(() => {
    if (!cooldownKey) return;

    const storageKey = `${COOLDOWN_STORAGE_PREFIX}${cooldownKey}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      const expiresAt = parseInt(saved, 10);
      const remaining = Math.ceil((expiresAt - Date.now()) / 1000);

      if (remaining > 0) {
        setCooldownSeconds(remaining);
        setStatus('cooldown');
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  }, [cooldownKey]);

  // Timer para decrementar cooldown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setTimeout(() => {
      const newValue = cooldownSeconds - 1;
      setCooldownSeconds(newValue);

      if (newValue === 0) {
        // Cooldown expirou - limpar localStorage
        if (cooldownKey) {
          localStorage.removeItem(`${COOLDOWN_STORAGE_PREFIX}${cooldownKey}`);
        }
        // Se estava em status cooldown, voltar para idle
        if (status === 'cooldown') {
          setStatus('idle');
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldownSeconds, cooldownKey, status]);

  // Destruir scanner completamente
  const destroyScanner = useCallback(async () => {
    if (!scannerRef.current) return;

    try {
      const state = scannerRef.current.getState();
      // State 2 = SCANNING, State 3 = PAUSED
      if (state === 2 || state === 3) {
        await scannerRef.current.stop();
      }
    } catch (e) {
      console.log('Erro ao parar scanner:', e);
    }

    try {
      await scannerRef.current.clear();
    } catch (e) {
      console.log('Erro ao limpar scanner:', e);
    }

    scannerRef.current = null;
    setCameraEnabled(false);
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      destroyScanner();
    };
  }, [destroyScanner]);

  // Setar cooldown com persistência
  const setCooldownWithPersistence = useCallback((seconds: number) => {
    setCooldownSeconds(seconds);
    setStatus('cooldown');

    if (cooldownKey && seconds > 0) {
      const expiresAt = Date.now() + (seconds * 1000);
      localStorage.setItem(`${COOLDOWN_STORAGE_PREFIX}${cooldownKey}`, expiresAt.toString());
    }
  }, [cooldownKey]);

  // Handler do QR Code
  const handleQRCodeScan = useCallback(async (data: string) => {
    // Proteção dupla contra múltiplos callbacks
    if (hasProcessedRef.current || isProcessingRef.current) {
      return;
    }

    // Marcar como processando imediatamente (síncrono)
    isProcessingRef.current = true;
    hasProcessedRef.current = true;

    // Desabilitar câmera imediatamente
    setCameraEnabled(false);

    // Pausar scanner para evitar mais callbacks
    if (scannerRef.current) {
      try {
        await scannerRef.current.pause(true);
      } catch (e) {
        console.log('Erro ao pausar scanner:', e);
      }
    }

    // Mudar para estado de processamento
    setStatus('processing');

    // Destruir scanner completamente
    await destroyScanner();

    try {
      // Chamar callback de scan
      const scanResult = await onScan(data);
      setResult(scanResult);

      if (scanResult.success) {
        setStatus('success');
      } else {
        // Verificar se há cooldown na mensagem
        const cooldownMatch = scanResult.message.match(COOLDOWN_REGEX);
        if (cooldownMatch) {
          const minutes = parseInt(cooldownMatch[1], 10);
          setCooldownWithPersistence(minutes * 60);
        } else {
          setStatus('error');
        }
      }
    } catch (error) {
      console.error('Erro ao processar QR:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao processar QR Code'
      });
      setStatus('error');
    } finally {
      isProcessingRef.current = false;
    }
  }, [onScan, destroyScanner, setCooldownWithPersistence]);

  // Iniciar scanner
  const start = useCallback(async () => {
    // Não iniciar se já existe scanner ou está processando
    if (scannerRef.current || hasProcessedRef.current || isProcessingRef.current) {
      return;
    }

    // Não iniciar se há cooldown ativo
    if (cooldownSeconds > 0) {
      setStatus('cooldown');
      return;
    }

    // Não iniciar se não está habilitado
    if (!enabled) {
      return;
    }

    setStatus('initializing');

    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps, qrbox: { width: qrboxSize, height: qrboxSize } },
        (decodedText) => {
          handleQRCodeScan(decodedText);
        },
        () => {
          // Error callback - ignorar erros de decodificação
        }
      );

      setCameraEnabled(true);
      setStatus('scanning');
    } catch (err) {
      console.error('Erro ao iniciar câmera:', err);
      setResult({
        success: false,
        message: 'Não foi possível acessar a câmera. Verifique as permissões.'
      });
      setStatus('error');
    }
  }, [containerId, fps, qrboxSize, handleQRCodeScan, cooldownSeconds, enabled]);

  // Parar scanner
  const stop = useCallback(async () => {
    await destroyScanner();
    setStatus('idle');
  }, [destroyScanner]);

  // Reset - volta ao estado inicial respeitando cooldown
  const reset = useCallback(() => {
    destroyScanner();
    setResult(null);
    hasProcessedRef.current = false;
    isProcessingRef.current = false;

    // Se há cooldown ativo, manter status cooldown
    if (cooldownSeconds > 0) {
      setStatus('cooldown');
    } else {
      setStatus('idle');
    }
  }, [destroyScanner, cooldownSeconds]);

  // Tentar novamente - só funciona se cooldown expirou
  const tryAgain = useCallback(async () => {
    // Não permite tentar durante cooldown
    if (cooldownSeconds > 0) {
      return;
    }

    setResult(null);
    hasProcessedRef.current = false;
    isProcessingRef.current = false;
    setStatus('idle');

    // Delay para DOM estar pronto
    await new Promise(resolve => setTimeout(resolve, 500));
    await start();
  }, [cooldownSeconds, start]);

  // Formatar cooldown para exibição
  const formatCooldown = useCallback(() => {
    const mins = Math.floor(cooldownSeconds / 60);
    const secs = cooldownSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [cooldownSeconds]);

  return {
    status,
    result,
    cooldownSeconds,
    cameraEnabled,
    start,
    stop,
    reset,
    tryAgain,
    formatCooldown,
    canTryAgain: cooldownSeconds === 0,
  };
}
