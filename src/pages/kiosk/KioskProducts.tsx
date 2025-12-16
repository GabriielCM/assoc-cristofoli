import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingCart, Star, ArrowLeft } from 'lucide-react';
import { KioskLayout } from './KioskLayout';
import { useStore } from '../../store/useStore';
import type { FridgeCategory, FridgeProduct } from '../../types';

interface CartItem {
  product: FridgeProduct;
  quantity: number;
}

const CATEGORY_TABS: { value: FridgeCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'Bebidas', label: 'Bebidas' },
  { value: 'Snacks', label: 'Snacks' },
  { value: 'Refeicoes', label: 'Refeicoes' }
];

export const KioskProducts: React.FC = () => {
  const navigate = useNavigate();
  const { getActiveFridgeProducts } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<FridgeCategory | 'all'>('all');
  const [cart, setCart] = useState<CartItem[]>([]);

  const products = getActiveFridgeProducts();
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.pricePoints * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getCartQuantity = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item?.quantity || 0;
  };

  const addToCart = (product: FridgeProduct) => {
    const currentQty = getCartQuantity(product.id);
    if (currentQty >= product.stockQuantity) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.product.id !== productId);
    });
  };

  const handleContinue = () => {
    if (cart.length === 0) return;
    // Store cart in sessionStorage for the cart page
    sessionStorage.setItem('kiosk-cart', JSON.stringify(cart));
    navigate('/kiosk/cart');
  };

  return (
    <KioskLayout>
      <div className="flex flex-col h-full">
        {/* Back Button */}
        <button
          onClick={() => navigate('/kiosk')}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-800 mb-4 self-start"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedCategory(tab.value)}
              className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-colors ${
                selectedCategory === tab.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const quantity = getCartQuantity(product.id);
              const isOutOfStock = product.stockQuantity === 0;
              const isMaxed = quantity >= product.stockQuantity;

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-xl p-4 shadow-sm ${isOutOfStock ? 'opacity-50' : ''}`}
                >
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                  <div className="flex items-center gap-1 text-accent-500 mt-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold">{product.pricePoints}</span>
                    <span className="text-xs text-gray-500">pts</span>
                  </div>

                  {isOutOfStock ? (
                    <p className="text-red-500 text-sm mt-3">Esgotado</p>
                  ) : quantity > 0 ? (
                    <div className="flex items-center justify-between mt-3">
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="text-xl font-bold">{quantity}</span>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={isMaxed}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isMaxed
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-primary-500 text-white hover:bg-primary-600'
                        }`}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full mt-3 bg-primary-500 text-white py-2 rounded-lg font-medium hover:bg-primary-600"
                    >
                      Adicionar
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum produto disponivel nesta categoria</p>
            </div>
          )}
        </div>

        {/* Floating Cart Bar */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <ShoppingCart className="w-8 h-8 text-primary-500" />
                  <span className="absolute -top-2 -right-2 bg-accent-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Total</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-accent-500 fill-current" />
                    <span className="text-xl font-bold text-accent-500">{cartTotal}</span>
                    <span className="text-gray-500">pontos</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleContinue}
                className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-xl font-bold text-lg"
              >
                Continuar
              </button>
            </div>
          </div>
        )}
      </div>
    </KioskLayout>
  );
};
