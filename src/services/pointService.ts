import { api } from './api';
import type { PointTransaction } from '../types';

interface PointTransactionWithDetails extends PointTransaction {
  event?: { id: string; name: string };
  relatedUser?: { id: string; name: string };
}

interface TransferResponse {
  success: boolean;
  transferId: string;
  pointsTransferred: number;
  newBalance: number;
  toUser: { id: string; name: string };
}

export const pointService = {
  async getHistory(userId: string): Promise<PointTransactionWithDetails[]> {
    return api.get<PointTransactionWithDetails[]>(`/points/history/${userId}`);
  },

  async getMyHistory(): Promise<PointTransactionWithDetails[]> {
    return api.get<PointTransactionWithDetails[]>('/points/my-history');
  },

  async transfer(toUserId: string, points: number): Promise<TransferResponse> {
    return api.post<TransferResponse>('/points/transfer', { toUserId, points });
  },
};
