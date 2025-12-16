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
  qrCodeSecret: string;
  qrCodeExpiresAt: string;
  image?: string;
  location?: string;
}

// Point transaction interface
export interface PointTransaction {
  id: string;
  userId: string;
  eventId: string;
  points: number;
  timestamp: string;
  scanCount: number;
}

// QR Code data interface
export interface QRCodeData {
  eventId: string;
  secret: string;
  timestamp: number;
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

  // User actions
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'validUntil' | 'points'>) => User;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUserById: (id: string) => User | undefined;

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

  // Initialize data
  initializeData: () => void;
}
