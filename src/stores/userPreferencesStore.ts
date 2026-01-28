import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VersionPreference = 'all' | 'vf' | 'vostfr';
export type ReminderTiming = '30min' | 'ontime' | 'both';

export interface UserProfile {
  username: string;
  avatar: string | null;
  createdAt: string;
}

export interface EpisodeReminder {
  animeId: number;
  animeTitle: string;
  episodeNumber: number;
  scheduledTime: string;
  reminderTiming: ReminderTiming;
  isVF: boolean;
}

export interface WatchedEpisode {
  animeId: number;
  episodeNumber: number;
  watchedAt: string;
}

interface UserPreferencesState {
  // User profile
  profile: UserProfile | null;
  
  // Preferences
  versionPreference: VersionPreference;
  timezone: string;
  language: string;
  
  // Reminders
  reminders: EpisodeReminder[];
  
  // Watched episodes (for calendar)
  watchedEpisodes: WatchedEpisode[];
  
  // Actions - Profile
  createProfile: (username: string, avatar?: string | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  deleteProfile: () => void;
  
  // Actions - Preferences
  setVersionPreference: (pref: VersionPreference) => void;
  setTimezone: (tz: string) => void;
  
  // Actions - Reminders
  addReminder: (reminder: Omit<EpisodeReminder, 'scheduledTime'> & { scheduledTime?: string }) => void;
  removeReminder: (animeId: number, episodeNumber: number) => void;
  hasReminder: (animeId: number, episodeNumber?: number) => boolean;
  getRemindersForAnime: (animeId: number) => EpisodeReminder[];
  
  // Actions - Watched Episodes
  markEpisodeWatched: (animeId: number, episodeNumber: number) => void;
  unmarkEpisodeWatched: (animeId: number, episodeNumber: number) => void;
  isEpisodeWatched: (animeId: number, episodeNumber: number) => boolean;
  getWatchedForAnime: (animeId: number) => number[];
  
  // Export/Import
  exportData: () => string;
  importData: (data: string) => boolean;
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      profile: null,
      versionPreference: 'all',
      timezone: 'Europe/Paris',
      language: 'fr',
      reminders: [],
      watchedEpisodes: [],

      createProfile: (username, avatar = null) => {
        set({
          profile: {
            username,
            avatar,
            createdAt: new Date().toISOString(),
          },
        });
      },

      updateProfile: (updates) => {
        const current = get().profile;
        if (!current) return;
        set({
          profile: { ...current, ...updates },
        });
      },

      deleteProfile: () => {
        set({
          profile: null,
          reminders: [],
          watchedEpisodes: [],
        });
      },

      setVersionPreference: (pref) => {
        set({ versionPreference: pref });
      },

      setTimezone: (tz) => {
        set({ timezone: tz });
      },

      addReminder: (reminder) => {
        const existing = get().reminders.find(
          (r) => r.animeId === reminder.animeId && r.episodeNumber === reminder.episodeNumber
        );
        if (existing) return;
        
        set((state) => ({
          reminders: [
            ...state.reminders,
            {
              ...reminder,
              scheduledTime: reminder.scheduledTime || new Date().toISOString(),
            },
          ],
        }));
      },

      removeReminder: (animeId, episodeNumber) => {
        set((state) => ({
          reminders: state.reminders.filter(
            (r) => !(r.animeId === animeId && r.episodeNumber === episodeNumber)
          ),
        }));
      },

      hasReminder: (animeId, episodeNumber) => {
        const reminders = get().reminders;
        if (episodeNumber !== undefined) {
          return reminders.some(
            (r) => r.animeId === animeId && r.episodeNumber === episodeNumber
          );
        }
        return reminders.some((r) => r.animeId === animeId);
      },

      getRemindersForAnime: (animeId) => {
        return get().reminders.filter((r) => r.animeId === animeId);
      },

      markEpisodeWatched: (animeId, episodeNumber) => {
        const existing = get().watchedEpisodes.find(
          (w) => w.animeId === animeId && w.episodeNumber === episodeNumber
        );
        if (existing) return;
        
        set((state) => ({
          watchedEpisodes: [
            ...state.watchedEpisodes,
            { animeId, episodeNumber, watchedAt: new Date().toISOString() },
          ],
        }));
      },

      unmarkEpisodeWatched: (animeId, episodeNumber) => {
        set((state) => ({
          watchedEpisodes: state.watchedEpisodes.filter(
            (w) => !(w.animeId === animeId && w.episodeNumber === episodeNumber)
          ),
        }));
      },

      isEpisodeWatched: (animeId, episodeNumber) => {
        return get().watchedEpisodes.some(
          (w) => w.animeId === animeId && w.episodeNumber === episodeNumber
        );
      },

      getWatchedForAnime: (animeId) => {
        return get()
          .watchedEpisodes.filter((w) => w.animeId === animeId)
          .map((w) => w.episodeNumber);
      },

      exportData: () => {
        const state = get();
        // Get anime list from localStorage
        let animeList = {};
        try {
          const animeListData = localStorage.getItem('otakudb-anime-list');
          if (animeListData) {
            const parsed = JSON.parse(animeListData);
            animeList = parsed.state?.items || {};
          }
        } catch (e) {
          console.error('Error reading anime list:', e);
        }
        
        return JSON.stringify({
          profile: state.profile,
          versionPreference: state.versionPreference,
          timezone: state.timezone,
          language: state.language,
          reminders: state.reminders,
          watchedEpisodes: state.watchedEpisodes,
          // Include anime lists
          animeList: animeList,
        });
      },

      importData: (data) => {
        try {
          const parsed = JSON.parse(data);
          set({
            profile: parsed.profile || null,
            versionPreference: parsed.versionPreference || 'all',
            timezone: parsed.timezone || 'Europe/Paris',
            language: parsed.language || 'fr',
            reminders: parsed.reminders || [],
            watchedEpisodes: parsed.watchedEpisodes || [],
          });
          
          // Import anime list if present
          if (parsed.animeList && Object.keys(parsed.animeList).length > 0) {
            try {
              const existingData = localStorage.getItem('otakudb-anime-list');
              const existing = existingData ? JSON.parse(existingData) : { state: { items: {} }, version: 0 };
              localStorage.setItem('otakudb-anime-list', JSON.stringify({
                ...existing,
                state: { items: parsed.animeList },
              }));
            } catch (e) {
              console.error('Error importing anime list:', e);
            }
          }
          
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'otakudb-user-preferences',
    }
  )
);
