import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Star, ShoppingCart, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Card, Button, Modal, Alert } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { FridgeOrderQRData } from '../../types';

export const PayFridge: React.FC = () => {
  const { getFridgeOrderById, payFridgeOrder, getUserById } = useStore();
  const { user, updateUser } = useAuthStore();
  const [scanning, setScanning] = useState(false);
  const [scannedOrder, setScannedOrder] = useState<ReturnType<typeof getFridgeOrderById> | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    setScanning(true);
    setAlert(null);
    try {
      const html5QrCode = new Html5Qrcode('qr-reader-pay');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          handleQRCodeScan(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setAlert({ type: 'error', message: 'Nao foi possivel acessar a camera.' });
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleQRCodeScan = async (data: string) => {
    try {
      const qrData: FridgeOrderQRData = JSON.parse(data);

      if (qrData.type !== 'fridge_order') {
        setAlert({ type: 'error', message: 'QR Code invalido. Escaneie um QR de pedido da geladeira.' });
        return;
      }

      const order = getFridgeOrderById(qrData.orderId);

      if (!order) {
        setAlert({ type: 'error', message: 'Pedido nao encontrado.' });
        return;
      }

      if (order.status !== 'pending_payment') {
        setAlert({ type: 'error', message: 'Este pedido ja foi pago ou cancelado.' });
        return;
      }

      // Check if QR secret matches
      if (order.qrCodeSecret !== qrData.secret) {
        setAlert({ type: 'error', message: 'QR Code invalido.' });
        return;
      }

      // Check if expired
      if (new Date(order.qrCodeExpiresAt) < new Date()) {
        setAlert({ type: 'error', message: 'Este QR Code expirou. Faca um novo pedido no kiosk.' });
        return;
      }

      await stopScanner();
      setScannedOrder(order);
      setShowConfirmModal(true);

    } catch {
      setAlert({ type: 'error', message: 'QR Code invalido.' });
    }
  };

  const handleConfirmPayment = () => {
    if (!user || !scannedOrder) return;

    const result = payFridgeOrder(user.id, scannedOrder.id, scannedOrder.qrCodeSecret);

    if (result.success) {
      // Update auth user with new points
      const updatedUser = getUserById(user.id);
      if (updatedUser) {
        updateUser(updatedUser);
      }
      setPaymentSuccess(true);
      setAlert({ type: 'success', message: result.message });
    } else {
      setAlert({ type: 'error', message: result.message });
    }

    setShowConfirmModal(false);
    setScannedOrder(null);
  };

  const handleClose = () => {
    setShowConfirmModal(false);
    setScannedOrder(null);
  };

  const resetPayment = () => {
    setPaymentSuccess(false);
    setAlert(null);
  };

  const insufficientBalance = !!(scannedOrder && user && user.points < scannedOrder.totalPoints);

  return (
    <Layout title="Pagar Geladeira">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Alert */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Balance Card */}
        <Card className="bg-gradient-to-r from-accent-500 to-accent-600 text-white">
          <div className="text-center">
            <p className="text-accent-100 text-sm">Seu saldo</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Star className="w-6 h-6 fill-current" />
              <span className="text-3xl font-bold">{user?.points || 0}</span>
              <span className="text-accent-100">pontos</span>
            </div>
          </div>
        </Card>

        {/* Success State */}
        {paymentSuccess ? (
          <Card className="text-center py-8">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Pagamento Confirmado!</h2>
            <p className="text-gray-500 mb-6">Retire seus itens da geladeira</p>
            <Button onClick={resetPayment}>
              Escanear Outro QR
            </Button>
          </Card>
        ) : (
          <>
            {/* Scanner Section */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Escanear QR Code</h2>

              {scanning ? (
                <div className="space-y-4">
                  <div
                    id="qr-reader-pay"
                    className="w-full rounded-lg overflow-hidden bg-black"
                    style={{ minHeight: '300px' }}
                  />
                  <Button variant="outline" fullWidth onClick={stopScanner}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">
                    Aponte a camera para o QR Code exibido no kiosk da geladeira
                  </p>
                  <Button onClick={startScanner}>
                    <Camera className="w-4 h-4 mr-2" />
                    Iniciar Scanner
                  </Button>
                </div>
              )}
            </Card>

            {/* Instructions */}
            <Card className="bg-gray-50">
              <div className="text-center">
                <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="font-medium text-gray-700">Como funciona</h3>
                <ol className="text-sm text-gray-500 mt-2 text-left space-y-2">
                  <li>1. Selecione seus itens no kiosk da geladeira</li>
                  <li>2. Gere o QR Code de pagamento</li>
                  <li>3. Escaneie o QR com este app</li>
                  <li>4. Confirme o pagamento com seus pontos</li>
                  <li>5. Retire seus itens da geladeira</li>
                </ol>
              </div>
            </Card>
          </>
        )}

        {/* Confirmation Modal */}
        <Modal
          isOpen={showConfirmModal}
          onClose={handleClose}
          title="Confirmar Pagamento"
          size="md"
        >
          {scannedOrder && (
            <div className="space-y-4">
              {/* Order Items */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Itens do Pedido</h4>
                <div className="space-y-2">
                  {scannedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-medium">{item.pricePoints * item.quantity} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="text-center p-4 bg-accent-50 rounded-lg">
                <p className="text-sm text-accent-600">Total a pagar</p>
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-6 h-6 text-accent-500 fill-current" />
                  <span className="text-3xl font-bold text-accent-600">
                    {scannedOrder.totalPoints}
                  </span>
                  <span className="text-accent-500">pontos</span>
                </div>
              </div>

              {/* Balance after payment */}
              {user && (
                <div className="text-center text-sm text-gray-500">
                  Saldo apos pagamento:{' '}
                  <strong className={insufficientBalance ? 'text-red-500' : ''}>
                    {user.points - scannedOrder.totalPoints} pontos
                  </strong>
                </div>
              )}

              {/* Insufficient balance warning */}
              {insufficientBalance && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>Saldo insuficiente para este pagamento</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" fullWidth onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  fullWidth
                  onClick={handleConfirmPayment}
                  disabled={insufficientBalance}
                >
                  Pagar {scannedOrder.totalPoints} pontos
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};
