import { api } from './api';
import type { User } from '../types';

interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  birthDate: string;
  registration: string;
  photo?: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    return api.post<LoginResponse>('/auth/login', { email, password });
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    return api.post<LoginResponse>('/auth/register', data);
  },

  async getMe(): Promise<Omit<User, 'password'>> {
    return api.get<Omit<User, 'password'>>('/auth/me');
  },

  async refreshToken(): Promise<{ token: string }> {
    return api.post<{ token: string }>('/auth/refresh');
  },
};
