import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User } from '../types';
import { useStore } from './useStore';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string): Promise<boolean> => {
        const users = useStore.getState().users;
        const user = users.find(
          (u) => u.email === email && u.password === password
        );

        if (user) {
          set({ user, isAuthenticated: true });
          return true;
        }

        return false;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (user: User) => {
        set({ user });
      }
    }),
    {
      name: 'ahub-auth'
    }
  )
);
