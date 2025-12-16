import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, Star, Shield, CheckCircle } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Card, Badge } from '../../components/ui';
import { useAuthStore } from '../../store/useAuthStore';
import { format, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Membership: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  const isValid = !isBefore(parseISO(user.validUntil), new Date());
  const validUntilFormatted = format(parseISO(user.validUntil), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const birthDateFormatted = format(parseISO(user.birthDate), 'dd/MM/yyyy');

  // QR Code data contains user ID for verification
  const qrData = JSON.stringify({
    type: 'membership',
    userId: user.id,
    registration: user.registration,
    timestamp: Date.now()
  });

  return (
    <Layout title="Carteirinha Digital">
      <div className="max-w-md mx-auto space-y-6">
        {/* Membership Card */}
        <Card className="overflow-hidden p-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700">
          {/* Card Header */}
          <div className="p-4 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <p className="font-bold text-lg">A-Hub</p>
                  <p className="text-xs text-primary-100">Associação Cristofoli</p>
                </div>
              </div>
              <Badge variant={isValid ? 'success' : 'danger'} className="bg-white/20 text-white">
                {isValid ? 'Ativa' : 'Expirada'}
              </Badge>
            </div>

            {/* User Photo and Info */}
            <div className="flex gap-4">
              <img
                src={user.photo}
                alt={user.name}
                className="w-24 h-24 rounded-lg object-cover border-2 border-white/30"
              />
              <div className="flex-1">
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-primary-100 text-sm mt-1">
                  Matrícula: {user.registration}
                </p>
                <p className="text-primary-100 text-sm">
                  Nasc.: {birthDateFormatted}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  <span className="font-semibold">{user.points} pontos</span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-white p-6">
            <div className="flex flex-col items-center">
              <div className="qr-container p-4 rounded-xl bg-white shadow-inner">
                <QRCodeSVG
                  value={qrData}
                  size={180}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#0066CC"
                />
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                ID: {user.id.substring(0, 8).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Card Footer */}
          <div className="bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Válido até:</span>
              </div>
              <span className={`font-medium ${isValid ? 'text-secondary-500' : 'text-red-500'}`}>
                {validUntilFormatted}
              </span>
            </div>
          </div>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="text-center">
            <Star className="w-8 h-8 mx-auto text-accent-500 mb-2" />
            <p className="text-2xl font-bold text-gray-800">{user.points}</p>
            <p className="text-xs text-gray-500">Pontos acumulados</p>
          </Card>
          <Card className="text-center">
            <Shield className="w-8 h-8 mx-auto text-secondary-500 mb-2" />
            <p className="text-lg font-bold text-gray-800">
              {user.role === 'admin' ? 'Admin' : 'Associado'}
            </p>
            <p className="text-xs text-gray-500">Tipo de conta</p>
          </Card>
        </div>

        {/* Benefits */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Benefícios do Associado</h3>
          <div className="space-y-3">
            {[
              'Acesso aos espaços para locação',
              'Participação em eventos exclusivos',
              'Acúmulo de pontos por participação',
              'Descontos em parceiros (em breve)',
              'Acesso ao ranking de associados (em breve)'
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-secondary-500 flex-shrink-0" />
                <span className="text-gray-600 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Instructions */}
        <Card className="bg-primary-50 border border-primary-100">
          <h4 className="font-medium text-primary-800 mb-2">Como usar sua carteirinha</h4>
          <ul className="text-sm text-primary-700 space-y-2">
            <li>• Apresente o QR Code para identificação em eventos</li>
            <li>• Escaneie QR codes de eventos para ganhar pontos</li>
            <li>• Mantenha sua carteirinha sempre atualizada</li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
};
