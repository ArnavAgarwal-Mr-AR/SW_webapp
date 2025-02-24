import { create } from 'zustand';
import { setToken, removeToken } from '../utils/auth';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (userData: { user: User; token: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: ({ user, token }) => {
    setToken(token);
    set({ user, token });
  },
  logout: () => {
    removeToken();
    set({ user: null, token: null });
  },
}));