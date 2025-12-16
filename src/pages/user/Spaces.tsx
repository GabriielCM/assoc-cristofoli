import React, { useState } from 'react';
import { Users, Check, Calendar as CalendarIcon } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Card, Button, Badge, Modal, Alert } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { format, addDays, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Space, Booking } from '../../types';

export const Spaces: React.FC = () => {
  const { spaces, addBooking, getBookingsByUser, isDateAvailable, cancelBooking } = useStore();
  const { user } = useAuthStore();
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const userBookings = user ? getBookingsByUser(user.id) : [];

  const handleBookSpace = () => {
    if (!selectedSpace || !selectedDate || !user) return;

    const result = addBooking({
      spaceId: selectedSpace.id,
      userId: user.id,
      date: selectedDate,
      status: 'pending',
      totalPrice: selectedSpace.price
    });

    if (result) {
      setAlert({ type: 'success', message: 'Locação solicitada com sucesso! Aguarde a confirmação.' });
      setShowModal(false);
      setSelectedDate('');
    } else {
      setAlert({ type: 'error', message: 'Esta data não está disponível.' });
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    cancelBooking(bookingId);
    setAlert({ type: 'success', message: 'Locação cancelada com sucesso.' });
  };

  const getBookingStatus = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmada', variant: 'success' as const };
      case 'pending':
        return { label: 'Pendente', variant: 'warning' as const };
      case 'cancelled':
        return { label: 'Cancelada', variant: 'danger' as const };
    }
  };

  // Generate available dates (next 60 days)
  const availableDates = Array.from({ length: 60 }, (_, i) => {
    const date = addDays(new Date(), i + 1);
    return format(date, 'yyyy-MM-dd');
  }).filter((date) => {
    if (!selectedSpace) return true;
    return isDateAvailable(selectedSpace.id, date);
  });

  return (
    <Layout title="Espaços">
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Espaços para Locação</h1>
            <p className="text-gray-500">Reserve o espaço ideal para seu evento</p>
          </div>
          <Button variant="outline" onClick={() => setShowHistoryModal(true)}>
            Minhas Locações
          </Button>
        </div>

        {/* Spaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {spaces.map((space) => (
            <Card key={space.id} className="overflow-hidden p-0">
              <img
                src={space.image}
                alt={space.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{space.name}</h3>
                  <Badge variant="primary">
                    <Users className="w-3 h-3 mr-1" />
                    {space.capacity}
                  </Badge>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {space.description}
                </p>

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {space.amenities.slice(0, 4).map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                    >
                      <Check className="w-3 h-3 mr-1 text-secondary-500" />
                      {amenity}
                    </span>
                  ))}
                  {space.amenities.length > 4 && (
                    <span className="text-xs text-gray-500">
                      +{space.amenities.length - 4} mais
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-2xl font-bold text-primary-500">
                      R$ {space.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">por diária</p>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedSpace(space);
                      setShowModal(true);
                    }}
                  >
                    Reservar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Booking Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedDate('');
          }}
          title={`Reservar ${selectedSpace?.name}`}
          size="lg"
        >
          {selectedSpace && (
            <div className="space-y-4">
              {/* Space Info */}
              <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                <img
                  src={selectedSpace.image}
                  alt={selectedSpace.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-semibold text-gray-800">{selectedSpace.name}</h4>
                  <p className="text-sm text-gray-500">Capacidade: {selectedSpace.capacity} pessoas</p>
                  <p className="text-lg font-bold text-primary-500 mt-2">
                    R$ {selectedSpace.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Selecione a data
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Escolha uma data</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {format(parseISO(date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Summary */}
              {selectedDate && (
                <div className="p-4 bg-primary-50 rounded-lg">
                  <h4 className="font-medium text-primary-800 mb-2">Resumo da Reserva</h4>
                  <div className="text-sm text-primary-700 space-y-1">
                    <p>Espaço: {selectedSpace.name}</p>
                    <p>Data: {format(parseISO(selectedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                    <p className="font-semibold pt-2 border-t border-primary-200 mt-2">
                      Total: R$ {selectedSpace.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setShowModal(false);
                    setSelectedDate('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  fullWidth
                  disabled={!selectedDate}
                  onClick={handleBookSpace}
                >
                  Confirmar Reserva
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* History Modal */}
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title="Minhas Locações"
          size="lg"
        >
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {userBookings.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Você ainda não possui locações.
              </p>
            ) : (
              userBookings.map((booking) => {
                const space = spaces.find((s) => s.id === booking.spaceId);
                const status = getBookingStatus(booking.status);
                const isPast = isBefore(parseISO(booking.date), startOfDay(new Date()));

                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={space?.image}
                        alt={space?.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-medium text-gray-800">{space?.name}</h4>
                        <p className="text-sm text-gray-500">
                          {format(parseISO(booking.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-sm font-medium text-primary-500">
                          R$ {booking.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {booking.status === 'pending' && !isPast && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Modal>
      </div>
    </Layout>
  );
};
