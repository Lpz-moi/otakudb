const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface DiscordDataItem {
  messageId?: string;
  [key: string]: any;
}

export interface BatchOperation {
  action: 'create' | 'update' | 'delete';
  data?: any;
  messageId?: string;
}

/**
 * Service de stockage Discord
 * Gère toutes les opérations CRUD via l'API Discord
 */
export const discordStorageService = {
  /**
   * Créer une donnée
   */
  async create(type: string, data: any): Promise<DiscordDataItem> {
    const response = await fetch(`${API_BASE_URL}/api/discord/data/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create ${type}`);
    }

    const result = await response.json();
    return { ...result.data, messageId: result.messageId };
  },

  /**
   * Lire toutes les données d'un type
   */
  async read(type: string): Promise<DiscordDataItem[]> {
    const response = await fetch(`${API_BASE_URL}/api/discord/data/${type}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to read ${type}`);
    }

    const result = await response.json();
    return result.data || [];
  },

  /**
   * Mettre à jour une donnée
   */
  async update(type: string, messageId: string, data: any): Promise<DiscordDataItem> {
    const response = await fetch(
      `${API_BASE_URL}/api/discord/data/${type}/${messageId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update ${type}`);
    }

    const result = await response.json();
    return { ...result.data, messageId: result.messageId };
  },

  /**
   * Supprimer une donnée
   */
  async delete(type: string, messageId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/discord/data/${type}/${messageId}`,
      {
        method: 'DELETE',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete ${type}`);
    }
  },

  /**
   * Opérations batch pour optimiser les requêtes
   */
  async batch(type: string, operations: BatchOperation[]): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/discord/data/${type}/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ operations }),
    });

    if (!response.ok) {
      throw new Error(`Failed to batch ${type}`);
    }

    const result = await response.json();
    return result.results || [];
  },
};

/**
 * Types de données stockées sur Discord
 */
export const STORAGE_TYPES = {
  PROFILE: 'profile',
  FAVORITES: 'favorites',
  LISTS: 'lists',
  PREFERENCES: 'preferences',
  HISTORY: 'history',
  NOTIFICATIONS: 'notifications',
} as const;
