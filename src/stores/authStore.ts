import { create } from 'zustand';
import { discordAuthService, type DiscordUser } from '@/services/discordAuth';

interface AuthState {
  user: DiscordUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: DiscordUser | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
    });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await discordAuthService.getCurrentUser();
      if (response) {
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      // Erreur silencieuse - l'app fonctionne sans Discord
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    try {
      await discordAuthService.logout();
      set({
        user: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
}));
