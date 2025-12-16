import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Calendar, Clock, MapPin, Star, QrCode, X, Camera } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Card, Button, Badge, Modal, Alert } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { format, parseISO, isWithinInterval, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Event } from '../../types';

export const Events: React.FC = () => {
  const { events, scanEventQR, pointTransactions } = useStore();
  const { user } = useAuthStore();
  const [showScanner, setShowScanner] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

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

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    setScanning(true);
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          handleQRCodeScan(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setAlert({ type: 'error', message: 'Não foi possível acessar a câmera.' });
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
    setShowScanner(false);
  };

  const handleQRCodeScan = async (data: string) => {
    if (!user || !selectedEvent) return;

    try {
      const qrData = JSON.parse(data);

      if (qrData.eventId !== selectedEvent.id) {
        setAlert({ type: 'error', message: 'QR Code inválido para este evento.' });
        return;
      }

      const result = scanEventQR(user.id, selectedEvent.id, qrData.secret);

      if (result.success) {
        setAlert({ type: 'success', message: result.message });
        await stopScanner();
      } else {
        setAlert({ type: 'error', message: result.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'QR Code inválido.' });
    }
  };

  const openScanner = (event: Event) => {
    setSelectedEvent(event);
    setShowScanner(true);
    setAlert(null);
  };

  useEffect(() => {
    if (showScanner && !scanning) {
      const timer = setTimeout(() => {
        startScanner();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showScanner]);

  const EventCard: React.FC<{ event: Event; status: 'active' | 'upcoming' | 'past' }> = ({ event, status }) => {
    const userScans = getUserScansForEvent(event.id);
    const canScan = status === 'active' && userScans < event.maxScansPerUser;

    return (
      <Card className="overflow-hidden p-0">
        {event.image && (
          <img
            src={event.image}
            alt={event.name}
            className="w-full h-40 object-cover"
          />
        )}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">{event.name}</h3>
            <Badge
              variant={status === 'active' ? 'success' : status === 'upcoming' ? 'primary' : 'gray'}
            >
              {status === 'active' ? 'Ativo' : status === 'upcoming' ? 'Em breve' : 'Encerrado'}
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
            {status === 'active' && (
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {userScans}/{event.maxScansPerUser} escaneamentos
                </p>
              </div>
            )}
          </div>

          {canScan && (
            <Button
              fullWidth
              className="mt-4"
              onClick={() => openScanner(event)}
            >
              <QrCode className="w-4 h-4 mr-2" />
              Escanear QR Code
            </Button>
          )}

          {status === 'active' && !canScan && userScans >= event.maxScansPerUser && (
            <div className="mt-4 p-3 bg-secondary-50 rounded-lg text-center">
              <p className="text-secondary-700 text-sm font-medium">
                Você já escaneou este evento!
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <Layout title="Eventos">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Alert */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Eventos</h1>
          <p className="text-gray-500">Participe e ganhe pontos</p>
        </div>

        {/* Active Events */}
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

        {/* Upcoming Events */}
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

        {/* Past Events */}
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

        {/* No Events */}
        {events.length === 0 && (
          <Card className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800">Nenhum evento disponível</h3>
            <p className="text-gray-500 mt-2">
              Fique atento! Novos eventos serão publicados em breve.
            </p>
          </Card>
        )}

        {/* QR Scanner Modal */}
        <Modal
          isOpen={showScanner}
          onClose={stopScanner}
          title={`Escanear - ${selectedEvent?.name}`}
          size="md"
        >
          <div className="space-y-4">
            {/* Scanner */}
            <div className="relative">
              <div
                id="qr-reader"
                className="w-full rounded-lg overflow-hidden bg-black"
                style={{ minHeight: '300px' }}
              />
              {!scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Iniciando câmera...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="p-4 bg-primary-50 rounded-lg">
              <h4 className="font-medium text-primary-800 mb-2">Instruções</h4>
              <ul className="text-sm text-primary-700 space-y-1">
                <li>• Aponte a câmera para o QR Code do evento</li>
                <li>• Mantenha o dispositivo estável</li>
                <li>• Aguarde o escaneamento automático</li>
              </ul>
            </div>

            {/* Event Info */}
            {selectedEvent && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{selectedEvent.name}</p>
                  <p className="text-sm text-gray-500">
                    +{selectedEvent.points} pontos
                  </p>
                </div>
                <Badge variant="success">
                  {getUserScansForEvent(selectedEvent.id)}/{selectedEvent.maxScansPerUser}
                </Badge>
              </div>
            )}

            {/* Cancel Button */}
            <Button
              variant="outline"
              fullWidth
              onClick={stopScanner}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};
