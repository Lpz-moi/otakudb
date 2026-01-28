const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  email: string;
  avatar: string | null;
}

export interface AuthResponse {
  user: DiscordUser;
  hasDiscordTokens: boolean;
}

/**
 * Service d'authentification Discord
 */
export const discordAuthService = {
  /**
   * Obtenir l'URL d'autorisation Discord
   */
  async getAuthUrl(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/discord/login`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      
      const data = await response.json();
      return data.authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      throw new Error('Le serveur d\'authentification n\'est pas disponible. Vérifiez que le backend est lancé.');
    }
  },

  /**
   * Vérifier la session actuelle
   */
  async getCurrentUser(): Promise<AuthResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/discord/me`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      // Silencieux si le backend n'est pas disponible
      // L'utilisateur peut toujours utiliser l'app sans Discord
      return null;
    }
  },

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/api/auth/discord/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  },

  /**
   * Obtenir l'avatar Discord de l'utilisateur
   */
  getAvatarUrl(userId: string, avatar: string | null): string {
    if (!avatar) {
      return `https://cdn.discordapp.com/embed/avatars/${parseInt(userId) % 5}.png`;
    }
    return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=128`;
  },
};
