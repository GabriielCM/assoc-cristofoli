import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, Star, ArrowLeft, QrCode } from 'lucide-react';
import { KioskLayout } from './KioskLayout';
import { useStore } from '../../store/useStore';
import type { FridgeProduct } from '../../types';

interface CartItem {
  product: FridgeProduct;
  quantity: number;
}

export const KioskCart: React.FC = () => {
  const navigate = useNavigate();
  const { createFridgeOrder, fridgeProducts, fetchFridgeProducts } = useStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  useEffect(() => {
    fetchFridgeProducts();
  }, [fetchFridgeProducts]);

  useEffect(() => {
    const stored = sessionStorage.getItem('kiosk-cart');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Refresh product data from store
        const refreshedCart = parsed.map((item: CartItem) => {
          const freshProduct = fridgeProducts.find((p) => p.id === item.product.id);
          return freshProduct ? { product: freshProduct, quantity: item.quantity } : null;
        }).filter(Boolean);
        setCart(refreshedCart);
      } catch {
        navigate('/kiosk/products');
      }
    } else {
      navigate('/kiosk/products');
    }
  }, [navigate, fridgeProducts]);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.pricePoints * item.quantity, 0);

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((i) =>
          i.product.id === productId
            ? { ...i, quantity: Math.min(newQuantity, i.product.stockQuantity) }
            : i
        )
      );
    }
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleGenerateQR = async () => {
    if (cart.length === 0 || isCreatingOrder) return;
    setIsCreatingOrder(true);

    const items = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity
    }));

    const order = await createFridgeOrder(items);
    if (order) {
      sessionStorage.removeItem('kiosk-cart');
      navigate(`/kiosk/payment/${order.id}`);
    } else {
      setIsCreatingOrder(false);
    }
  };

  useEffect(() => {
    if (cart.length === 0 && !sessionStorage.getItem('kiosk-cart')) {
      navigate('/kiosk/products');
    } else {
      sessionStorage.setItem('kiosk-cart', JSON.stringify(cart));
    }
  }, [cart, navigate]);

  return (
    <KioskLayout>
      <div className="flex flex-col h-full">
        {/* Back Button */}
        <button
          onClick={() => navigate('/kiosk/products')}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-800 mb-4 self-start"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar aos produtos</span>
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Seu Carrinho</h2>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4"
            >
              {item.product.image && (
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{item.product.name}</h3>
                <div className="flex items-center gap-1 text-accent-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold">{item.product.pricePoints}</span>
                  <span className="text-xs text-gray-500">pts/un</span>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-xl font-bold w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stockQuantity}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.quantity >= item.product.stockQuantity
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right min-w-[80px]">
                <div className="flex items-center gap-1 justify-end text-accent-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-xl font-bold">
                    {item.product.pricePoints * item.quantity}
                  </span>
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeItem(item.product.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary and Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xl font-semibold text-gray-800">Total</span>
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 text-accent-500 fill-current" />
              <span className="text-3xl font-bold text-accent-500">{cartTotal}</span>
              <span className="text-gray-500">pontos</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/kiosk/products')}
              className="flex-1 py-4 rounded-xl font-bold text-lg border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Adicionar Mais
            </button>
            <button
              onClick={handleGenerateQR}
              disabled={cart.length === 0 || isCreatingOrder}
              className="flex-1 py-4 rounded-xl font-bold text-lg bg-primary-500 text-white hover:bg-primary-600 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <QrCode className="w-6 h-6" />
              Gerar QR de Pagamento
            </button>
          </div>
        </div>
      </div>
    </KioskLayout>
  );
};
