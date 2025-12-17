import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Building2, Calendar, Star, TrendingUp, Clock, RefreshCw, Eye } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Card, Badge, Button } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { users, spaces, events, bookings, pointTransactions, fetchUsers, fetchSpaces, fetchEvents, fetchBookings, refreshEventQRCode, getActiveEvents } = useStore();
  const [, setRefresh] = useState(0);

  // Fetch data on mount
  useEffect(() => {
    fetchUsers();
    fetchSpaces();
    fetchEvents();
    fetchBookings();
  }, [fetchUsers, fetchSpaces, fetchEvents, fetchBookings]);

  const activeEvents = getActiveEvents();

  // Auto refresh QR codes
  useEffect(() => {
    const interval = setInterval(() => {
      activeEvents.forEach((event) => {
        const expiresAt = parseISO(event.qrCodeExpiresAt);
        const minutesUntilExpiry = differenceInMinutes(expiresAt, new Date());

        if (minutesUntilExpiry <= 5) {
          refreshEventQRCode(event.id);
        }
      });
      setRefresh((r) => r + 1);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [activeEvents, refreshEventQRCode]);

  // Statistics
  const totalUsers = users.filter((u) => u.role === 'user').length;
  const totalPoints = users.reduce((sum, u) => sum + u.points, 0);
  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;

  const stats = [
    {
      label: 'Associados',
      value: totalUsers,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-primary-500',
      path: '/admin/users'
    },
    {
      label: 'Espaços',
      value: spaces.length,
      icon: <Building2 className="w-6 h-6" />,
      color: 'bg-secondary-500',
      path: '/admin/spaces'
    },
    {
      label: 'Eventos',
      value: events.length,
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-accent-500',
      path: '/admin/events'
    },
    {
      label: 'Pontos Totais',
      value: totalPoints,
      icon: <Star className="w-6 h-6" />,
      color: 'bg-purple-500',
      path: '/admin/users'
    }
  ];

  return (
    <Layout title="Painel Administrativo" showBottomNav={false}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Visão geral da associação</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              hover
              onClick={() => navigate(stat.path)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {stat.value.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white`}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Active Events with QR Codes */}
        {activeEvents.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <h2 className="text-lg font-semibold text-gray-800">Eventos Ativos - QR Codes</h2>
              </div>
              <Badge variant="success">{activeEvents.length} ativo(s)</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeEvents.map((event) => {
                const expiresAt = parseISO(event.qrCodeExpiresAt);
                const minutesUntilExpiry = Math.max(0, differenceInMinutes(expiresAt, new Date()));
                const eventParticipants = pointTransactions.filter((t) => t.eventId === event.id);
                const uniqueParticipants = new Set(eventParticipants.map((t) => t.userId)).size;
                const totalEventPoints = eventParticipants.reduce((sum, t) => sum + t.points, 0);

                const qrData = JSON.stringify({
                  eventId: event.id,
                  secret: event.qrCodeSecret,
                  timestamp: Date.now()
                });

                return (
                  <div key={event.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-800">{event.name}</h3>
                        <p className="text-sm text-gray-500">
                          {format(parseISO(event.startDate), "dd/MM 'às' HH:mm", { locale: ptBR })} - {format(parseISO(event.endDate), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant="accent">+{event.points} pts</Badge>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      {/* QR Code */}
                      <div className="flex flex-col items-center">
                        <div className="qr-container p-3 rounded-lg bg-white">
                          <QRCodeSVG
                            value={qrData}
                            size={150}
                            level="H"
                            includeMargin={false}
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            Expira em {minutesUntilExpiry} min
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => refreshEventQRCode(event.id)}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Renovar
                        </Button>
                      </div>

                      {/* Event Stats */}
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white rounded-lg text-center">
                          <Users className="w-5 h-5 mx-auto text-primary-500 mb-1" />
                          <p className="text-xl font-bold text-gray-800">{uniqueParticipants}</p>
                          <p className="text-xs text-gray-500">Participantes</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg text-center">
                          <Star className="w-5 h-5 mx-auto text-accent-500 mb-1" />
                          <p className="text-xl font-bold text-gray-800">{totalEventPoints}</p>
                          <p className="text-xs text-gray-500">Pontos Dados</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg text-center">
                          <TrendingUp className="w-5 h-5 mx-auto text-secondary-500 mb-1" />
                          <p className="text-xl font-bold text-gray-800">{eventParticipants.length}</p>
                          <p className="text-xs text-gray-500">Escaneamentos</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg text-center">
                          <Eye className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                          <p className="text-xl font-bold text-gray-800">{event.maxScansPerUser}</p>
                          <p className="text-xs text-gray-500">Limite/Usuário</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Bookings */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Locações Pendentes</h3>
              <Badge variant="warning">{pendingBookings}</Badge>
            </div>
            {bookings
              .filter((b) => b.status === 'pending')
              .slice(0, 5)
              .map((booking) => {
                const space = spaces.find((s) => s.id === booking.spaceId);
                const user = users.find((u) => u.id === booking.userId);
                return (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                    <div>
                      <p className="font-medium text-gray-800">{space?.name}</p>
                      <p className="text-sm text-gray-500">{user?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800">
                        {format(parseISO(booking.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })}
            {pendingBookings === 0 && (
              <p className="text-center text-gray-500 py-4">Nenhuma locação pendente</p>
            )}
            <Button
              variant="outline"
              fullWidth
              className="mt-4"
              onClick={() => navigate('/admin/bookings')}
            >
              Ver Todas as Locações
            </Button>
          </Card>

          {/* Recent Points */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Últimos Pontos</h3>
              <Badge variant="primary">{pointTransactions.length} total</Badge>
            </div>
            {pointTransactions
              .slice(-5)
              .reverse()
              .map((transaction) => {
                const user = users.find((u) => u.id === transaction.userId);
                const event = events.find((e) => e.id === transaction.eventId);
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                    <div>
                      <p className="font-medium text-gray-800">{user?.name}</p>
                      <p className="text-sm text-gray-500">{event?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-secondary-500">+{transaction.points}</p>
                      <p className="text-xs text-gray-500">
                        {format(parseISO(transaction.timestamp), 'dd/MM HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })}
            {pointTransactions.length === 0 && (
              <p className="text-center text-gray-500 py-4">Nenhum ponto registrado</p>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Button fullWidth onClick={() => navigate('/admin/users')}>
            <Users className="w-4 h-4 mr-2" />
            Gerenciar Usuários
          </Button>
          <Button fullWidth variant="secondary" onClick={() => navigate('/admin/spaces')}>
            <Building2 className="w-4 h-4 mr-2" />
            Gerenciar Espaços
          </Button>
          <Button fullWidth variant="accent" onClick={() => navigate('/admin/events')}>
            <Calendar className="w-4 h-4 mr-2" />
            Gerenciar Eventos
          </Button>
          <Button fullWidth variant="outline" onClick={() => navigate('/admin/bookings')}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Ver Locações
          </Button>
        </div>
      </div>
    </Layout>
  );
};
