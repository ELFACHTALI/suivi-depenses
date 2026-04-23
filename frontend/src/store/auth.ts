import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  planType: "free" | "premium";
  referenceCurrency: string;
  language: string;
  isTotpEnabled: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
      // L'user suffit : le token sera rafraîchi silencieusement au démarrage
      isAuthenticated: () => !!get().user,
    }),
    {
      name: "fintrack-auth",
      // On ne persiste que l'objet user (UI), jamais l'accessToken (expire en 15 min)
      partialize: (s) => ({ user: s.user }),
    }
  )
);
