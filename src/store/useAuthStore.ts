import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => {
        set({ user, accessToken });
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', accessToken);
        }
      },
      logout: () => {
        set({ user: null, accessToken: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
        }
      },
    }),
    { name: 'auth-store' },
  ),
);
