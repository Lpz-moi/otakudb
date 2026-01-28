import { create } from 'zustand';
import { discordStorageService, STORAGE_TYPES } from '@/services/discordStorage';
import type { Anime } from '@/services/jikanApi';

export type ListStatus = 'watching' | 'completed' | 'planned' | 'favorites';

export interface AnimeListItem {
  anime: Anime;
  status: ListStatus;
  progress: number;
  rating: number | null;
  addedAt: string;
  updatedAt: string;
  notes?: string;
  tags?: string[];
  discordMessageId?: string;
}

interface AnimeListState {
  items: Record<number, AnimeListItem>;
  isLoading: boolean;
  isSyncing: boolean;
  lastSync: number | null;
  
  // Actions
  initialize: () => Promise<void>;
  sync: () => Promise<void>;
  addToList: (anime: Anime, status: ListStatus) => Promise<void>;
  removeFromList: (animeId: number) => Promise<void>;
  updateStatus: (animeId: number, status: ListStatus) => Promise<void>;
  updateProgress: (animeId: number, progress: number) => Promise<void>;
  updateRating: (animeId: number, rating: number | null) => Promise<void>;
  toggleFavorite: (anime: Anime) => Promise<void>;
  getItemsByStatus: (status: ListStatus) => AnimeListItem[];
  getItemById: (animeId: number) => AnimeListItem | null;
  isInList: (animeId: number) => boolean;
  isFavorite: (animeId: number) => boolean;
  getStats: () => {
    total: number;
    watching: number;
    completed: number;
    planned: number;
    favorites: number;
    totalEpisodes: number;
    averageRating: number;
  };
}

// Cache local pour réduire les appels API
let localCache: Record<number, AnimeListItem> = {};
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
