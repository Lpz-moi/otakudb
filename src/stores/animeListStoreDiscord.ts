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

let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useAnimeListStoreDiscord = create<AnimeListState>((set, get) => ({
  items: {},
  isLoading: false,
  isSyncing: false,
  lastSync: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      // Vérifier le cache local
      const now = Date.now();
      if (localCache && Object.keys(localCache).length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
        set({ items: localCache, isLoading: false });
        return;
      }

      // Charger depuis Discord
      const data = await discordStorageService.read(STORAGE_TYPES.LISTS);
      
      const items: Record<number, AnimeListItem> = {};
      data.forEach((item: any) => {
        if (item.animeId && item.anime) {
          items[item.animeId] = {
            anime: item.anime,
            status: item.status || 'planned',
            progress: item.progress || 0,
            rating: item.rating || null,
            addedAt: item.addedAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString(),
            notes: item.notes,
            tags: item.tags,
            discordMessageId: item.messageId,
          };
        }
      });

      localCache = items;
      cacheTimestamp = now;
      
      set({ 
        items, 
        isLoading: false,
        lastSync: now,
      });
    } catch (error) {
      console.error('Error initializing anime list:', error);
      set({ isLoading: false });
    }
  },

  sync: async () => {
    const state = get();
    if (state.isSyncing) return;

    set({ isSyncing: true });
    try {
      const items = state.items;
      const operations = Object.values(items).map(item => ({
        action: item.discordMessageId ? 'update' : 'create' as const,
        data: {
          animeId: item.anime.mal_id,
          anime: item.anime,
          status: item.status,
          progress: item.progress,
          rating: item.rating,
          addedAt: item.addedAt,
          updatedAt: item.updatedAt,
          notes: item.notes,
          tags: item.tags,
        },
        messageId: item.discordMessageId,
      }));

      // Utiliser batch pour optimiser
      const results = await discordStorageService.batch(STORAGE_TYPES.LISTS, operations);
      
      // Mettre à jour les messageIds
      const updatedItems = { ...items };
      results.forEach((result, index) => {
        if (result.success && result.messageId) {
          const item = Object.values(items)[index];
          if (item) {
            updatedItems[item.anime.mal_id] = {
              ...item,
              discordMessageId: result.messageId,
            };
          }
        }
      });

      localCache = updatedItems;
      cacheTimestamp = Date.now();

      set({ 
        items: updatedItems,
        isSyncing: false,
        lastSync: Date.now(),
      });
    } catch (error) {
      console.error('Error syncing anime list:', error);
      set({ isSyncing: false });
    }
  },

  addToList: async (anime, status) => {
    const now = new Date().toISOString();
    const newItem: AnimeListItem = {
      anime,
      status,
      progress: 0,
      rating: null,
      addedAt: now,
      updatedAt: now,
    };

    set((state) => ({
      items: {
        ...state.items,
        [anime.mal_id]: newItem,
      },
    }));

    // Synchroniser avec Discord
    try {
      const result = await discordStorageService.create(STORAGE_TYPES.LISTS, {
        animeId: anime.mal_id,
        anime,
        status,
        progress: 0,
        rating: null,
        addedAt: now,
        updatedAt: now,
      });

      set((state) => ({
        items: {
          ...state.items,
          [anime.mal_id]: {
            ...newItem,
            discordMessageId: result.messageId,
          },
        },
      }));

      localCache = get().items;
      cacheTimestamp = Date.now();
    } catch (error) {
      console.error('Error adding to list:', error);
      // L'item reste en local même si la sync échoue
    }
  },

  removeFromList: async (animeId) => {
    const item = get().items[animeId];
    
    set((state) => {
      const { [animeId]: _, ...rest } = state.items;
      return { items: rest };
    });

    // Supprimer de Discord
    if (item?.discordMessageId) {
      try {
        await discordStorageService.delete(STORAGE_TYPES.LISTS, item.discordMessageId);
        localCache = get().items;
        cacheTimestamp = Date.now();
      } catch (error) {
        console.error('Error removing from list:', error);
      }
    }
  },

  updateStatus: async (animeId, status) => {
    const item = get().items[animeId];
    if (!item) return;

    const updated = {
      ...item,
      status,
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      items: {
        ...state.items,
        [animeId]: updated,
      },
    }));

    // Synchroniser avec Discord
    if (item.discordMessageId) {
      try {
        await discordStorageService.update(STORAGE_TYPES.LISTS, item.discordMessageId, {
          animeId: item.anime.mal_id,
          anime: item.anime,
          status,
          progress: item.progress,
          rating: item.rating,
          addedAt: item.addedAt,
          updatedAt: updated.updatedAt,
          notes: item.notes,
          tags: item.tags,
        });
        localCache = get().items;
        cacheTimestamp = Date.now();
      } catch (error) {
        console.error('Error updating status:', error);
      }
    }
  },

  updateProgress: async (animeId, progress) => {
    const item = get().items[animeId];
    if (!item) return;

    const updated = {
      ...item,
      progress,
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      items: {
        ...state.items,
        [animeId]: updated,
      },
    }));

    // Synchroniser avec Discord
    if (item.discordMessageId) {
      try {
        await discordStorageService.update(STORAGE_TYPES.LISTS, item.discordMessageId, {
          animeId: item.anime.mal_id,
          anime: item.anime,
          status: item.status,
          progress,
          rating: item.rating,
          addedAt: item.addedAt,
          updatedAt: updated.updatedAt,
          notes: item.notes,
          tags: item.tags,
        });
        localCache = get().items;
        cacheTimestamp = Date.now();
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  },

  updateRating: async (animeId, rating) => {
    const item = get().items[animeId];
    if (!item) return;

    const updated = {
      ...item,
      rating,
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      items: {
        ...state.items,
        [animeId]: updated,
      },
    }));

    // Synchroniser avec Discord
    if (item.discordMessageId) {
      try {
        await discordStorageService.update(STORAGE_TYPES.LISTS, item.discordMessageId, {
          animeId: item.anime.mal_id,
          anime: item.anime,
          status: item.status,
          progress: item.progress,
          rating,
          addedAt: item.addedAt,
          updatedAt: updated.updatedAt,
          notes: item.notes,
          tags: item.tags,
        });
        localCache = get().items;
        cacheTimestamp = Date.now();
      } catch (error) {
        console.error('Error updating rating:', error);
      }
    }
  },

  toggleFavorite: async (anime) => {
    const state = get();
    const item = state.items[anime.mal_id];
    
    if (item) {
      if (item.status === 'favorites') {
        await state.updateStatus(anime.mal_id, 'planned');
      } else {
        await state.updateStatus(anime.mal_id, 'favorites');
      }
    } else {
      await state.addToList(anime, 'favorites');
    }
  },

  getItemsByStatus: (status) => {
    const state = get();
    return Object.values(state.items).filter((item) => item.status === status);
  },

  getItemById: (animeId) => {
    const state = get();
    return state.items[animeId] || null;
  },

  isInList: (animeId) => {
    const state = get();
    return !!state.items[animeId];
  },

  isFavorite: (animeId) => {
    const state = get();
    const item = state.items[animeId];
    return item?.status === 'favorites';
  },

  getStats: () => {
    const state = get();
    const items = Object.values(state.items);
    const ratings = items.filter((i) => i.rating !== null).map((i) => i.rating!);
    
    return {
      total: items.length,
      watching: items.filter((i) => i.status === 'watching').length,
      completed: items.filter((i) => i.status === 'completed').length,
      planned: items.filter((i) => i.status === 'planned').length,
      favorites: items.filter((i) => i.status === 'favorites').length,
      totalEpisodes: items.reduce((acc, i) => acc + i.progress, 0),
      averageRating: ratings.length > 0 
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 
        : 0,
    };
  },
}));
