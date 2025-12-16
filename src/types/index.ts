// User roles
export type UserRole = 'admin' | 'user';

// User interface
export interface User {
  id: string;
  email: string;
  password: string; // In real app, this would be hashed
  name: string;
  birthDate: string;
  registration: string; // Matrícula
  photo: string;
  role: UserRole;
  points: number;
  createdAt: string;
  validUntil: string; // Validity: 1 year from creation
}

// Space interface
export interface Space {
  id: string;
  name: string;
  price: number;
  capacity: number;
  description: string;
  image: string;
  amenities: string[];
}

// Booking/Rental interface
export interface Booking {
  id: string;
  spaceId: string;
  userId: string;
  date: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  totalPrice: number;
}

// Event interface
export interface Event {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  points: number;
  maxScansPerUser: number;
  checkInIntervalMinutes?: number; // Minimum interval between check-ins (only when maxScansPerUser > 1)
  qrCodeSecret: string;
  qrCodeExpiresAt: string;
  image?: string;
  location?: string;
}

// Point transaction types
export type PointTransactionType =
  | 'event_checkin'      // Earning points from event scan
  | 'purchase'           // Spending points on fridge items
  | 'transfer_sent'      // Sending points to another user
  | 'transfer_received'  // Receiving points from another user
  | 'admin_adjustment';  // Manual admin adjustment

// Point transaction interface
export interface PointTransaction {
  id: string;
  userId: string;
  type: PointTransactionType;
  points: number;                    // Positive for gains, negative for spending/sending
  timestamp: string;
  // Event-related (for event_checkin)
  eventId?: string;
  scanCount?: number;
  // Transfer-related (for transfer_sent/transfer_received)
  relatedUserId?: string;            // The other party in the transfer
  transferId?: string;               // Links sent/received transactions
  // Purchase-related (for purchase)
  orderId?: string;
  // Admin adjustment (for admin_adjustment)
  reason?: string;
}

// QR Code data interfaces
export interface EventQRData {
  eventId: string;
  secret: string;
  timestamp: number;
}

export interface MembershipQRData {
  type: 'membership';
  userId: string;
  registration: string;
  timestamp: number;
}

export interface FridgeOrderQRData {
  type: 'fridge_order';
  orderId: string;
  secret: string;
  totalPoints: number;
}

// Fridge Product
export type FridgeCategory = 'Bebidas' | 'Snacks' | 'Refeicoes';

export interface FridgeProduct {
  id: string;
  name: string;
  description: string;
  category: FridgeCategory;
  pricePoints: number;
  stockQuantity: number;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fridge Order
export type FridgeOrderStatus = 'pending_payment' | 'paid' | 'collected' | 'cancelled';

export interface FridgeOrderItem {
  productId: string;
  productName: string;       // Snapshot at time of order
  pricePoints: number;       // Snapshot at time of order
  quantity: number;
}

export interface FridgeOrder {
  id: string;
  userId?: string;           // Null until payment (kiosk creates order before auth)
  items: FridgeOrderItem[];
  totalPoints: number;
  status: FridgeOrderStatus;
  qrCodeSecret: string;
  qrCodeExpiresAt: string;   // 5 minutes from creation
  createdAt: string;
  paidAt?: string;
  collectedAt?: string;
  cancelledAt?: string;
}

// Auth state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => void;
}

// App state
export interface AppState {
  users: User[];
  spaces: Space[];
  bookings: Booking[];
  events: Event[];
  pointTransactions: PointTransaction[];
  fridgeProducts: FridgeProduct[];
  fridgeOrders: FridgeOrder[];

  // User actions
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'validUntil' | 'points'>) => User;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUserById: (id: string) => User | undefined;
  getUserByRegistration: (registration: string) => User | undefined;

  // Space actions
  addSpace: (space: Omit<Space, 'id'>) => Space;
  updateSpace: (id: string, space: Partial<Space>) => void;
  deleteSpace: (id: string) => void;
  getSpaceById: (id: string) => Space | undefined;

  // Booking actions
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Booking | null;
  updateBooking: (id: string, booking: Partial<Booking>) => void;
  cancelBooking: (id: string) => void;
  getBookingsByUser: (userId: string) => Booking[];
  getBookingsBySpace: (spaceId: string) => Booking[];
  isDateAvailable: (spaceId: string, date: string) => boolean;

  // Event actions
  addEvent: (event: Omit<Event, 'id' | 'qrCodeSecret' | 'qrCodeExpiresAt'>) => Event;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  getEventById: (id: string) => Event | undefined;
  refreshEventQRCode: (eventId: string) => void;
  getActiveEvents: () => Event[];

  // Points actions
  scanEventQR: (userId: string, eventId: string, qrSecret: string) => { success: boolean; message: string; points?: number };
  getUserPoints: (userId: string) => number;
  getUserPointHistory: (userId: string) => PointTransaction[];
  adjustUserPoints: (userId: string, points: number, reason: string) => void;
  transferPoints: (fromUserId: string, toUserId: string, points: number) => { success: boolean; message: string };

  // Fridge Product actions
  addFridgeProduct: (product: Omit<FridgeProduct, 'id' | 'createdAt' | 'updatedAt'>) => FridgeProduct;
  updateFridgeProduct: (id: string, product: Partial<FridgeProduct>) => void;
  deleteFridgeProduct: (id: string) => void;
  getFridgeProductById: (id: string) => FridgeProduct | undefined;
  getActiveFridgeProducts: () => FridgeProduct[];
  updateProductStock: (productId: string, quantityChange: number) => void;

  // Fridge Order actions
  createFridgeOrder: (items: FridgeOrderItem[]) => FridgeOrder;
  getFridgeOrderById: (id: string) => FridgeOrder | undefined;
  payFridgeOrder: (userId: string, orderId: string, qrSecret: string) => { success: boolean; message: string };
  cancelFridgeOrder: (orderId: string) => void;
  markOrderCollected: (orderId: string) => void;
  getOrdersByStatus: (status: FridgeOrderStatus) => FridgeOrder[];
  getOrdersByUser: (userId: string) => FridgeOrder[];
  cleanupExpiredOrders: () => void;

  // Initialize data
  initializeData: () => void;
}
