import React, { useState } from 'react';
import { Plus, Edit, Trash2, Users, DollarSign } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Card, Button, Badge, Modal, Input, TextArea, Alert } from '../../components/ui';
import { useStore } from '../../store/useStore';
import type { Space } from '../../types';

export const SpacesManagement: React.FC = () => {
  const { spaces, addSpace, updateSpace, deleteSpace, bookings } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    capacity: 0,
    description: '',
    image: '',
    amenities: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const spaceData = {
      name: formData.name,
      price: formData.price,
      capacity: formData.capacity,
      description: formData.description,
      image: formData.image,
      amenities: formData.amenities.split(',').map((a) => a.trim()).filter(Boolean)
    };

    if (editingSpace) {
      updateSpace(editingSpace.id, spaceData);
      setAlert({ type: 'success', message: 'Espaço atualizado com sucesso!' });
    } else {
      addSpace(spaceData);
      setAlert({ type: 'success', message: 'Espaço criado com sucesso!' });
    }

    setShowModal(false);
    resetForm();
  };

  const handleEdit = (space: Space) => {
    setEditingSpace(space);
    setFormData({
      name: space.name,
      price: space.price,
      capacity: space.capacity,
      description: space.description,
      image: space.image,
      amenities: space.amenities.join(', ')
    });
    setShowModal(true);
  };

  const handleDelete = (spaceId: string) => {
    const hasBookings = bookings.some((b) => b.spaceId === spaceId && b.status !== 'cancelled');
    if (hasBookings) {
      setAlert({ type: 'error', message: 'Não é possível excluir um espaço com locações ativas.' });
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este espaço?')) {
      deleteSpace(spaceId);
      setAlert({ type: 'success', message: 'Espaço excluído com sucesso!' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      capacity: 0,
      description: '',
      image: '',
      amenities: ''
    });
    setEditingSpace(null);
  };

  const getSpaceBookingsCount = (spaceId: string) => {
    return bookings.filter((b) => b.spaceId === spaceId && b.status !== 'cancelled').length;
  };

  return (
    <Layout title="Gerenciar Espaços" showBottomNav={false}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Alert */}
        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Espaços</h1>
            <p className="text-gray-500">{spaces.length} espaços cadastrados</p>
          </div>
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Espaço
          </Button>
        </div>

        {/* Spaces Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {spaces.map((space) => (
            <Card key={space.id} className="overflow-hidden p-0">
              <img
                src={space.image}
                alt={space.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">{space.name}</h3>
                  <Badge variant="primary">
                    {getSpaceBookingsCount(space.id)} locações
                  </Badge>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{space.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {space.amenities.slice(0, 4).map((amenity) => (
                    <span
                      key={amenity}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                    >
                      {amenity}
                    </span>
                  ))}
                  {space.amenities.length > 4 && (
                    <span className="text-xs text-gray-500">+{space.amenities.length - 4}</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{space.capacity}</span>
                    </div>
                    <div className="flex items-center gap-1 text-secondary-500">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold">
                        R$ {space.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(space)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(space.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Space Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); resetForm(); }}
          title={editingSpace ? 'Editar Espaço' : 'Novo Espaço'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome do Espaço"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Preço (R$)"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
              <Input
                label="Capacidade (pessoas)"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <TextArea
              label="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />

            <Input
              label="URL da Imagem"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://exemplo.com/imagem.jpg"
              required
            />

            <Input
              label="Comodidades (separadas por vírgula)"
              value={formData.amenities}
              onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
              placeholder="Churrasqueira, Piscina, Estacionamento..."
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" fullWidth onClick={() => { setShowModal(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" fullWidth>
                {editingSpace ? 'Salvar Alterações' : 'Criar Espaço'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};
