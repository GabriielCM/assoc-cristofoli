import React from 'react';
import { Star, Calendar, TrendingUp, Award, Clock } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Card, Badge } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Points: React.FC = () => {
  const { events, getUserPointHistory, users } = useStore();
  const { user } = useAuthStore();

  if (!user) return null;

  const pointHistory = getUserPointHistory(user.id);

  // Calculate statistics
  const totalEvents = new Set(pointHistory.map((t) => t.eventId)).size;
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
              <Award className="w-16 h-16 text-white/30" />
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
                const event = events.find((e) => e.id === transaction.eventId);
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-secondary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {event?.name || 'Evento'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {format(parseISO(transaction.timestamp), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-secondary-500">
                        +{transaction.points}
                      </span>
                      <p className="text-xs text-gray-500">
                        Scan {transaction.scanCount}
                      </p>
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
            <li>• Em breve: troque seus pontos por benefícios!</li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
};
