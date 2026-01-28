import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Anime } from '@/services/jikanApi';
import { animeListService, type AnimeListItem, type AnimeStatus } from '@/services/animeListApi';

interface AnimeListDiscordState {
  // Data
  items: Map<number, AnimeListItem>;
  
  // State
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;
  lastSyncTime: number | null;

  // Actions
  syncFromBackend: () => Promise<void>;
  addToList: (anime: Anime, status: AnimeStatus) => Promise<void>;
  removeFromList: (animeId: number) => Promise<void>;
  updateItem: (animeId: number, updates: Partial<AnimeListItem>) => Promise<void>;
  updateStatus: (animeId: number, status: AnimeStatus) => Promise<void>;
  updateProgress: (animeId: number, progress: number) => Promise<void>;
  updateRating: (animeId: number, rating: number | null) => Promise<void>;
  toggleFavorite: (animeId: number) => Promise<void>;

  // Queries
  getItemsByStatus: (status: AnimeStatus) => AnimeListItem[];
  getItemById: (animeId: number) => AnimeListItem | null;
  isInList: (animeId: number) => boolean;
  isFavorite: (animeId: number) => boolean;
  getStats: () => {
    total: number;
    watching: number;
    completed: number;
    planned: number;
    dropped: number;
    favorites: number;
    averageRating: number;
  };
  getAllItems: () => AnimeListItem[];
}

export const useAnimeListDiscordStore = create<AnimeListDiscordState>()(
  persist(
    (set, get) => ({
      items: new Map(),
      isLoading: false,
      error: null,
      isSyncing: false,
      lastSyncTime: null,

      /**
       * Synchroniser avec le backend
       */
      syncFromBackend: async () => {
        set({ isSyncing: true, error: null });
        try {
          console.log('🔄 Syncing anime list from backend...');
          const animes = await animeListService.getAnimeList();
          
          const itemsMap = new Map<number, AnimeListItem>();
          animes.forEach(anime => {
            itemsMap.set(anime.anime_id, anime);
          });

          set({
            items: itemsMap,
            lastSyncTime: Date.now(),
            isSyncing: false,
          });
          console.log('✅ Sync completed');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sync failed';
          console.error('❌ Sync error:', message);
          set({
            error: message,
            isSyncing: false,
          });
        }
      },

      /**
       * Ajouter un anime à la liste
       */
      addToList: async (anime: Anime, status: AnimeStatus = 'planned') => {
        set({ isLoading: true, error: null });
        try {
          const newItem = await animeListService.addAnime(anime, status);
          
          set(state => {
            const newItems = new Map(state.items);
            newItems.set(anime.mal_id, newItem);
            return { items: newItems, isLoading: false };
          });

          console.log('✅ Anime added to list and synced');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to add anime';
          console.error('❌ Add anime error:', message);
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      /**
       * Supprimer un anime de la liste
       */
      removeFromList: async (animeId: number) => {
        set({ isLoading: true, error: null });
        try {
          await animeListService.removeAnime(animeId);
          
          set(state => {
            const newItems = new Map(state.items);
            newItems.delete(animeId);
            return { items: newItems, isLoading: false };
          });

          console.log('✅ Anime removed from list and synced');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to remove anime';
          console.error('❌ Remove anime error:', message);
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      /**
       * Mettre à jour un anime
       */
      updateItem: async (animeId: number, updates: Partial<AnimeListItem>) => {
        set({ isLoading: true, error: null });
        try {
          await animeListService.updateAnime(animeId, updates);

          set(state => {
            const newItems = new Map(state.items);
            const item = newItems.get(animeId);
            if (item) {
              newItems.set(animeId, { ...item, ...updates });
            }
            return { items: newItems, isLoading: false };
          });

          console.log('✅ Anime updated and synced');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update anime';
          console.error('❌ Update anime error:', message);
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      /**
       * Mettre à jour le statut
       */
      updateStatus: async (animeId: number, status: AnimeStatus) => {
        await get().updateItem(animeId, { status });
      },

      /**
       * Mettre à jour la progression
       */
      updateProgress: async (animeId: number, progress: number) => {
        await get().updateItem(animeId, { progress });
      },

      /**
       * Mettre à jour la note
       */
      updateRating: async (animeId: number, rating: number | null) => {
        await get().updateItem(animeId, { rating });
      },

      /**
       * Basculer favori
       */
      toggleFavorite: async (animeId: number) => {
        const item = get().getItemById(animeId);
        if (item) {
          await get().updateItem(animeId, { is_favorite: !item.is_favorite });
        }
      },

      /**
       * Récupérer les animes par statut
       */
      getItemsByStatus: (status: AnimeStatus) => {
        const items = get().getAllItems();
        return items.filter(item => item.status === status);
      },

      /**
       * Récupérer un anime par ID
       */
      getItemById: (animeId: number) => {
        return get().items.get(animeId) || null;
      },

      /**
       * Vérifier si un anime est dans la liste
       */
      isInList: (animeId: number) => {
        return get().items.has(animeId);
      },

      /**
       * Vérifier si un anime est favori
       */
      isFavorite: (animeId: number) => {
        const item = get().items.get(animeId);
        return item?.is_favorite || false;
      },

      /**
       * Obtenir tous les animes
       */
      getAllItems: () => {
        return Array.from(get().items.values());
      },

      /**
       * Obtenir les statistiques
       */
      getStats: () => {
        const items = get().getAllItems();
        const stats = {
          total: items.length,
          watching: items.filter(i => i.status === 'watching').length,
          completed: items.filter(i => i.status === 'completed').length,
          planned: items.filter(i => i.status === 'planned').length,
          dropped: items.filter(i => i.status === 'dropped').length,
          favorites: items.filter(i => i.is_favorite).length,
          averageRating: items
            .filter(i => i.rating !== null && i.rating !== undefined)
            .reduce((sum, i) => sum + (i.rating || 0), 0) / 
            Math.max(items.filter(i => i.rating !== null && i.rating !== undefined).length, 1),
        };
        return stats;
      },
    }),
    {
      name: 'anime-list-discord-storage',
      partialize: (state) => ({
        items: Array.from(state.items.entries()),
        lastSyncTime: state.lastSyncTime,
      }),
      merge: (persistedState: any, currentState) => {
        const itemsMap = new Map(persistedState.items || []);
        return {
          ...currentState,
          items: itemsMap,
          lastSyncTime: persistedState.lastSyncTime,
        };
      },
    }
  )
);


