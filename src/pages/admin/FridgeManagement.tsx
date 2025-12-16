import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Package, Star, Power, PowerOff } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Card, Button, Badge, Modal, Input, Select, Alert } from '../../components/ui';
import { useStore } from '../../store/useStore';
import type { FridgeProduct, FridgeCategory } from '../../types';

const CATEGORIES: { value: FridgeCategory; label: string }[] = [
  { value: 'Bebidas', label: 'Bebidas' },
  { value: 'Snacks', label: 'Snacks' },
  { value: 'Refeicoes', label: 'Refeições' }
];

export const FridgeManagement: React.FC = () => {
  const { fridgeProducts, addFridgeProduct, updateFridgeProduct, deleteFridgeProduct, fridgeOrders } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FridgeCategory | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FridgeProduct | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Bebidas' as FridgeCategory,
    pricePoints: 10,
    stockQuantity: 0,
    image: '',
    isActive: true
  });

  const filteredProducts = fridgeProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProduct) {
      updateFridgeProduct(editingProduct.id, formData);
      setAlert({ type: 'success', message: 'Produto atualizado com sucesso!' });
    } else {
      addFridgeProduct(formData);
      setAlert({ type: 'success', message: 'Produto criado com sucesso!' });
    }

    setShowModal(false);
    resetForm();
  };

  const handleEdit = (product: FridgeProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      pricePoints: product.pricePoints,
      stockQuantity: product.stockQuantity,
      image: product.image,
      isActive: product.isActive
    });
    setShowModal(true);
  };

  const handleDelete = (productId: string) => {
    // Check if product has pending orders
    const hasPendingOrders = fridgeOrders.some(
      (order) => order.status === 'pending_payment' &&
        order.items.some((item) => item.productId === productId)
    );

    if (hasPendingOrders) {
      setAlert({ type: 'error', message: 'Não é possível excluir um produto com pedidos pendentes.' });
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      deleteFridgeProduct(productId);
      setAlert({ type: 'success', message: 'Produto excluído com sucesso!' });
    }
  };

  const handleToggleActive = (product: FridgeProduct) => {
    updateFridgeProduct(product.id, { isActive: !product.isActive });
    setAlert({
      type: 'success',
      message: `Produto ${!product.isActive ? 'ativado' : 'desativado'} com sucesso!`
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Bebidas',
      pricePoints: 10,
      stockQuantity: 0,
      image: '',
      isActive: true
    });
    setEditingProduct(null);
  };

  const getCategoryVariant = (category: FridgeCategory) => {
    switch (category) {
      case 'Bebidas': return 'primary';
      case 'Snacks': return 'accent';
      case 'Refeicoes': return 'secondary';
      default: return 'gray';
    }
  };

  return (
    <Layout title="Gerenciar Geladeira" showBottomNav={false}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Alert */}
        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Geladeira</h1>
            <p className="text-gray-500">{fridgeProducts.length} produtos cadastrados</p>
          </div>
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>

        {/* Search and Filter */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5" />}
              />
            </div>
            <div className="sm:w-48">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as FridgeCategory | 'all')}
                options={[
                  { value: 'all', label: 'Todas Categorias' },
                  ...CATEGORIES
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className={!product.isActive ? 'opacity-60' : ''}>
              <div className="space-y-3">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                  </div>
                  <Badge variant={getCategoryVariant(product.category)} size="sm">
                    {product.category}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-accent-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold">{product.pricePoints}</span>
                    <span className="text-xs text-gray-500">pts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className={`font-medium ${product.stockQuantity <= 5 ? 'text-red-500' : 'text-gray-600'}`}>
                      {product.stockQuantity} un.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge variant={product.isActive ? 'success' : 'gray'} size="sm">
                    {product.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(product)}
                      title={product.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {product.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <Card className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum produto encontrado</p>
          </Card>
        )}

        {/* Product Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); resetForm(); }}
          title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome do Produto"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              label="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Categoria"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as FridgeCategory })}
                options={CATEGORIES}
              />
              <Input
                label="Preço (pontos)"
                type="number"
                min="1"
                value={formData.pricePoints}
                onChange={(e) => setFormData({ ...formData, pricePoints: parseInt(e.target.value) || 1 })}
                required
              />
              <Input
                label="Estoque"
                type="number"
                min="0"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <Input
              label="URL da Imagem"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://exemplo.com/imagem.jpg"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Produto ativo (disponível para venda)
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" fullWidth onClick={() => { setShowModal(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" fullWidth>
                {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};
