import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, Star, X, AlertCircle } from 'lucide-react';
import { KioskLayout } from './KioskLayout';
import { useStore } from '../../store/useStore';
import type { FridgeOrderQRData } from '../../types';

export const KioskPayment: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { getFridgeOrderById, cancelFridgeOrder } = useStore();
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);

  const order = orderId ? getFridgeOrderById(orderId) : null;

  // Polling to check order status
  const checkOrderStatus = useCallback(() => {
    if (!orderId) return;
    const currentOrder = getFridgeOrderById(orderId);
    if (currentOrder?.status === 'paid') {
      navigate(`/kiosk/success/${orderId}`);
    } else if (currentOrder?.status === 'cancelled') {
      setIsExpired(true);
    }
  }, [orderId, getFridgeOrderById, navigate]);

  // Polling interval
  useEffect(() => {
    const interval = setInterval(checkOrderStatus, 2500); // Check every 2.5 seconds
    return () => clearInterval(interval);
  }, [checkOrderStatus]);

  // Countdown timer
  useEffect(() => {
    if (!order) return;

    const expiresAt = new Date(order.qrCodeExpiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setIsExpired(true);
        cancelFridgeOrder(order.id);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order, cancelFridgeOrder]);

  const handleCancel = () => {
    if (order) {
      cancelFridgeOrder(order.id);
    }
    navigate('/kiosk');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!order) {
    return (
      <KioskLayout>
        <div className="flex-1 flex flex-col items-center justify-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <p className="text-xl text-gray-800">Pedido nao encontrado</p>
          <button
            onClick={() => navigate('/kiosk')}
            className="mt-4 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium"
          >
            Voltar ao Inicio
          </button>
        </div>
      </KioskLayout>
    );
  }

  if (isExpired || order.status === 'cancelled') {
    return (
      <KioskLayout>
        <div className="flex-1 flex flex-col items-center justify-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">QR Code Expirado</h2>
          <p className="text-gray-500 mb-6">O tempo para pagamento se esgotou</p>
          <button
            onClick={() => navigate('/kiosk')}
            className="px-8 py-4 bg-primary-500 text-white rounded-xl font-bold text-lg"
          >
            Fazer Novo Pedido
          </button>
        </div>
      </KioskLayout>
    );
  }

  const qrData: FridgeOrderQRData = {
    type: 'fridge_order',
    orderId: order.id,
    secret: order.qrCodeSecret,
    totalPoints: order.totalPoints
  };

  return (
    <KioskLayout onTimeout={() => cancelFridgeOrder(order.id)}>
      <div className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Escaneie para Pagar</h2>
        <p className="text-gray-500 mb-6">Use o app da associacao para escanear o QR Code</p>

        {/* QR Code */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
          <QRCodeSVG
            value={JSON.stringify(qrData)}
            size={280}
            level="H"
            includeMargin
          />
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 mb-6 ${timeLeft < 60 ? 'text-red-500' : 'text-gray-600'}`}>
          <Clock className="w-6 h-6" />
          <span className="text-2xl font-bold">{formatTime(timeLeft)}</span>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl p-4 w-full max-w-md mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Resumo do Pedido</h3>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}x {item.productName}
                </span>
                <span className="font-medium">{item.pricePoints * item.quantity} pts</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between">
            <span className="font-semibold">Total</span>
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-accent-500 fill-current" />
              <span className="text-xl font-bold text-accent-500">{order.totalPoints}</span>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl"
        >
          <X className="w-5 h-5" />
          Cancelar Pedido
        </button>
      </div>
    </KioskLayout>
  );
};
