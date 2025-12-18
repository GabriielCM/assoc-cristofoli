import { create } from 'zustand';
import type { User, Space, Booking, Event, PointTransaction, FridgeProduct, FridgeOrder } from '../types';
import { userService } from '../services/userService';
import { spaceService } from '../services/spaceService';
import { bookingService } from '../services/bookingService';
import { eventService } from '../services/eventService';
import { pointService } from '../services/pointService';
import { fridgeService } from '../services/fridgeService';

type UserWithoutPassword = Omit<User, 'password'>;

interface AppState {
  // Data
  users: UserWithoutPassword[];
  spaces: Space[];
  bookings: Booking[];
  events: Event[];
  pointTransactions: PointTransaction[];
  fridgeProducts: FridgeProduct[];
  fridgeOrders: FridgeOrder[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // User actions
  fetchUsers: () => Promise<void>;
  addUser: (userData: Omit<User, 'id' | 'points' | 'createdAt' | 'validUntil'>) => Promise<UserWithoutPassword | null>;
  updateUser: (id: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getUserById: (id: string) => UserWithoutPassword | undefined;
  fetchUserById: (id: string) => Promise<UserWithoutPassword | null>;
  getUserByRegistration: (registration: string) => Promise<UserWithoutPassword | null>;
  adjustUserPoints: (userId: string, points: number, reason: string) => Promise<void>;

  // Space actions
  fetchSpaces: () => Promise<void>;
  addSpace: (spaceData: Omit<Space, 'id'>) => Promise<Space | null>;
  updateSpace: (id: string, spaceData: Partial<Space>) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
  getSpaceById: (id: string) => Space | undefined;

  // Booking actions
  fetchBookings: () => Promise<void>;
  addBooking: (bookingData: { spaceId: string; date: string }) => Promise<Booking | null>;
  updateBooking: (id: string, status: 'pending' | 'confirmed' | 'cancelled') => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  getBookingsByUser: (userId: string) => Booking[];
  isDateAvailable: (spaceId: string, date: string) => Promise<boolean>;

  // Event actions
  fetchEvents: () => Promise<void>;
  addEvent: (eventData: Omit<Event, 'id' | 'qrCodeSecret' | 'qrCodeExpiresAt'>) => Promise<Event | null>;
  updateEvent: (id: string, eventData: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEventById: (id: string) => Event | undefined;
  refreshEventQRCode: (eventId: string) => Promise<void>;
  getActiveEvents: () => Event[];
  scanEventQR: (eventId: string, qrSecret: string) => Promise<{
    success: boolean;
    message: string;
    points?: number;
    totalPoints?: number;
    scanCount?: number;
    maxScans?: number;
  }>;

  // Points actions
  fetchPointHistory: (userId: string) => Promise<void>;
  getUserPoints: (userId: string) => number;
  getUserPointHistory: (userId: string) => PointTransaction[];
  transferPoints: (toUserId: string, points: number) => Promise<{ success: boolean; message: string }>;

  // Fridge Product actions
  fetchFridgeProducts: () => Promise<void>;
  addFridgeProduct: (productData: Omit<FridgeProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<FridgeProduct | null>;
  updateFridgeProduct: (id: string, productData: Partial<FridgeProduct>) => Promise<void>;
  deleteFridgeProduct: (id: string) => Promise<void>;
  getFridgeProductById: (id: string) => FridgeProduct | undefined;
  getActiveFridgeProducts: () => FridgeProduct[];

  // Fridge Order actions
  fetchFridgeOrders: () => Promise<void>;
  createFridgeOrder: (items: Array<{ productId: string; quantity: number }>) => Promise<FridgeOrder | null>;
  payFridgeOrder: (orderId: string, qrSecret: string) => Promise<{ success: boolean; message: string }>;
  cancelFridgeOrder: (orderId: string) => Promise<void>;
  markOrderCollected: (orderId: string) => Promise<void>;
  getFridgeOrderById: (id: string) => FridgeOrder | undefined;

  // Clear error
  clearError: () => void;
}

export const useStore = create<AppState>()((set, get) => ({
  users: [],
  spaces: [],
  bookings: [],
  events: [],
  pointTransactions: [],
  fridgeProducts: [],
  fridgeOrders: [],
  isLoading: false,
  error: null,

  // User actions
  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const users = await userService.getAll();
      set({ users, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao carregar usuários', isLoading: false });
    }
  },

  addUser: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const user = await userService.create(userData as Parameters<typeof userService.create>[0]);
      set((state) => ({ users: [...state.users, user], isLoading: false }));
      return user;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao criar usuário', isLoading: false });
      return null;
    }
  },

  updateUser: async (id, userData) => {
    set({ isLoading: true, error: null });
    try {
      const user = await userService.update(id, userData);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? user : u)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao atualizar usuário', isLoading: false });
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await userService.delete(id);
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao deletar usuário', isLoading: false });
    }
  },

  getUserById: (id) => get().users.find((u) => u.id === id),

  fetchUserById: async (id) => {
    try {
      const user = await userService.getById(id);
      // Update local cache
      set((state) => {
        const exists = state.users.some((u) => u.id === id);
        if (exists) {
          return { users: state.users.map((u) => (u.id === id ? user : u)) };
        }
        return { users: [...state.users, user] };
      });
      return user;
    } catch {
      return null;
    }
  },

  getUserByRegistration: async (registration) => {
    try {
      return await userService.getByRegistration(registration);
    } catch {
      return null;
    }
  },

  adjustUserPoints: async (userId, points, reason) => {
    set({ isLoading: true, error: null });
    try {
      const user = await userService.adjustPoints(userId, { points, reason });
      set((state) => ({
        users: state.users.map((u) => (u.id === userId ? user : u)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao ajustar pontos', isLoading: false });
    }
  },

  // Space actions
  fetchSpaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const spaces = await spaceService.getAll();
      set({ spaces, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao carregar espaços', isLoading: false });
    }
  },

  addSpace: async (spaceData) => {
    set({ isLoading: true, error: null });
    try {
      const space = await spaceService.create(spaceData);
      set((state) => ({ spaces: [...state.spaces, space], isLoading: false }));
      return space;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao criar espaço', isLoading: false });
      return null;
    }
  },

  updateSpace: async (id, spaceData) => {
    set({ isLoading: true, error: null });
    try {
      const space = await spaceService.update(id, spaceData);
      set((state) => ({
        spaces: state.spaces.map((s) => (s.id === id ? space : s)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao atualizar espaço', isLoading: false });
    }
  },

  deleteSpace: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await spaceService.delete(id);
      set((state) => ({
        spaces: state.spaces.filter((s) => s.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao deletar espaço', isLoading: false });
    }
  },

  getSpaceById: (id) => get().spaces.find((s) => s.id === id),

  // Booking actions
  fetchBookings: async () => {
    set({ isLoading: true, error: null });
    try {
      const bookings = await bookingService.getAll();
      set({ bookings, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao carregar reservas', isLoading: false });
    }
  },

  addBooking: async (bookingData) => {
    set({ isLoading: true, error: null });
    try {
      const booking = await bookingService.create(bookingData);
      set((state) => ({ bookings: [...state.bookings, booking], isLoading: false }));
      return booking;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao criar reserva', isLoading: false });
      return null;
    }
  },

  updateBooking: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      const booking = await bookingService.update(id, { status });
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? booking : b)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao atualizar reserva', isLoading: false });
    }
  },

  cancelBooking: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await bookingService.cancel(id);
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' as const } : b)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao cancelar reserva', isLoading: false });
    }
  },

  getBookingsByUser: (userId) => get().bookings.filter((b) => b.userId === userId),

  isDateAvailable: async (spaceId, date) => {
    try {
      return await bookingService.checkAvailability(spaceId, date);
    } catch {
      return false;
    }
  },

  // Event actions
  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const events = await eventService.getAll();
      set({ events, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao carregar eventos', isLoading: false });
    }
  },

  addEvent: async (eventData) => {
    set({ isLoading: true, error: null });
    try {
      const event = await eventService.create(eventData as Parameters<typeof eventService.create>[0]);
      set((state) => ({ events: [...state.events, event], isLoading: false }));
      return event;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao criar evento', isLoading: false });
      return null;
    }
  },

  updateEvent: async (id, eventData) => {
    set({ isLoading: true, error: null });
    try {
      const event = await eventService.update(id, eventData);
      set((state) => ({
        events: state.events.map((e) => (e.id === id ? event : e)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao atualizar evento', isLoading: false });
    }
  },

  deleteEvent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await eventService.delete(id);
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao deletar evento', isLoading: false });
    }
  },

  getEventById: (id) => get().events.find((e) => e.id === id),

  refreshEventQRCode: async (eventId) => {
    try {
      const event = await eventService.refreshQRCode(eventId);
      set((state) => ({
        events: state.events.map((e) => (e.id === eventId ? event : e)),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao atualizar QR Code' });
    }
  },

  getActiveEvents: () => {
    const now = new Date();
    return get().events.filter((event) => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      return now >= start && now <= end;
    });
  },

  scanEventQR: async (eventId, qrSecret) => {
    try {
      const result = await eventService.scan(eventId, qrSecret);
      return {
        success: true,
        message: `Parabéns! Você ganhou ${result.points} pontos!`,
        points: result.points,
        totalPoints: result.totalPoints,
        scanCount: result.scanCount,
        maxScans: result.maxScans,
      };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Erro ao escanear QR Code' };
    }
  },

  // Points actions
  fetchPointHistory: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const transactions = await pointService.getHistory(userId);
      set({ pointTransactions: transactions, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao carregar histórico', isLoading: false });
    }
  },

  getUserPoints: (userId) => {
    const user = get().users.find((u) => u.id === userId);
    return user?.points || 0;
  },

  getUserPointHistory: (userId) => {
    return get().pointTransactions.filter((t) => t.userId === userId);
  },

  transferPoints: async (toUserId, points) => {
    try {
      const result = await pointService.transfer(toUserId, points);
      // Refresh users to get updated balances
      await get().fetchUsers();
      return {
        success: true,
        message: `${points} pontos transferidos com sucesso para ${result.toUser.name}!`,
        newBalance: result.newBalance
      };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Erro ao transferir pontos' };
    }
  },

  // Fridge Product actions
  fetchFridgeProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await fridgeService.getProducts();
      set({ fridgeProducts: products, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao carregar produtos', isLoading: false });
    }
  },

  addFridgeProduct: async (productData) => {
    set({ isLoading: true, error: null });
    try {
      const product = await fridgeService.createProduct(productData);
      set((state) => ({ fridgeProducts: [...state.fridgeProducts, product], isLoading: false }));
      return product;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao criar produto', isLoading: false });
      return null;
    }
  },

  updateFridgeProduct: async (id, productData) => {
    set({ isLoading: true, error: null });
    try {
      const product = await fridgeService.updateProduct(id, productData);
      set((state) => ({
        fridgeProducts: state.fridgeProducts.map((p) => (p.id === id ? product : p)),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao atualizar produto', isLoading: false });
    }
  },

  deleteFridgeProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await fridgeService.deleteProduct(id);
      set((state) => ({
        fridgeProducts: state.fridgeProducts.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao deletar produto', isLoading: false });
    }
  },

  getFridgeProductById: (id) => get().fridgeProducts.find((p) => p.id === id),

  getActiveFridgeProducts: () => get().fridgeProducts.filter((p) => p.isActive && p.stockQuantity > 0),

  // Fridge Order actions
  fetchFridgeOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const orders = await fridgeService.getOrders();
      set({ fridgeOrders: orders, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao carregar pedidos', isLoading: false });
    }
  },

  createFridgeOrder: async (items) => {
    set({ isLoading: true, error: null });
    try {
      const order = await fridgeService.createOrder({ items });
      set((state) => ({ fridgeOrders: [...state.fridgeOrders, order], isLoading: false }));
      return order;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao criar pedido', isLoading: false });
      return null;
    }
  },

  payFridgeOrder: async (orderId, qrSecret) => {
    try {
      await fridgeService.payOrder(orderId, qrSecret);
      // Refresh orders after payment
      const orders = await fridgeService.getOrders();
      set({ fridgeOrders: orders });
      return { success: true, message: 'Pagamento realizado com sucesso! Retire seus produtos.' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Erro ao pagar pedido' };
    }
  },

  cancelFridgeOrder: async (orderId) => {
    try {
      await fridgeService.cancelOrder(orderId);
      set((state) => ({
        fridgeOrders: state.fridgeOrders.map((o) =>
          o.id === orderId ? { ...o, status: 'cancelled' as const } : o
        ),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao cancelar pedido' });
    }
  },

  markOrderCollected: async (orderId) => {
    try {
      await fridgeService.collectOrder(orderId);
      set((state) => ({
        fridgeOrders: state.fridgeOrders.map((o) =>
          o.id === orderId ? { ...o, status: 'collected' as const } : o
        ),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao marcar como coletado' });
    }
  },

  getFridgeOrderById: (id) => get().fridgeOrders.find((o) => o.id === id),

  clearError: () => set({ error: null }),
}));
