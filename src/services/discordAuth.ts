// Résoudre l'API_BASE_URL à l'exécution
function getApiBaseUrl(): string {
  const buildTimeUrl = import.meta.env.VITE_API_URL;
  console.log('📌 VITE_API_URL (build-time):', buildTimeUrl);
  
  // En Codespaces/Production: ignorer localhost et utiliser l'URL HTTPS
  if (window.location.protocol === 'https:' && window.location.hostname !== 'localhost') {
    // Remplacer le port 8080 par 4000 dans l'URL pour obtenir le backend
    const apiUrl = window.location.origin.replace(/-8080\./, '-4000.');
    console.log('🌐 Codespaces detected - API URL:', apiUrl);
    return apiUrl;
  }
  
  // En local dev (localhost)
  if (window.location.hostname === 'localhost') {
    console.log('💻 Local development detected - using localhost:4000');
    return 'http://localhost:4000';
  }
  
  // Fallback: utiliser VITE_API_URL si défini
  if (buildTimeUrl && !buildTimeUrl.includes('localhost')) {
    console.log('🔧 Using VITE_API_URL:', buildTimeUrl);
    return buildTimeUrl;
  }
  
  // Ultime fallback
  console.warn('⚠️ Could not determine API URL, using localhost');
  return 'http://localhost:4000';
}

const API_BASE_URL = getApiBaseUrl();

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
      console.log('🔐 Tentative de connexion à:', API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/api/auth/discord/login`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Réponse reçue:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erreur serveur:', errorData);
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      
      const data = await response.json();
      return data.authUrl;
    } catch (error: any) {
      console.error('❌ Erreur complète:', error);
      const message = error?.message || String(error);
      
      // Déterminer le type d'erreur
      if (message.includes('Failed to fetch') || message.includes('fetch')) {
        console.error('🔴 Problème de connexion au backend');
        throw new Error(`Impossible de joindre le backend à ${API_BASE_URL}. Vérifiez que le serveur est démarré.`);
      }
      
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
