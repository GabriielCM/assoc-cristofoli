import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CreditCard, Calendar, Star, ChevronRight, TrendingUp, Refrigerator } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Card, Badge } from '../../components/ui';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { spaces, events, getBookingsByUser } = useStore();

  const userBookings = user ? getBookingsByUser(user.id) : [];
  const upcomingBookings = userBookings.filter(
    (b) => b.status !== 'cancelled' && new Date(b.date) >= new Date()
  );

  const activeEvents = events.filter((event) => {
    const now = new Date();
    const start = parseISO(event.startDate);
    const end = parseISO(event.endDate);
    return isWithinInterval(now, { start, end });
  });

  const quickActions = [
    {
      icon: <Building2 className="w-6 h-6" />,
      label: 'Locar Espaco',
      description: 'Reserve um espaco',
      path: '/spaces',
      color: 'bg-primary-500'
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      label: 'Carteirinha',
      description: 'Visualizar QR Code',
      path: '/membership',
      color: 'bg-secondary-500'
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      label: 'Eventos',
      description: 'Participar e ganhar pontos',
      path: '/events',
      color: 'bg-accent-500'
    },
    {
      icon: <Refrigerator className="w-6 h-6" />,
      label: 'Geladeira',
      description: 'Pagar com pontos',
      path: '/pay',
      color: 'bg-cyan-500'
    },
    {
      icon: <Star className="w-6 h-6" />,
      label: 'Meus Pontos',
      description: `${user?.points || 0} pontos`,
      path: '/points',
      color: 'bg-purple-500'
    }
  ];

  return (
    <Layout title="Início">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Bem-vindo(a) de volta,</p>
              <h2 className="text-2xl font-bold mt-1">{user?.name?.split(' ')[0]}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                <span className="font-medium">{user?.points || 0} pontos</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <img
                src={user?.photo}
                alt={user?.name}
                className="w-20 h-20 rounded-full border-4 border-white/20"
              />
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <Card
              key={action.path}
              hover
              onClick={() => navigate(action.path)}
              className="text-center"
            >
              <div className={`w-12 h-12 ${action.color} rounded-xl mx-auto flex items-center justify-center text-white mb-3`}>
                {action.icon}
              </div>
              <h3 className="font-semibold text-gray-800">{action.label}</h3>
              <p className="text-xs text-gray-500 mt-1">{action.description}</p>
            </Card>
          ))}
        </div>

        {/* Active Events */}
        {activeEvents.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Eventos Ativos</h3>
              <Badge variant="success">
                <TrendingUp className="w-3 h-3 mr-1" />
                Ganhe pontos
              </Badge>
            </div>
            <div className="space-y-3">
              {activeEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate('/events')}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-gray-800">{event.name}</h4>
                    <p className="text-sm text-gray-500">
                      Até {format(parseISO(event.endDate), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="accent">+{event.points} pts</Badge>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Próximas Locações</h3>
              <button
                onClick={() => navigate('/spaces')}
                className="text-primary-500 text-sm font-medium hover:underline"
              >
                Ver todas
              </button>
            </div>
            <div className="space-y-3">
              {upcomingBookings.slice(0, 3).map((booking) => {
                const space = spaces.find((s) => s.id === booking.spaceId);
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-800">{space?.name}</h4>
                      <p className="text-sm text-gray-500">
                        {format(parseISO(booking.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant={booking.status === 'confirmed' ? 'success' : 'warning'}>
                      {booking.status === 'confirmed' ? 'Confirmada' : 'Pendente'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Available Spaces Preview */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Espaços Disponíveis</h3>
            <button
              onClick={() => navigate('/spaces')}
              className="text-primary-500 text-sm font-medium hover:underline"
            >
              Ver todos
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {spaces.slice(0, 2).map((space) => (
              <div
                key={space.id}
                onClick={() => navigate('/spaces')}
                className="flex gap-4 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <img
                  src={space.image}
                  alt={space.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800">{space.name}</h4>
                  <p className="text-sm text-gray-500">Até {space.capacity} pessoas</p>
                  <p className="text-primary-500 font-semibold mt-1">
                    R$ {space.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
};
