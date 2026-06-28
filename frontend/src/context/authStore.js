import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await authAPI.login({ email, password });
          const { token, refreshToken, user } = res;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', refreshToken);
          connectSocket(token);
          set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
          return { success: true, user };
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await authAPI.register(data);
          const { token, refreshToken, user } = res;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', refreshToken);
          connectSocket(token);
          set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
          return { success: true, user };
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        disconnectSocket();
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      },

      refreshUser: async () => {
        try {
          const res = await authAPI.getMe();
          set({ user: res.data });
        } catch {
          get().logout();
        }
      },

      updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, refreshToken: state.refreshToken, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;
