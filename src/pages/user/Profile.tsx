import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Calendar, CreditCard, Star, Shield, LogOut, ChevronRight, Building2 } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Card, Button, Badge } from '../../components/ui';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { getBookingsByUser } = useStore();

  if (!user) return null;

  const userBookings = getBookingsByUser(user.id);
  const activeBookings = userBookings.filter((b) => b.status !== 'cancelled');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      icon: <CreditCard className="w-5 h-5" />,
      label: 'Carteirinha Digital',
      description: 'Visualizar QR Code e informações',
      path: '/membership'
    },
    {
      icon: <Building2 className="w-5 h-5" />,
      label: 'Minhas Locações',
      description: `${activeBookings.length} locações ativas`,
      path: '/spaces'
    },
    {
      icon: <Star className="w-5 h-5" />,
      label: 'Meus Pontos',
      description: `${user.points} pontos acumulados`,
      path: '/points'
    }
  ];

  return (
    <Layout title="Meu Perfil">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="text-center">
          <img
            src={user.photo}
            alt={user.name}
            className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-primary-100"
          />
          <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
          <Badge
            variant={user.role === 'admin' ? 'primary' : 'secondary'}
            className="mt-2"
          >
            <Shield className="w-3 h-3 mr-1" />
            {user.role === 'admin' ? 'Administrador' : 'Associado'}
          </Badge>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-2xl font-bold text-primary-500">{user.points}</p>
              <p className="text-sm text-gray-500">Pontos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-500">{activeBookings.length}</p>
              <p className="text-sm text-gray-500">Locações</p>
            </div>
          </div>
        </Card>

        {/* User Info */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Informações Pessoais</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-800">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Data de Nascimento</p>
                <p className="font-medium text-gray-800">
                  {format(parseISO(user.birthDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Matrícula</p>
                <p className="font-medium text-gray-800">{user.registration}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Membro desde</p>
                <p className="font-medium text-gray-800">
                  {format(parseISO(user.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Válido até</p>
                <p className="font-medium text-gray-800">
                  {format(parseISO(user.validUntil), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Menu */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Atalhos</h3>
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </Card>

        {/* Admin Panel Link */}
        {user.role === 'admin' && (
          <Card className="bg-primary-50 border border-primary-100">
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-primary-800">Painel Administrativo</p>
                  <p className="text-sm text-primary-600">Gerenciar usuários, espaços e eventos</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-primary-400" />
            </button>
          </Card>
        )}

        {/* Logout Button */}
        <Button
          variant="outline"
          fullWidth
          onClick={handleLogout}
          className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair da Conta
        </Button>
      </div>
    </Layout>
  );
};
