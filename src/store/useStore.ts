import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { addYears, addHours, isWithinInterval, parseISO } from 'date-fns';
import type { AppState, User, Space, Booking, Event, PointTransaction } from '../types';

// Generate random QR secret
const generateQRSecret = (): string => {
  return uuidv4().replace(/-/g, '').substring(0, 16);
};

// Default spaces
const defaultSpaces: Space[] = [
  {
    id: 'space-1',
    name: 'Área Gourmet',
    price: 350.00,
    capacity: 30,
    description: 'Espaço completo com churrasqueira, forno de pizza, bancadas em granito e área de estar. Ideal para confraternizações e eventos familiares.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    amenities: ['Churrasqueira', 'Forno de Pizza', 'Geladeira', 'Freezer', 'Utensílios', 'Mesas e Cadeiras', 'Som Ambiente', 'TV']
  },
  {
    id: 'space-2',
    name: 'Salão de Festas',
    price: 1250.00,
    capacity: 150,
    description: 'Amplo salão climatizado para eventos de grande porte. Conta com palco, sistema de som e iluminação profissional, copa de apoio e estacionamento.',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
    amenities: ['Ar Condicionado', 'Palco', 'Sistema de Som', 'Iluminação Profissional', 'Copa', 'Banheiros', 'Estacionamento', 'Acessibilidade']
  }
];

// Default admin user
const defaultAdmin: User = {
  id: 'admin-1',
  email: 'admin@cristofoli.com.br',
  password: 'admin123',
  name: 'Administrador',
  birthDate: '1990-01-01',
  registration: 'ADM001',
  photo: 'https://ui-avatars.com/api/?name=Admin&background=0066CC&color=fff&size=200',
  role: 'admin',
  points: 0,
  createdAt: new Date().toISOString(),
  validUntil: addYears(new Date(), 1).toISOString()
};

// Default demo user
const defaultUser: User = {
  id: 'user-1',
  email: 'associado@cristofoli.com.br',
  password: 'user123',
  name: 'João Silva',
  birthDate: '1985-05-15',
  registration: 'ASS001',
  photo: 'https://ui-avatars.com/api/?name=Joao+Silva&background=00A86B&color=fff&size=200',
  role: 'user',
  points: 150,
  createdAt: new Date().toISOString(),
  validUntil: addYears(new Date(), 1).toISOString()
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: [defaultAdmin, defaultUser],
      spaces: defaultSpaces,
      bookings: [],
      events: [],
      pointTransactions: [],

      // User actions
      addUser: (userData) => {
        const now = new Date();
        const newUser: User = {
          ...userData,
          id: uuidv4(),
          points: 0,
          createdAt: now.toISOString(),
          validUntil: addYears(now, 1).toISOString()
        };
        set((state) => ({ users: [...state.users, newUser] }));
        return newUser;
      },

      updateUser: (id, userData) => {
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, ...userData } : user
          )
        }));
      },

      deleteUser: (id) => {
        set((state) => ({
          users: state.users.filter((user) => user.id !== id)
        }));
      },

      getUserById: (id) => {
        return get().users.find((user) => user.id === id);
      },

      // Space actions
      addSpace: (spaceData) => {
        const newSpace: Space = {
          ...spaceData,
          id: uuidv4()
        };
        set((state) => ({ spaces: [...state.spaces, newSpace] }));
        return newSpace;
      },

      updateSpace: (id, spaceData) => {
        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === id ? { ...space, ...spaceData } : space
          )
        }));
      },

      deleteSpace: (id) => {
        set((state) => ({
          spaces: state.spaces.filter((space) => space.id !== id)
        }));
      },

      getSpaceById: (id) => {
        return get().spaces.find((space) => space.id === id);
      },

      // Booking actions
      addBooking: (bookingData) => {
        const { isDateAvailable, getSpaceById } = get();

        if (!isDateAvailable(bookingData.spaceId, bookingData.date)) {
          return null;
        }

        const space = getSpaceById(bookingData.spaceId);
        const newBooking: Booking = {
          ...bookingData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          totalPrice: space?.price || 0
        };
        set((state) => ({ bookings: [...state.bookings, newBooking] }));
        return newBooking;
      },

      updateBooking: (id, bookingData) => {
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === id ? { ...booking, ...bookingData } : booking
          )
        }));
      },

      cancelBooking: (id) => {
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === id ? { ...booking, status: 'cancelled' } : booking
          )
        }));
      },

      getBookingsByUser: (userId) => {
        return get().bookings.filter((booking) => booking.userId === userId);
      },

      getBookingsBySpace: (spaceId) => {
        return get().bookings.filter((booking) => booking.spaceId === spaceId);
      },

      isDateAvailable: (spaceId, date) => {
        const bookings = get().bookings;
        return !bookings.some(
          (booking) =>
            booking.spaceId === spaceId &&
            booking.date === date &&
            booking.status !== 'cancelled'
        );
      },

      // Event actions
      addEvent: (eventData) => {
        const newEvent: Event = {
          ...eventData,
          id: uuidv4(),
          qrCodeSecret: generateQRSecret(),
          qrCodeExpiresAt: addHours(new Date(), 1).toISOString()
        };
        set((state) => ({ events: [...state.events, newEvent] }));
        return newEvent;
      },

      updateEvent: (id, eventData) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...eventData } : event
          )
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((event) => event.id !== id)
        }));
      },

      getEventById: (id) => {
        return get().events.find((event) => event.id === id);
      },

      refreshEventQRCode: (eventId) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  qrCodeSecret: generateQRSecret(),
                  qrCodeExpiresAt: addHours(new Date(), 1).toISOString()
                }
              : event
          )
        }));
      },

      getActiveEvents: () => {
        const now = new Date();
        return get().events.filter((event) => {
          const start = parseISO(event.startDate);
          const end = parseISO(event.endDate);
          return isWithinInterval(now, { start, end });
        });
      },

      // Points actions
      scanEventQR: (userId, eventId, qrSecret) => {
        const event = get().getEventById(eventId);
        const user = get().getUserById(userId);

        if (!event || !user) {
          return { success: false, message: 'Evento ou usuário não encontrado.' };
        }

        // Check if event is active
        const now = new Date();
        const start = parseISO(event.startDate);
        const end = parseISO(event.endDate);

        if (!isWithinInterval(now, { start, end })) {
          return { success: false, message: 'Este evento não está ativo no momento.' };
        }

        // Check QR code validity
        const qrExpiry = parseISO(event.qrCodeExpiresAt);
        if (now > qrExpiry || qrSecret !== event.qrCodeSecret) {
          return { success: false, message: 'QR Code expirado ou inválido.' };
        }

        // Check scan limit
        const userScans = get().pointTransactions.filter(
          (t) => t.userId === userId && t.eventId === eventId
        );

        if (userScans.length >= event.maxScansPerUser) {
          return { success: false, message: `Limite de ${event.maxScansPerUser} escaneamento(s) por usuário atingido.` };
        }

        // Add points
        const transaction: PointTransaction = {
          id: uuidv4(),
          userId,
          eventId,
          points: event.points,
          timestamp: now.toISOString(),
          scanCount: userScans.length + 1
        };

        set((state) => ({
          pointTransactions: [...state.pointTransactions, transaction],
          users: state.users.map((u) =>
            u.id === userId ? { ...u, points: u.points + event.points } : u
          )
        }));

        return {
          success: true,
          message: `Parabéns! Você ganhou ${event.points} pontos!`,
          points: event.points
        };
      },

      getUserPoints: (userId) => {
        const user = get().getUserById(userId);
        return user?.points || 0;
      },

      getUserPointHistory: (userId) => {
        return get().pointTransactions
          .filter((t) => t.userId === userId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },

      adjustUserPoints: (userId, points, _reason) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId ? { ...u, points: Math.max(0, u.points + points) } : u
          )
        }));
      },

      // Initialize data
      initializeData: () => {
        const state = get();
        if (state.users.length === 0) {
          set({
            users: [defaultAdmin, defaultUser],
            spaces: defaultSpaces,
            bookings: [],
            events: [],
            pointTransactions: []
          });
        }
      }
    }),
    {
      name: 'ahub-storage'
    }
  )
);
