import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Edit, Trash2, Star, Calendar, Clock, QrCode, RefreshCw, Users } from 'lucide-react';
import { Layout } from '../../components/layout';
import { Card, Button, Badge, Modal, Input, TextArea, Alert } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { format, parseISO, isWithinInterval, isAfter, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Event } from '../../types';

export const EventsManagement: React.FC = () => {
  const { events, addEvent, updateEvent, deleteEvent, refreshEventQRCode, pointTransactions } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    points: 10,
    maxScansPerUser: 1,
    image: '',
    location: ''
  });

  const now = new Date();

  const getEventStatus = (event: Event) => {
    const start = parseISO(event.startDate);
    const end = parseISO(event.endDate);

    if (isWithinInterval(now, { start, end })) return 'active';
    if (isAfter(start, now)) return 'upcoming';
    return 'past';
  };

  const getEventParticipants = (eventId: string) => {
    const transactions = pointTransactions.filter((t) => t.eventId === eventId);
    return new Set(transactions.map((t) => t.userId)).size;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const eventData = {
      name: formData.name,
      description: formData.description,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      points: formData.points,
      maxScansPerUser: formData.maxScansPerUser,
      image: formData.image || undefined,
      location: formData.location || undefined
    };

    if (editingEvent) {
      updateEvent(editingEvent.id, eventData);
      setAlert({ type: 'success', message: 'Evento atualizado com sucesso!' });
    } else {
      addEvent(eventData);
      setAlert({ type: 'success', message: 'Evento criado com sucesso!' });
    }

    setShowModal(false);
    resetForm();
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      startDate: format(parseISO(event.startDate), "yyyy-MM-dd'T'HH:mm"),
      endDate: format(parseISO(event.endDate), "yyyy-MM-dd'T'HH:mm"),
      points: event.points,
      maxScansPerUser: event.maxScansPerUser,
      image: event.image || '',
      location: event.location || ''
    });
    setShowModal(true);
  };

  const handleDelete = (eventId: string) => {
    const hasParticipants = pointTransactions.some((t) => t.eventId === eventId);
    if (hasParticipants) {
      setAlert({ type: 'error', message: 'Não é possível excluir um evento com participantes.' });
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      deleteEvent(eventId);
      setAlert({ type: 'success', message: 'Evento excluído com sucesso!' });
    }
  };

  const handleShowQR = (event: Event) => {
    setSelectedEvent(event);
    setShowQRModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      points: 10,
      maxScansPerUser: 1,
      image: '',
      location: ''
    });
    setEditingEvent(null);
  };

  const statusConfig = {
    active: { label: 'Ativo', variant: 'success' as const },
    upcoming: { label: 'Em breve', variant: 'primary' as const },
    past: { label: 'Encerrado', variant: 'gray' as const }
  };

  return (
    <Layout title="Gerenciar Eventos" showBottomNav={false}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Alert */}
        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Eventos</h1>
            <p className="text-gray-500">{events.length} eventos cadastrados</p>
          </div>
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Evento
          </Button>
        </div>

        {/* Events List */}
        <div className="grid gap-4">
          {events.map((event) => {
            const status = getEventStatus(event);
            const participants = getEventParticipants(event.id);

            return (
              <Card key={event.id}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    {event.image && (
                      <img
                        src={event.image}
                        alt={event.name}
                        className="w-20 h-20 rounded-lg object-cover hidden sm:block"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">{event.name}</h3>
                        <Badge variant={statusConfig[status].variant}>
                          {statusConfig[status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1 mb-2">{event.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(parseISO(event.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(parseISO(event.startDate), 'HH:mm')} - {format(parseISO(event.endDate), 'HH:mm')}
                        </div>
                        <div className="flex items-center gap-1 text-accent-500">
                          <Star className="w-4 h-4" />
                          {event.points} pts
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {participants} participantes
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {status === 'active' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleShowQR(event)}
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        QR Code
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {events.length === 0 && (
          <Card className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum evento cadastrado</p>
          </Card>
        )}

        {/* Event Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); resetForm(); }}
          title={editingEvent ? 'Editar Evento' : 'Novo Evento'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome do Evento"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <TextArea
              label="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Data/Hora Início"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              <Input
                label="Data/Hora Fim"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Pontos por Participação"
                type="number"
                min="1"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 10 })}
                required
              />
              <Input
                label="Limite de Scans por Usuário"
                type="number"
                min="1"
                value={formData.maxScansPerUser}
                onChange={(e) => setFormData({ ...formData, maxScansPerUser: parseInt(e.target.value) || 1 })}
                required
              />
            </div>

            <Input
              label="Local (opcional)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Salão de Festas"
            />

            <Input
              label="URL da Imagem (opcional)"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://exemplo.com/imagem.jpg"
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" fullWidth onClick={() => { setShowModal(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" fullWidth>
                {editingEvent ? 'Salvar Alterações' : 'Criar Evento'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* QR Code Modal */}
        <Modal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          title={`QR Code - ${selectedEvent?.name}`}
          size="md"
        >
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <div className="qr-container p-4 rounded-xl bg-white shadow-inner">
                  <QRCodeSVG
                    value={JSON.stringify({
                      eventId: selectedEvent.id,
                      secret: selectedEvent.qrCodeSecret,
                      timestamp: Date.now()
                    })}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="flex items-center gap-2 mt-4 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    Expira em {Math.max(0, differenceInMinutes(parseISO(selectedEvent.qrCodeExpiresAt), new Date()))} minutos
                  </span>
                </div>

                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => refreshEventQRCode(selectedEvent.id)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Renovar QR Code
                </Button>
              </div>

              <div className="p-4 bg-primary-50 rounded-lg">
                <h4 className="font-medium text-primary-800 mb-2">Instruções</h4>
                <ul className="text-sm text-primary-700 space-y-1">
                  <li>• Exiba este QR Code para os participantes escanearem</li>
                  <li>• O QR Code é renovado automaticamente a cada hora</li>
                  <li>• Clique em "Renovar" para gerar um novo código imediatamente</li>
                  <li>• Limite: {selectedEvent.maxScansPerUser} scan(s) por usuário</li>
                </ul>
              </div>

              <div className="text-center">
                <Badge variant="accent">+{selectedEvent.points} pontos por scan</Badge>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};
