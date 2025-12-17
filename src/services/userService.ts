import { api } from './api';
import type { User } from '../types';

type UserWithoutPassword = Omit<User, 'password'>;

interface CreateUserData {
  email: string;
  password: string;
  name: string;
  birthDate: string;
  registration: string;
  photo?: string;
  role?: 'admin' | 'user';
  points?: number;
  validUntil?: string;
}

interface UpdateUserData {
  email?: string;
  password?: string;
  name?: string;
  birthDate?: string;
  registration?: string;
  photo?: string;
  role?: 'admin' | 'user';
  points?: number;
  validUntil?: string;
}

interface AdjustPointsData {
  points: number;
  reason: string;
}

export const userService = {
  async getAll(): Promise<UserWithoutPassword[]> {
    return api.get<UserWithoutPassword[]>('/users');
  },

  async getById(id: string): Promise<UserWithoutPassword> {
    return api.get<UserWithoutPassword>(`/users/${id}`);
  },

  async getByRegistration(registration: string): Promise<UserWithoutPassword> {
    return api.get<UserWithoutPassword>(`/users/registration/${registration}`);
  },

  async create(data: CreateUserData): Promise<UserWithoutPassword> {
    return api.post<UserWithoutPassword>('/users', data);
  },

  async update(id: string, data: UpdateUserData): Promise<UserWithoutPassword> {
    return api.put<UserWithoutPassword>(`/users/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return api.delete<void>(`/users/${id}`);
  },

  async adjustPoints(id: string, data: AdjustPointsData): Promise<UserWithoutPassword> {
    return api.post<UserWithoutPassword>(`/users/${id}/adjust-points`, data);
  },
};
