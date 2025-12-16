import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Refrigerator, Star } from 'lucide-react';
import { KioskLayout } from './KioskLayout';
import { useStore } from '../../store/useStore';

export const KioskSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { getFridgeOrderById, markOrderCollected } = useStore();
  const [countdown, setCountdown] = useState(10);

  const order = orderId ? getFridgeOrderById(orderId) : null;

  // Mark as collected and auto-redirect
  useEffect(() => {
    if (order && order.status === 'paid') {
      markOrderCollected(order.id);
    }
  }, [order, markOrderCollected]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/kiosk');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  if (!order) {
    navigate('/kiosk');
    return null;
  }

  return (
    <KioskLayout showLogo={false} timeoutMs={15000}>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Success Icon */}
        <div className="relative mb-6">
          <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
            <CheckCircle className="w-20 h-20 text-green-500" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Pagamento Confirmado!</h1>
        <p className="text-xl text-gray-600 mb-8">Retire seus itens da geladeira</p>

        {/* Fridge Animation */}
        <div className="bg-primary-100 p-8 rounded-2xl mb-8">
          <Refrigerator className="w-24 h-24 text-primary-500 mx-auto mb-4" />
          <p className="text-primary-700 font-semibold text-lg">Geladeira Desbloqueada!</p>
          <p className="text-primary-500 text-sm">Pegue seus itens agora</p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl p-4 w-full max-w-sm mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Itens do Pedido</h3>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}x {item.productName}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between items-center">
            <span className="font-semibold">Total pago</span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-accent-500 fill-current" />
              <span className="font-bold text-accent-500">{order.totalPoints} pts</span>
            </div>
          </div>
        </div>

        {/* Auto-redirect countdown */}
        <p className="text-gray-500">
          Retornando ao inicio em <span className="font-bold">{countdown}</span> segundos
        </p>

        {/* Manual button */}
        <button
          onClick={() => navigate('/kiosk')}
          className="mt-4 px-8 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600"
        >
          Fazer Novo Pedido
        </button>
      </div>
    </KioskLayout>
  );
};
