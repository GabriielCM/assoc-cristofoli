import { api } from './api';
import type { Space } from '../types';

interface CreateSpaceData {
  name: string;
  price: number;
  capacity: number;
  description: string;
  image: string;
  amenities: string[];
}

type UpdateSpaceData = Partial<CreateSpaceData>;

export const spaceService = {
  async getAll(): Promise<Space[]> {
    return api.get<Space[]>('/spaces');
  },

  async getById(id: string): Promise<Space> {
    return api.get<Space>(`/spaces/${id}`);
  },

  async create(data: CreateSpaceData): Promise<Space> {
    return api.post<Space>('/spaces', data);
  },

  async update(id: string, data: UpdateSpaceData): Promise<Space> {
    return api.put<Space>(`/spaces/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return api.delete<void>(`/spaces/${id}`);
  },
};
