import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Calendar, TrendingUp, Award, Clock, Send, ArrowDownLeft, ArrowUpRight, ShoppingCart, Settings } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Card, Badge, Button } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PointTransactionType } from '../../types';

const getTransactionIcon = (type: PointTransactionType) => {
  switch (type) {
    case 'event_checkin':
      return <Calendar className="w-5 h-5 text-secondary-600" />;
    case 'purchase':
      return <ShoppingCart className="w-5 h-5 text-red-500" />;
    case 'transfer_sent':
      return <ArrowUpRight className="w-5 h-5 text-red-500" />;
    case 'transfer_received':
      return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
    case 'admin_adjustment':
      return <Settings className="w-5 h-5 text-gray-500" />;
    default:
      return <Star className="w-5 h-5 text-accent-500" />;
  }
};

const getTransactionBgColor = (type: PointTransactionType) => {
  switch (type) {
    case 'event_checkin':
      return 'bg-secondary-100';
    case 'purchase':
      return 'bg-red-100';
    case 'transfer_sent':
      return 'bg-red-100';
    case 'transfer_received':
      return 'bg-green-100';
    case 'admin_adjustment':
      return 'bg-gray-100';
    default:
      return 'bg-accent-100';
  }
};

export const Points: React.FC = () => {
  const navigate = useNavigate();
  const { events, getUserPointHistory, users, getUserById } = useStore();
  const { user } = useAuthStore();

  if (!user) return null;

  const pointHistory = getUserPointHistory(user.id);

  // Calculate statistics
  const totalEvents = new Set(pointHistory.filter(t => t.type === 'event_checkin').map((t) => t.eventId)).size;
  const thisMonthPoints = pointHistory
    .filter((t) => {
      const date = parseISO(t.timestamp);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.points, 0);

  // Get ranking
  const sortedUsers = [...users]
    .filter((u) => u.role === 'user')
    .sort((a, b) => b.points - a.points);
  const userRank = sortedUsers.findIndex((u) => u.id === user.id) + 1;

  const getTransactionLabel = (transaction: typeof pointHistory[0]) => {
    switch (transaction.type) {
      case 'event_checkin': {
        const event = events.find((e) => e.id === transaction.eventId);
        return event?.name || 'Evento';
      }
      case 'purchase':
        return 'Compra na Geladeira';
      case 'transfer_sent': {
        const recipient = transaction.relatedUserId ? getUserById(transaction.relatedUserId) : null;
        return `Transferência para ${recipient?.name || 'usuário'}`;
      }
      case 'transfer_received': {
        const sender = transaction.relatedUserId ? getUserById(transaction.relatedUserId) : null;
        return `Transferência de ${sender?.name || 'usuário'}`;
      }
      case 'admin_adjustment':
        return transaction.reason || 'Ajuste administrativo';
      default:
        return 'Transação';
    }
  };

  const getTransactionSubtext = (transaction: typeof pointHistory[0]) => {
    if (transaction.type === 'event_checkin' && transaction.scanCount) {
      return `Scan ${transaction.scanCount}`;
    }
    return null;
  };

  return (
    <Layout title="Meus Pontos">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Points Summary Card */}
        <Card className="bg-gradient-to-r from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100 text-sm">Total de Pontos</p>
              <div className="flex items-center gap-2 mt-1">
                <Star className="w-8 h-8 text-yellow-300 fill-yellow-300" />
                <span className="text-4xl font-bold">{user.points}</span>
              </div>
              <p className="text-accent-100 text-sm mt-2">Association-Points</p>
            </div>
            <div className="text-right">
              <Button
                variant="outline"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                onClick={() => navigate('/transfer')}
              >
                <Send className="w-4 h-4 mr-2" />
                Transferir
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-secondary-500 mb-2" />
            <p className="text-xl font-bold text-gray-800">+{thisMonthPoints}</p>
            <p className="text-xs text-gray-500">Este mês</p>
          </Card>
          <Card className="text-center">
            <Calendar className="w-6 h-6 mx-auto text-primary-500 mb-2" />
            <p className="text-xl font-bold text-gray-800">{totalEvents}</p>
            <p className="text-xs text-gray-500">Eventos</p>
          </Card>
          <Card className="text-center">
            <Award className="w-6 h-6 mx-auto text-accent-500 mb-2" />
            <p className="text-xl font-bold text-gray-800">#{userRank || '-'}</p>
            <p className="text-xs text-gray-500">Ranking</p>
          </Card>
        </div>

        {/* How to Earn Points */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Como ganhar pontos</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-secondary-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Participe de eventos</h4>
                <p className="text-sm text-gray-500">
                  Escaneie o QR Code exibido durante os eventos da associação
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Acumule pontos permanentes</h4>
                <p className="text-sm text-gray-500">
                  Seus pontos nunca expiram e ficam registrados para sempre
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Points History */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Histórico de Pontos</h3>
            <Badge variant="gray">{pointHistory.length} registros</Badge>
          </div>

          {pointHistory.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Você ainda não possui pontos.</p>
              <p className="text-sm text-gray-400 mt-1">
                Participe de eventos para começar a acumular!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pointHistory.map((transaction) => {
                const isPositive = transaction.points > 0;
                const subtext = getTransactionSubtext(transaction);
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${getTransactionBgColor(transaction.type)} rounded-lg flex items-center justify-center`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {getTransactionLabel(transaction)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {format(parseISO(transaction.timestamp), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{transaction.points}
                      </span>
                      {subtext && (
                        <p className="text-xs text-gray-500">
                          {subtext}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Info Card */}
        <Card className="bg-primary-50 border border-primary-100">
          <h4 className="font-medium text-primary-800 mb-2">Sobre os pontos</h4>
          <ul className="text-sm text-primary-700 space-y-1">
            <li>• Os pontos são permanentes e não expiram</li>
            <li>• Cada evento define quantos pontos você pode ganhar</li>
            <li>• Alguns eventos permitem múltiplos escaneamentos</li>
            <li>• Use seus pontos para comprar itens na geladeira</li>
            <li>• Transfira pontos para outros associados</li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
};
