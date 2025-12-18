import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, Star, QrCode, X, Camera, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Card, Button, Badge, Modal, Loader } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useQRScanner } from '../../hooks';
import type { ScanResult } from '../../hooks';
import { format, parseISO, isWithinInterval, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Event } from '../../types';

const QR_READER_CONTAINER_ID = 'qr-reader-container';

export const Events: React.FC = () => {
  const { events, fetchEvents, fetchPointHistory, scanEventQR, pointTransactions, isLoading } = useStore();
  const { user, refreshUser } = useAuthStore();

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchPointHistory(user.id);
    }
  }, [fetchEvents, fetchPointHistory, user]);

  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Callback de scan que será passado para o hook
  const handleScan = useCallback(async (data: string): Promise<ScanResult> => {
    if (!user || !selectedEvent) {
      return { success: false, message: 'Erro interno. Tente novamente.' };
    }

    try {
      const qrData = JSON.parse(data);

      if (qrData.eventId !== selectedEvent.id) {
        return { success: false, message: 'QR Code inválido para este evento.' };
      }

      const result = await scanEventQR(selectedEvent.id, qrData.secret);

      if (result.success) {
        await refreshUser();
        await fetchPointHistory(user.id);
      }

      return result;
    } catch {
      return { success: false, message: 'QR Code inválido ou mal formatado.' };
    }
  }, [user, selectedEvent, scanEventQR, refreshUser, fetchPointHistory]);

  // Usar o hook de QR Scanner
  const {
    status,
    result: scanResult,
    cameraEnabled,
    start: startScanner,
    stop: stopScanner,
    reset: resetScanner,
    tryAgain,
    formatCooldown,
    canTryAgain,
  } = useQRScanner({
    containerId: QR_READER_CONTAINER_ID,
    onScan: handleScan,
    cooldownKey: selectedEvent?.id,
    enabled: showModal,
  });

  const now = new Date();

  const categorizedEvents = {
    active: events.filter((event) => {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate);
      return isWithinInterval(now, { start, end });
    }),
    upcoming: events.filter((event) => {
      const start = parseISO(event.startDate);
      return isAfter(start, now);
    }),
    past: events.filter((event) => {
      const end = parseISO(event.endDate);
      return isBefore(end, now);
    })
  };

  const getUserScansForEvent = (eventId: string) => {
    if (!user) return 0;
    return pointTransactions.filter(
      (t) => t.userId === user.id && t.eventId === eventId
    ).length;
  };

  // Abrir modal de scanner
  const openScanner = useCallback((event: Event) => {
    setSelectedEvent(event);
    setShowModal(true);
    resetScanner();

    // Iniciar scanner após um delay para o DOM estar pronto
    setTimeout(() => {
      startScanner();
    }, 500);
  }, [resetScanner, startScanner]);

  // Fechar modal
  const closeModal = useCallback(async () => {
    await stopScanner();
    setShowModal(false);
    setSelectedEvent(null);
    resetScanner();
  }, [stopScanner, resetScanner]);

  // Handler para tentar novamente
  const handleTryAgain = useCallback(async () => {
    await tryAgain();
  }, [tryAgain]);

  const EventCard: React.FC<{ event: Event; status: 'active' | 'upcoming' | 'past' }> = ({ event, status: eventStatus }) => {
    const userScans = getUserScansForEvent(event.id);
    const canScan = eventStatus === 'active' && userScans < event.maxScansPerUser;

    return (
      <Card className="overflow-hidden p-0">
        {event.image && (
          <img src={event.image} alt={event.name} className="w-full h-40 object-cover" />
        )}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">{event.name}</h3>
            <Badge variant={eventStatus === 'active' ? 'success' : eventStatus === 'upcoming' ? 'primary' : 'gray'}>
              {eventStatus === 'active' ? 'Ativo' : eventStatus === 'upcoming' ? 'Em breve' : 'Encerrado'}
            </Badge>
          </div>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {format(parseISO(event.startDate), "dd 'de' MMM", { locale: ptBR })} - {format(parseISO(event.endDate), "dd 'de' MMM", { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {format(parseISO(event.startDate), 'HH:mm')} - {format(parseISO(event.endDate), 'HH:mm')}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-accent-500 fill-accent-500" />
              <span className="font-semibold text-gray-800">+{event.points} pontos</span>
            </div>
            {eventStatus === 'active' && (
              <p className="text-xs text-gray-500">
                {userScans}/{event.maxScansPerUser} escaneamentos
              </p>
            )}
          </div>
          {canScan && (
            <Button fullWidth className="mt-4" onClick={() => openScanner(event)}>
              <QrCode className="w-4 h-4 mr-2" />
              Escanear QR Code
            </Button>
          )}
          {eventStatus === 'active' && !canScan && userScans >= event.maxScansPerUser && (
            <div className="mt-4 p-3 bg-secondary-50 rounded-lg text-center">
              <p className="text-secondary-700 text-sm font-medium">Você já escaneou este evento!</p>
            </div>
          )}
        </div>
      </Card>
    );
  };

  // Renderizar conteúdo do modal baseado no status do scanner
  const renderModalContent = () => {
    // Tela de sucesso
    if (status === 'success' && scanResult) {
      return (
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-secondary-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Check-in realizado!</h3>
          <p className="text-gray-600 mb-6">{scanResult.message}</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pontos ganhos:</span>
              <span className="font-bold text-secondary-600">+{scanResult.points}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total de pontos:</span>
              <span className="font-bold text-gray-800">{scanResult.totalPoints}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Leituras realizadas:</span>
              <span className="font-medium text-gray-800">{scanResult.scanCount}/{scanResult.maxScans}</span>
            </div>
            {selectedEvent?.checkInIntervalMinutes && scanResult.scanCount! < scanResult.maxScans! && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Próxima leitura em <span className="font-medium text-primary-600">{selectedEvent.checkInIntervalMinutes} min</span>
                </p>
              </div>
            )}
          </div>
          <Button fullWidth onClick={closeModal}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      );
    }

    // Tela de erro ou cooldown
    if ((status === 'error' || status === 'cooldown') && scanResult) {
      return (
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Erro no check-in</h3>
          <p className="text-gray-600 mb-6">{scanResult.message}</p>
          <div className="space-y-3">
            <Button
              fullWidth
              variant="primary"
              onClick={handleTryAgain}
              disabled={!canTryAgain}
            >
              <QrCode className="w-4 h-4 mr-2" />
              {!canTryAgain
                ? `Tentar em ${formatCooldown()}`
                : 'Tentar novamente'}
            </Button>
            <Button fullWidth variant="outline" onClick={closeModal}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      );
    }

    // Tela de processamento
    if (status === 'processing') {
      return (
        <div className="text-center py-12">
          <Loader size="lg" />
          <p className="text-gray-600 mt-4">Processando check-in...</p>
        </div>
      );
    }

    // Tela da câmera (idle, initializing, scanning)
    return (
      <div className="space-y-4">
        <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
          {/* Container do scanner - só renderiza quando câmera habilitada */}
          {cameraEnabled && <div id={QR_READER_CONTAINER_ID} className="w-full" />}

          {/* Overlay de carregamento */}
          {!cameraEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">
                  {status === 'initializing' ? 'Iniciando câmera...' : 'Preparando scanner...'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-primary-50 rounded-lg">
          <h4 className="font-medium text-primary-800 mb-2">Instruções</h4>
          <ul className="text-sm text-primary-700 space-y-1">
            <li>Aponte a câmera para o QR Code do evento</li>
            <li>Mantenha o dispositivo estável</li>
            <li>Aguarde o escaneamento automático</li>
          </ul>
        </div>

        {selectedEvent && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">{selectedEvent.name}</p>
              <p className="text-sm text-gray-500">+{selectedEvent.points} pontos</p>
            </div>
            <Badge variant="success">
              {getUserScansForEvent(selectedEvent.id)}/{selectedEvent.maxScansPerUser}
            </Badge>
          </div>
        )}

        <Button variant="outline" fullWidth onClick={closeModal}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
      </div>
    );
  };

  const getModalTitle = () => {
    if (status === 'success') return 'Sucesso';
    if (status === 'error' || status === 'cooldown') return 'Erro';
    if (status === 'processing') return 'Processando...';
    return `Escanear - ${selectedEvent?.name}`;
  };

  return (
    <Layout title="Eventos">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Eventos</h1>
          <p className="text-gray-500">Participe e ganhe pontos</p>
        </div>

        {categorizedEvents.active.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-secondary-500 rounded-full animate-pulse" />
              <h2 className="text-lg font-semibold text-gray-800">Acontecendo Agora</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categorizedEvents.active.map((event) => (
                <EventCard key={event.id} event={event} status="active" />
              ))}
            </div>
          </section>
        )}

        {categorizedEvents.upcoming.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Próximos Eventos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categorizedEvents.upcoming.map((event) => (
                <EventCard key={event.id} event={event} status="upcoming" />
              ))}
            </div>
          </section>
        )}

        {categorizedEvents.past.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Eventos Anteriores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categorizedEvents.past.map((event) => (
                <EventCard key={event.id} event={event} status="past" />
              ))}
            </div>
          </section>
        )}

        {isLoading && events.length === 0 && (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        )}

        {!isLoading && events.length === 0 && (
          <Card className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800">Nenhum evento disponível</h3>
            <p className="text-gray-500 mt-2">Fique atento! Novos eventos serão publicados em breve.</p>
          </Card>
        )}

        <Modal isOpen={showModal} onClose={closeModal} title={getModalTitle()} size="md">
          {renderModalContent()}
        </Modal>
      </div>
    </Layout>
  );
};
