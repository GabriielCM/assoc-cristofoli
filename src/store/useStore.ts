import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { addYears, addHours, addMinutes, isWithinInterval, parseISO, isBefore } from 'date-fns';
import type { AppState, User, Space, Booking, Event, PointTransaction, FridgeProduct, FridgeOrder, FridgeOrderStatus } from '../types';

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
      fridgeProducts: [],
      fridgeOrders: [],

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

      getUserByRegistration: (registration) => {
        return get().users.find(
          (user) => user.registration.toLowerCase() === registration.toLowerCase()
        );
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

        // Check interval between check-ins (if maxScansPerUser > 1 and checkInIntervalMinutes is set)
        if (userScans.length > 0 && event.checkInIntervalMinutes) {
          const lastScan = userScans.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
          const lastScanTime = parseISO(lastScan.timestamp);
          const minutesSinceLastScan = Math.floor((now.getTime() - lastScanTime.getTime()) / (1000 * 60));

          if (minutesSinceLastScan < event.checkInIntervalMinutes) {
            const remainingMinutes = event.checkInIntervalMinutes - minutesSinceLastScan;
            return {
              success: false,
              message: `Aguarde mais ${remainingMinutes} minuto(s) para fazer outro check-in.`
            };
          }
        }

        // Add points
        const transaction: PointTransaction = {
          id: uuidv4(),
          userId,
          type: 'event_checkin',
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

      adjustUserPoints: (userId, points, reason) => {
        const transaction: PointTransaction = {
          id: uuidv4(),
          userId,
          type: 'admin_adjustment',
          points,
          timestamp: new Date().toISOString(),
          reason
        };

        set((state) => ({
          pointTransactions: [...state.pointTransactions, transaction],
          users: state.users.map((u) =>
            u.id === userId ? { ...u, points: Math.max(0, u.points + points) } : u
          )
        }));
      },

      transferPoints: (fromUserId, toUserId, points) => {
        const fromUser = get().getUserById(fromUserId);
        const toUser = get().getUserById(toUserId);

        if (!fromUser || !toUser) {
          return { success: false, message: 'Usuário não encontrado.' };
        }

        if (fromUserId === toUserId) {
          return { success: false, message: 'Você não pode transferir pontos para si mesmo.' };
        }

        if (points <= 0) {
          return { success: false, message: 'A quantidade de pontos deve ser maior que zero.' };
        }

        if (fromUser.points < points) {
          return { success: false, message: 'Saldo insuficiente para realizar a transferência.' };
        }

        const transferId = uuidv4();
        const now = new Date().toISOString();

        const sentTransaction: PointTransaction = {
          id: uuidv4(),
          userId: fromUserId,
          type: 'transfer_sent',
          points: -points,
          timestamp: now,
          relatedUserId: toUserId,
          transferId
        };

        const receivedTransaction: PointTransaction = {
          id: uuidv4(),
          userId: toUserId,
          type: 'transfer_received',
          points: points,
          timestamp: now,
          relatedUserId: fromUserId,
          transferId
        };

        set((state) => ({
          pointTransactions: [...state.pointTransactions, sentTransaction, receivedTransaction],
          users: state.users.map((u) => {
            if (u.id === fromUserId) return { ...u, points: u.points - points };
            if (u.id === toUserId) return { ...u, points: u.points + points };
            return u;
          })
        }));

        return { success: true, message: `${points} pontos transferidos com sucesso para ${toUser.name}!` };
      },

      // Fridge Product actions
      addFridgeProduct: (productData) => {
        const now = new Date().toISOString();
        const newProduct: FridgeProduct = {
          ...productData,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now
        };
        set((state) => ({ fridgeProducts: [...state.fridgeProducts, newProduct] }));
        return newProduct;
      },

      updateFridgeProduct: (id, productData) => {
        set((state) => ({
          fridgeProducts: state.fridgeProducts.map((product) =>
            product.id === id
              ? { ...product, ...productData, updatedAt: new Date().toISOString() }
              : product
          )
        }));
      },

      deleteFridgeProduct: (id) => {
        set((state) => ({
          fridgeProducts: state.fridgeProducts.filter((product) => product.id !== id)
        }));
      },

      getFridgeProductById: (id) => {
        return get().fridgeProducts.find((product) => product.id === id);
      },

      getActiveFridgeProducts: () => {
        return get().fridgeProducts.filter((product) => product.isActive && product.stockQuantity > 0);
      },

      updateProductStock: (productId, quantityChange) => {
        set((state) => ({
          fridgeProducts: state.fridgeProducts.map((product) =>
            product.id === productId
              ? { ...product, stockQuantity: Math.max(0, product.stockQuantity + quantityChange), updatedAt: new Date().toISOString() }
              : product
          )
        }));
      },

      // Fridge Order actions
      createFridgeOrder: (items) => {
        const totalPoints = items.reduce((sum, item) => sum + (item.pricePoints * item.quantity), 0);
        const now = new Date();

        const newOrder: FridgeOrder = {
          id: uuidv4(),
          items,
          totalPoints,
          status: 'pending_payment',
          qrCodeSecret: generateQRSecret(),
          qrCodeExpiresAt: addMinutes(now, 5).toISOString(),
          createdAt: now.toISOString()
        };

        set((state) => ({ fridgeOrders: [...state.fridgeOrders, newOrder] }));
        return newOrder;
      },

      getFridgeOrderById: (id) => {
        return get().fridgeOrders.find((order) => order.id === id);
      },

      payFridgeOrder: (userId, orderId, qrSecret) => {
        const order = get().getFridgeOrderById(orderId);
        const user = get().getUserById(userId);

        if (!order) {
          return { success: false, message: 'Pedido não encontrado.' };
        }

        if (!user) {
          return { success: false, message: 'Usuário não encontrado.' };
        }

        if (order.status !== 'pending_payment') {
          return { success: false, message: 'Este pedido já foi processado.' };
        }

        const now = new Date();
        const expiresAt = parseISO(order.qrCodeExpiresAt);

        if (isBefore(expiresAt, now)) {
          return { success: false, message: 'QR Code expirado. Faça um novo pedido.' };
        }

        if (order.qrCodeSecret !== qrSecret) {
          return { success: false, message: 'QR Code inválido.' };
        }

        if (user.points < order.totalPoints) {
          return { success: false, message: `Saldo insuficiente. Você tem ${user.points} pontos, mas precisa de ${order.totalPoints}.` };
        }

        // Check stock availability
        for (const item of order.items) {
          const product = get().getFridgeProductById(item.productId);
          if (!product || product.stockQuantity < item.quantity) {
            return { success: false, message: `Produto "${item.productName}" não está mais disponível na quantidade solicitada.` };
          }
        }

        // Create purchase transaction
        const transaction: PointTransaction = {
          id: uuidv4(),
          userId,
          type: 'purchase',
          points: -order.totalPoints,
          timestamp: now.toISOString(),
          orderId
        };

        // Update order, user points, and product stock
        set((state) => ({
          pointTransactions: [...state.pointTransactions, transaction],
          users: state.users.map((u) =>
            u.id === userId ? { ...u, points: u.points - order.totalPoints } : u
          ),
          fridgeOrders: state.fridgeOrders.map((o) =>
            o.id === orderId ? { ...o, status: 'paid' as FridgeOrderStatus, userId, paidAt: now.toISOString() } : o
          ),
          fridgeProducts: state.fridgeProducts.map((product) => {
            const orderItem = order.items.find((item) => item.productId === product.id);
            if (orderItem) {
              return { ...product, stockQuantity: product.stockQuantity - orderItem.quantity, updatedAt: now.toISOString() };
            }
            return product;
          })
        }));

        return { success: true, message: 'Pagamento realizado com sucesso! Retire seus produtos.' };
      },

      cancelFridgeOrder: (orderId) => {
        set((state) => ({
          fridgeOrders: state.fridgeOrders.map((order) =>
            order.id === orderId && order.status === 'pending_payment'
              ? { ...order, status: 'cancelled' as FridgeOrderStatus, cancelledAt: new Date().toISOString() }
              : order
          )
        }));
      },

      markOrderCollected: (orderId) => {
        set((state) => ({
          fridgeOrders: state.fridgeOrders.map((order) =>
            order.id === orderId && order.status === 'paid'
              ? { ...order, status: 'collected' as FridgeOrderStatus, collectedAt: new Date().toISOString() }
              : order
          )
        }));
      },

      getOrdersByStatus: (status) => {
        return get().fridgeOrders.filter((order) => order.status === status);
      },

      getOrdersByUser: (userId) => {
        return get().fridgeOrders.filter((order) => order.userId === userId);
      },

      cleanupExpiredOrders: () => {
        const now = new Date();
        set((state) => ({
          fridgeOrders: state.fridgeOrders.map((order) => {
            if (order.status === 'pending_payment' && isBefore(parseISO(order.qrCodeExpiresAt), now)) {
              return { ...order, status: 'cancelled' as FridgeOrderStatus, cancelledAt: now.toISOString() };
            }
            return order;
          })
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
            pointTransactions: [],
            fridgeProducts: [],
            fridgeOrders: []
          });
        }
      }
    }),
    {
      name: 'ahub-storage'
    }
  )
);
