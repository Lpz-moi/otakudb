import type { Anime } from './jikanApi';

// Lazy-loaded API URL
let _apiUrl: string | null = null;
function getApiUrl(): string {
  if (_apiUrl) return _apiUrl;
  _apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return _apiUrl;
}

export type AnimeStatus = 'watching' | 'completed' | 'planned' | 'dropped';

export interface AnimeListItem {
  id?: number;
  anime_id: number;
  title: string;
  image?: string;
  status: AnimeStatus;
  progress: number;
  rating: number | null;
  notes?: string;
  is_favorite: boolean;
  added_at?: string;
  updated_at?: string;
}

/**
 * Service pour gérer la liste d'animes synchronisée avec le backend
 */
export const animeListService = {
  /**
   * Récupérer la liste d'animes complète
   */
  async getAnimeList(): Promise<AnimeListItem[]> {
    try {
      console.log('📖 Fetching anime list from backend...');
      const response = await fetch(`${getApiUrl()}/api/anime`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('⚠️ Not authenticated');
          return [];
        }
        throw new Error(`Failed to fetch anime list: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Anime list loaded:', data.count, 'items');
      return data.data || [];
    } catch (error) {
      console.error('❌ Error fetching anime list:', error);
      throw error;
    }
  },

  /**
   * Ajouter un anime à la liste
   */
  async addAnime(
    anime: Anime,
    status: AnimeStatus = 'planned'
  ): Promise<AnimeListItem> {
    try {
      console.log('➕ Adding anime to list:', anime.mal_id);
      const response = await fetch(`${getApiUrl()}/api/anime`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          anime_id: anime.mal_id,
          anime_title: anime.title,
          anime_image: anime.images.jpg.image_url,
          status,
          progress: 0,
          rating: null,
          notes: '',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add anime');
      }

      console.log('✅ Anime added successfully');
      return {
        anime_id: anime.mal_id,
        title: anime.title,
        image: anime.images.jpg.image_url,
        status,
        progress: 0,
        rating: null,
        notes: '',
        is_favorite: false,
      };
    } catch (error) {
      console.error('❌ Error adding anime:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un anime
   */
  async updateAnime(
    animeId: number,
    updates: Partial<AnimeListItem>
  ): Promise<void> {
    try {
      console.log('📝 Updating anime:', animeId, updates);
      const response = await fetch(`${getApiUrl()}/api/anime/${animeId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update anime');
      }

      console.log('✅ Anime updated successfully');
    } catch (error) {
      console.error('❌ Error updating anime:', error);
      throw error;
    }
  },

  /**
   * Supprimer un anime de la liste
   */
  async removeAnime(animeId: number): Promise<void> {
    try {
      console.log('🗑️ Removing anime from list:', animeId);
      const response = await fetch(`${getApiUrl()}/api/anime/${animeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove anime');
      }

      console.log('✅ Anime removed successfully');
    } catch (error) {
      console.error('❌ Error removing anime:', error);
      throw error;
    }
  },

  /**
   * Obtenir les statistiques
   */
  async getStats() {
    try {
      console.log('📊 Fetching stats...');
      const response = await fetch(`${getApiUrl()}/api/anime/stats`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            total: 0,
            watching: 0,
            completed: 0,
            planned: 0,
            dropped: 0,
            favorites: 0,
            avg_rating: 0,
          };
        }
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      console.log('✅ Stats loaded');
      return data.data;
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      throw error;
    }
  },
};
