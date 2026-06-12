import { create } from 'zustand';

interface AuthState {
  usuario: null;
}

export const useAuthStore = create<AuthState>(() => ({
  usuario: null,
}));