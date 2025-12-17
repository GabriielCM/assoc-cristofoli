import { api } from './api';
import type { Event } from '../types';

interface CreateEventData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  points: number;
  maxScansPerUser?: number;
  checkInIntervalMinutes?: number;
  image?: string;
  location?: string;
}

type UpdateEventData = Partial<CreateEventData>;

interface ScanResponse {
  success: boolean;
  points: number;
  totalPoints: number;
  scanCount: number;
  maxScans: number;
}

export const eventService = {
  async getAll(): Promise<Event[]> {
    return api.get<Event[]>('/events');
  },

  async getActive(): Promise<Event[]> {
    return api.get<Event[]>('/events/active');
  },

  async getById(id: string): Promise<Event> {
    return api.get<Event>(`/events/${id}`);
  },

  async create(data: CreateEventData): Promise<Event> {
    return api.post<Event>('/events', data);
  },

  async update(id: string, data: UpdateEventData): Promise<Event> {
    return api.put<Event>(`/events/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return api.delete<void>(`/events/${id}`);
  },

  async refreshQRCode(id: string): Promise<Event> {
    return api.post<Event>(`/events/${id}/refresh-qr`);
  },

  async scan(eventId: string, secret: string): Promise<ScanResponse> {
    return api.post<ScanResponse>('/events/scan', { eventId, secret });
  },
};
