import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Refrigerator } from 'lucide-react';
import { KioskLayout } from './KioskLayout';

export const KioskHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <KioskLayout showLogo={false}>
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="w-24 h-24 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Refrigerator className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary-700">Geladeira</h1>
          <p className="text-lg text-primary-500">Associacao Cristofoli</p>
        </div>

        {/* Main Button */}
        <button
          onClick={() => navigate('/kiosk/products')}
          className="bg-primary-500 hover:bg-primary-600 text-white rounded-2xl p-8 shadow-xl transition-all transform hover:scale-105 active:scale-95"
        >
          <ShoppingCart className="w-16 h-16 mx-auto mb-4" />
          <span className="text-2xl font-bold block">Fazer Pedido</span>
          <span className="text-primary-200 text-sm mt-2 block">Toque para comecar</span>
        </button>

        {/* Instructions */}
        <div className="mt-12 text-center text-primary-600">
          <p className="text-sm">Selecione seus itens e pague com seus pontos</p>
          <p className="text-xs text-primary-400 mt-1">Use o app para escanear o QR Code de pagamento</p>
        </div>
      </div>
    </KioskLayout>
  );
};
