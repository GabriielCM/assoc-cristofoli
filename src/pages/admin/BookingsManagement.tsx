import React, { useState } from 'react';
import { Check, X, Calendar, Search, Filter } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Card, Button, Badge, Modal, Input, Select, Alert } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Booking } from '../../types';

export const BookingsManagement: React.FC = () => {
  const { bookings, spaces, users, updateBooking, cancelBooking } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredBookings = bookings.filter((booking) => {
    const space = spaces.find((s) => s.id === booking.spaceId);
    const user = users.find((u) => u.id === booking.userId);

    const matchesSearch =
      space?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedBookings = [...filteredBookings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleConfirm = (bookingId: string) => {
    updateBooking(bookingId, { status: 'confirmed' });
    setAlert({ type: 'success', message: 'Locação confirmada com sucesso!' });
  };

  const handleCancel = (bookingId: string) => {
    if (window.confirm('Tem certeza que deseja cancelar esta locação?')) {
      cancelBooking(bookingId);
      setAlert({ type: 'success', message: 'Locação cancelada.' });
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const getStatusConfig = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmada', variant: 'success' as const };
      case 'pending':
        return { label: 'Pendente', variant: 'warning' as const };
      case 'cancelled':
        return { label: 'Cancelada', variant: 'danger' as const };
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length
  };

  return (
    <Layout title="Gerenciar Locações" showBottomNav={false}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Alert */}
        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Locações</h1>
          <p className="text-gray-500">Gerenciar reservas de espaços</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-sm text-gray-500">Total</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
            <p className="text-sm text-gray-500">Pendentes</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-green-500">{stats.confirmed}</p>
            <p className="text-sm text-gray-500">Confirmadas</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-red-500">{stats.cancelled}</p>
            <p className="text-sm text-gray-500">Canceladas</p>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por espaço ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5" />}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos os status' },
                  { value: 'pending', label: 'Pendentes' },
                  { value: 'confirmed', label: 'Confirmadas' },
                  { value: 'cancelled', label: 'Canceladas' }
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Bookings List */}
        <div className="space-y-4">
          {sortedBookings.map((booking) => {
            const space = spaces.find((s) => s.id === booking.spaceId);
            const user = users.find((u) => u.id === booking.userId);
            const status = getStatusConfig(booking.status);
            const isPast = isBefore(parseISO(booking.date), startOfDay(new Date()));

            return (
              <Card key={booking.id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    <img
                      src={space?.image}
                      alt={space?.name}
                      className="w-16 h-16 rounded-lg object-cover hidden sm:block"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">{space?.name}</h3>
                        <Badge variant={status.variant}>{status.label}</Badge>
                        {isPast && booking.status !== 'cancelled' && (
                          <Badge variant="gray">Passado</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Reservado por: <span className="font-medium">{user?.name}</span>
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(booking.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-500">
                        R$ {booking.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500">
                        Criada em {format(parseISO(booking.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>

                    {booking.status === 'pending' && !isPast && (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleConfirm(booking.id)}
                          title="Confirmar"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancel(booking.id)}
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(booking)}
                    >
                      Detalhes
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {sortedBookings.length === 0 && (
          <Card className="text-center py-12">
            <Filter className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhuma locação encontrada</p>
          </Card>
        )}

        {/* Details Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Detalhes da Locação"
          size="md"
        >
          {selectedBooking && (() => {
            const space = spaces.find((s) => s.id === selectedBooking.spaceId);
            const user = users.find((u) => u.id === selectedBooking.userId);
            const status = getStatusConfig(selectedBooking.status);

            return (
              <div className="space-y-4">
                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={space?.image}
                    alt={space?.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">{space?.name}</h3>
                    <p className="text-sm text-gray-500">Capacidade: {space?.capacity} pessoas</p>
                    <Badge variant={status.variant} className="mt-2">{status.label}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Solicitante</span>
                    <span className="font-medium">{user?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Data da Locação</span>
                    <span className="font-medium">
                      {format(parseISO(selectedBooking.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Data da Solicitação</span>
                    <span className="font-medium">
                      {format(parseISO(selectedBooking.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Valor Total</span>
                    <span className="text-lg font-bold text-primary-500">
                      R$ {selectedBooking.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {selectedBooking.status === 'pending' && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={() => {
                        handleCancel(selectedBooking.id);
                        setShowModal(false);
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => {
                        handleConfirm(selectedBooking.id);
                        setShowModal(false);
                      }}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </Modal>
      </div>
    </Layout>
  );
};
