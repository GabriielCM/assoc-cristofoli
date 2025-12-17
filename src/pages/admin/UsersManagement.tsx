import React, { useState, useEffect } from 'react';
import { UserPlus, Edit, Trash2, Search, Star, Shield } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Card, Button, Badge, Modal, Input, Select, Alert, Loader } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { User, UserRole } from '../../types';

export const UsersManagement: React.FC = () => {
  const { users, fetchUsers, addUser, updateUser, deleteUser, adjustUserPoints, isLoading } = useStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    birthDate: '',
    registration: '',
    photo: '',
    role: 'user' as UserRole
  });

  const [pointsAdjustment, setPointsAdjustment] = useState({
    userId: '',
    points: 0,
    reason: ''
  });

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.registration.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      updateUser(editingUser.id, formData);
      setAlert({ type: 'success', message: 'Usuário atualizado com sucesso!' });
    } else {
      addUser(formData);
      setAlert({ type: 'success', message: 'Usuário criado com sucesso!' });
    }

    setShowModal(false);
    resetForm();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password,
      birthDate: user.birthDate,
      registration: user.registration,
      photo: user.photo,
      role: user.role
    });
    setShowModal(true);
  };

  const handleDelete = (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteUser(userId);
      setAlert({ type: 'success', message: 'Usuário excluído com sucesso!' });
    }
  };

  const handleAdjustPoints = () => {
    if (!pointsAdjustment.userId || pointsAdjustment.points === 0) return;

    adjustUserPoints(
      pointsAdjustment.userId,
      pointsAdjustment.points,
      pointsAdjustment.reason
    );

    setAlert({
      type: 'success',
      message: `Pontos ${pointsAdjustment.points > 0 ? 'adicionados' : 'removidos'} com sucesso!`
    });
    setShowPointsModal(false);
    setPointsAdjustment({ userId: '', points: 0, reason: '' });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      birthDate: '',
      registration: '',
      photo: '',
      role: 'user'
    });
    setEditingUser(null);
  };

  const openPointsModal = (user: User) => {
    setPointsAdjustment({ userId: user.id, points: 0, reason: '' });
    setShowPointsModal(true);
  };

  return (
    <Layout title="Gerenciar Usuários" showBottomNav={false}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Alert */}
        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
            <p className="text-gray-500">{users.length} usuários cadastrados</p>
          </div>
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Search */}
        <Card>
          <Input
            placeholder="Buscar por nome, email ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </Card>

        {/* Users List */}
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={user.photo}
                    alt={user.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{user.name}</h3>
                      <Badge variant={user.role === 'admin' ? 'primary' : 'secondary'} size="sm">
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role === 'admin' ? 'Admin' : 'Associado'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400">Mat.: {user.registration}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-accent-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-bold">{user.points}</span>
                    </div>
                    <p className="text-xs text-gray-500">pontos</p>
                  </div>

                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-medium text-gray-800">
                      {format(parseISO(user.validUntil), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                    <p className="text-xs text-gray-500">validade</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPointsModal(user)}
                      title="Ajustar pontos"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      title="Excluir"
                      disabled={user.role === 'admin'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* User Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); resetForm(); }}
          title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nome Completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Senha"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
                placeholder={editingUser ? 'Deixe em branco para manter' : ''}
              />
              <Input
                label="Data de Nascimento"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                required
              />
              <Input
                label="Matrícula"
                value={formData.registration}
                onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
                required
              />
              <Select
                label="Tipo de Usuário"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                options={[
                  { value: 'user', label: 'Associado' },
                  { value: 'admin', label: 'Administrador' }
                ]}
              />
            </div>
            <Input
              label="URL da Foto"
              value={formData.photo}
              onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
              placeholder="https://exemplo.com/foto.jpg"
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" fullWidth onClick={() => { setShowModal(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" fullWidth>
                {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Points Adjustment Modal */}
        <Modal
          isOpen={showPointsModal}
          onClose={() => setShowPointsModal(false)}
          title="Ajustar Pontos"
          size="sm"
        >
          <div className="space-y-4">
            <Input
              label="Pontos (positivo para adicionar, negativo para remover)"
              type="number"
              value={pointsAdjustment.points}
              onChange={(e) => setPointsAdjustment({ ...pointsAdjustment, points: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Motivo"
              value={pointsAdjustment.reason}
              onChange={(e) => setPointsAdjustment({ ...pointsAdjustment, reason: e.target.value })}
              placeholder="Ex: Ajuste manual, correção, etc."
            />
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" fullWidth onClick={() => setShowPointsModal(false)}>
                Cancelar
              </Button>
              <Button fullWidth onClick={handleAdjustPoints}>
                Ajustar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};
