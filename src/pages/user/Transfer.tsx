import React, { useState, useCallback } from 'react';
import { Send, QrCode, Search, X, Camera, User, Star, ArrowRight } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Card, Button, Input, Modal, Alert, Avatar } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useQRScanner } from '../../hooks';
import type { ScanResult } from '../../hooks';

type UserWithoutPassword = Omit<import('../../types').User, 'password'>;

const QR_READER_CONTAINER_ID = 'qr-reader-transfer';

export const Transfer: React.FC = () => {
  const { transferPoints, getUserByRegistration, fetchUserById } = useStore();
  const { user, refreshUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithoutPassword | null>(null);
  const [amount, setAmount] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Callback de scan que busca o usuário
  const handleScan = useCallback(async (data: string): Promise<ScanResult> => {
    try {
      const qrData = JSON.parse(data);

      if (qrData.type !== 'membership') {
        return { success: false, message: 'QR Code inválido. Escaneie uma carteirinha.' };
      }

      // Fetch user from API to ensure we have the latest data
      const foundUser = await fetchUserById(qrData.userId);

      if (!foundUser) {
        return { success: false, message: 'Usuário não encontrado.' };
      }

      if (foundUser.id === user?.id) {
        return { success: false, message: 'Você não pode transferir pontos para si mesmo.' };
      }

      // Se passou nas validações, selecionar o usuário
      setSelectedUser(foundUser);
      setSearchTerm(foundUser.registration);
      setShowScanner(false);
      setAlert({ type: 'success', message: `Usuário ${foundUser.name} encontrado!` });

      return { success: true, message: 'Usuário encontrado' };
    } catch {
      return { success: false, message: 'QR Code inválido.' };
    }
  }, [fetchUserById, user?.id]);

  // Usar o hook de QR Scanner
  const {
    status,
    result: scanResult,
    cameraEnabled,
    start: startScanner,
    stop: stopScanner,
    reset: resetScanner,
  } = useQRScanner({
    containerId: QR_READER_CONTAINER_ID,
    onScan: handleScan,
    enabled: showScanner,
  });

  // Mostrar alert se houver erro de scan
  React.useEffect(() => {
    if (status === 'error' && scanResult && !scanResult.success) {
      setAlert({ type: 'error', message: scanResult.message });
    }
  }, [status, scanResult]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setAlert({ type: 'error', message: 'Digite uma matrícula para buscar.' });
      return;
    }

    const foundUser = await getUserByRegistration(searchTerm.trim());

    if (!foundUser) {
      setAlert({ type: 'error', message: 'Usuário não encontrado com esta matrícula.' });
      setSelectedUser(null);
      return;
    }

    if (foundUser.id === user?.id) {
      setAlert({ type: 'error', message: 'Você não pode transferir pontos para si mesmo.' });
      setSelectedUser(null);
      return;
    }

    setSelectedUser(foundUser);
    setAlert(null);
  };

  const openScanner = useCallback(() => {
    setShowScanner(true);
    setAlert(null);
    resetScanner();

    // Delay para o DOM estar pronto
    setTimeout(() => {
      startScanner();
    }, 100);
  }, [resetScanner, startScanner]);

  const closeScanner = useCallback(async () => {
    await stopScanner();
    setShowScanner(false);
    resetScanner();
  }, [stopScanner, resetScanner]);

  const handlePrepareTransfer = () => {
    if (!selectedUser) {
      setAlert({ type: 'error', message: 'Selecione um destinatário.' });
      return;
    }

    const pointsToSend = parseInt(amount);

    if (!pointsToSend || pointsToSend <= 0) {
      setAlert({ type: 'error', message: 'Digite uma quantidade válida de pontos.' });
      return;
    }

    if (user && pointsToSend > user.points) {
      setAlert({ type: 'error', message: 'Saldo insuficiente.' });
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmTransfer = async () => {
    if (!user || !selectedUser) return;

    const pointsToSend = parseInt(amount);
    const result = await transferPoints(selectedUser.id, pointsToSend);

    if (result.success) {
      setAlert({ type: 'success', message: result.message });
      // Refresh auth user to get new balance from API
      await refreshUser();
      // Reset form
      setSelectedUser(null);
      setSearchTerm('');
      setAmount('');
    } else {
      setAlert({ type: 'error', message: result.message });
    }

    setShowConfirmModal(false);
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setSearchTerm('');
    setAmount('');
    setAlert(null);
  };

  return (
    <Layout title="Transferir Pontos">
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
        <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="text-center">
            <p className="text-primary-100 text-sm">Seu saldo</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Star className="w-6 h-6 fill-current" />
              <span className="text-3xl font-bold">{user?.points || 0}</span>
              <span className="text-primary-100">pontos</span>
            </div>
          </div>
        </Card>

        {/* Search Section */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Buscar Destinatário</h2>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Digite a matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="w-5 h-5" />}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>
                Buscar
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-sm text-gray-500">ou</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            <Button
              variant="outline"
              fullWidth
              onClick={openScanner}
            >
              <QrCode className="w-4 h-4 mr-2" />
              Escanear Carteirinha
            </Button>
          </div>
        </Card>

        {/* Selected User */}
        {selectedUser && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Destinatário</h2>
              <button
                onClick={clearSelection}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Avatar
                src={selectedUser.photo}
                alt={selectedUser.name}
                size="lg"
              />
              <div>
                <p className="font-semibold text-gray-800">{selectedUser.name}</p>
                <p className="text-sm text-gray-500">Mat.: {selectedUser.registration}</p>
              </div>
            </div>

            <div className="mt-4">
              <Input
                label="Quantidade de Pontos"
                type="number"
                min="1"
                max={user?.points}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Digite a quantidade..."
              />
              {user && parseInt(amount) > 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  Saldo após transferência: <strong>{user.points - (parseInt(amount) || 0)} pontos</strong>
                </p>
              )}
            </div>

            <Button
              fullWidth
              className="mt-4"
              onClick={handlePrepareTransfer}
              disabled={!amount || parseInt(amount) <= 0}
            >
              <Send className="w-4 h-4 mr-2" />
              Transferir Pontos
            </Button>
          </Card>
        )}

        {/* Instructions */}
        {!selectedUser && (
          <Card className="bg-gray-50">
            <div className="text-center">
              <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h3 className="font-medium text-gray-700">Como transferir</h3>
              <p className="text-sm text-gray-500 mt-2">
                Busque o destinatário pela matrícula ou escaneie o QR Code da carteirinha digital.
              </p>
            </div>
          </Card>
        )}

        {/* QR Scanner Modal */}
        <Modal
          isOpen={showScanner}
          onClose={closeScanner}
          title="Escanear Carteirinha"
          size="md"
        >
          <div className="space-y-4">
            {/* Scanner */}
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
              {cameraEnabled && (
                <div
                  id={QR_READER_CONTAINER_ID}
                  className="w-full"
                />
              )}
              {!cameraEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Iniciando câmera...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="p-4 bg-primary-50 rounded-lg">
              <h4 className="font-medium text-primary-800 mb-2">Instruções</h4>
              <ul className="text-sm text-primary-700 space-y-1">
                <li>Aponte para o QR Code da carteirinha</li>
                <li>Mantenha o dispositivo estável</li>
                <li>Aguarde o escaneamento automático</li>
              </ul>
            </div>

            <Button variant="outline" fullWidth onClick={closeScanner}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </Modal>

        {/* Confirmation Modal */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirmar Transferência"
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Você</p>
                  <p className="font-semibold">{user?.name}</p>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm text-gray-500">Destino</p>
                  <p className="font-semibold">{selectedUser?.name}</p>
                </div>
              </div>
            </div>

            <div className="text-center p-4 bg-accent-50 rounded-lg">
              <p className="text-sm text-accent-600">Quantidade</p>
              <p className="text-3xl font-bold text-accent-600">
                {amount} <span className="text-lg">pontos</span>
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </Button>
              <Button fullWidth onClick={handleConfirmTransfer}>
                Confirmar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};
