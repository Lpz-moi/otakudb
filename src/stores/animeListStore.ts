import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
}

interface AnimeListState {
  items: Record<number, AnimeListItem>;
  addToList: (anime: Anime, status: ListStatus) => void;
  removeFromList: (animeId: number) => void;
  updateStatus: (animeId: number, status: ListStatus) => void;
  updateProgress: (animeId: number, progress: number) => void;
  updateRating: (animeId: number, rating: number | null) => void;
  toggleFavorite: (anime: Anime) => void;
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

export const useAnimeListStore = create<AnimeListState>()(
  persist(
    (set, get) => ({
      items: {},

      addToList: (anime, status) => {
        const now = new Date().toISOString();
        set((state) => ({
          items: {
            ...state.items,
            [anime.mal_id]: {
              anime,
              status,
              progress: 0,
              rating: null,
              addedAt: now,
              updatedAt: now,
            },
          },
        }));
      },

      removeFromList: (animeId) => {
        set((state) => {
          const { [animeId]: _, ...rest } = state.items;
          return { items: rest };
        });
      },

      updateStatus: (animeId, status) => {
        set((state) => {
          const item = state.items[animeId];
          if (!item) return state;
          return {
            items: {
              ...state.items,
              [animeId]: {
                ...item,
                status,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      updateProgress: (animeId, progress) => {
        set((state) => {
          const item = state.items[animeId];
          if (!item) return state;
          return {
            items: {
              ...state.items,
              [animeId]: {
                ...item,
                progress,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      updateRating: (animeId, rating) => {
        set((state) => {
          const item = state.items[animeId];
          if (!item) return state;
          return {
            items: {
              ...state.items,
              [animeId]: {
                ...item,
                rating,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      toggleFavorite: (anime) => {
        const state = get();
        const item = state.items[anime.mal_id];
        
        if (item) {
          if (item.status === 'favorites') {
            // Remove from favorites, set to planned
            set((s) => ({
              items: {
                ...s.items,
                [anime.mal_id]: {
                  ...item,
                  status: 'planned',
                  updatedAt: new Date().toISOString(),
                },
              },
            }));
          } else {
            // Add to favorites
            set((s) => ({
              items: {
                ...s.items,
                [anime.mal_id]: {
                  ...item,
                  status: 'favorites',
                  updatedAt: new Date().toISOString(),
                },
              },
            }));
          }
        } else {
          // Add new item as favorite
          state.addToList(anime, 'favorites');
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
    }),
    {
      name: 'otakudb-anime-list',
    }
  )
);
