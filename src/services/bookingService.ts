import { api } from './api';
import type { Booking, Space, User } from '../types';

interface BookingWithDetails extends Booking {
  space: Space;
  user?: Pick<User, 'id' | 'name' | 'email' | 'registration'>;
}

interface CreateBookingData {
  spaceId: string;
  date: string;
}

interface UpdateBookingData {
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface AvailabilityResponse {
  available: boolean;
}

export const bookingService = {
  async getAll(): Promise<BookingWithDetails[]> {
    return api.get<BookingWithDetails[]>('/bookings');
  },

  async getById(id: string): Promise<BookingWithDetails> {
    return api.get<BookingWithDetails>(`/bookings/${id}`);
  },

  async getByUser(userId: string): Promise<BookingWithDetails[]> {
    return api.get<BookingWithDetails[]>(`/bookings/user/${userId}`);
  },

  async checkAvailability(spaceId: string, date: string): Promise<boolean> {
    const response = await api.get<AvailabilityResponse>(`/bookings/availability/${spaceId}/${date}`);
    return response.available;
  },

  async create(data: CreateBookingData): Promise<BookingWithDetails> {
    return api.post<BookingWithDetails>('/bookings', data);
  },

  async update(id: string, data: UpdateBookingData): Promise<BookingWithDetails> {
    return api.put<BookingWithDetails>(`/bookings/${id}`, data);
  },

  async cancel(id: string): Promise<void> {
    return api.delete<void>(`/bookings/${id}`);
  },
};
