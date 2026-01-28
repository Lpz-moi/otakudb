// Cache for API URL - lazy loaded
let _cachedApiUrl: string | null = null;

// Resolve API_BASE_URL lazily at runtime (not at import time)
function getApiBaseUrl(): string {
  // Return cached value if already computed
  if (_cachedApiUrl) return _cachedApiUrl;
  
  try {
    const buildTimeUrl = import.meta.env.VITE_API_URL;
    
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') {
      _cachedApiUrl = buildTimeUrl || 'http://localhost:4000';
      return _cachedApiUrl;
    }
    
    // En Codespaces/Production: ignorer localhost et utiliser l'URL HTTPS
    if (window.location.protocol === 'https:' && window.location.hostname !== 'localhost') {
      // Remplacer le port 8080 par 4000 dans l'URL pour obtenir le backend
      _cachedApiUrl = window.location.origin.replace(/-8080\./, '-4000.');
      return _cachedApiUrl;
    }
    
    // En local dev (localhost)
    if (window.location.hostname === 'localhost') {
      _cachedApiUrl = 'http://localhost:4000';
      return _cachedApiUrl;
    }
    
    // Fallback: utiliser VITE_API_URL si defini
    if (buildTimeUrl && !buildTimeUrl.includes('localhost')) {
      _cachedApiUrl = buildTimeUrl;
      return _cachedApiUrl;
    }
    
    // Ultime fallback
    _cachedApiUrl = 'http://localhost:4000';
    return _cachedApiUrl;
  } catch (e) {
    // Safety fallback if anything fails
    _cachedApiUrl = 'http://localhost:4000';
    return _cachedApiUrl;
  }
}

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
    const apiUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${apiUrl}/api/auth/discord/login`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      
      const data = await response.json();
      return data.authUrl;
    } catch (error: any) {
      const message = error?.message || String(error);
      
      if (message.includes('Failed to fetch') || message.includes('fetch')) {
        throw new Error('Backend non disponible. Fonctionnalite Discord desactivee.');
      }
      
      throw new Error('Le serveur d\'authentification n\'est pas disponible.');
    }
  },

  /**
   * Verifier la session actuelle
   */
  async getCurrentUser(): Promise<AuthResponse | null> {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/auth/discord/me`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch {
      // Silencieux si le backend n'est pas disponible
      // L'utilisateur peut toujours utiliser l'app sans Discord
      return null;
    }
  },

  /**
   * Deconnexion
   */
  async logout(): Promise<void> {
    try {
      const apiUrl = getApiBaseUrl();
      await fetch(`${apiUrl}/api/auth/discord/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore errors on logout
    }
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
