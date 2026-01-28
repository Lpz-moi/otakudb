const BASE_URL = 'https://api.jikan.moe/v4';

// Rate limiting: Jikan allows 3 requests per second
const requestQueue: (() => Promise<void>)[] = [];
let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || requestQueue.length === 0) return;
  isProcessing = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      await request();
      await new Promise(resolve => setTimeout(resolve, 350)); // ~3 requests per second
    }
  }
  
  isProcessing = false;
};

const queueRequest = <T>(fn: () => Promise<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    processQueue();
  });
};

// Cache implementation
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCached = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
};

const setCache = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

export interface Anime {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
    webp: {
      image_url: string;
      large_image_url: string;
    };
  };
  synopsis: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  episodes: number | null;
  status: string;
  rating: string | null;
  source: string | null;
  duration: string | null;
  aired: {
    from: string | null;
    to: string | null;
    string: string | null;
  };
  season: string | null;
  year: number | null;
  studios: { mal_id: number; name: string }[];
  genres: { mal_id: number; name: string }[];
  themes: { mal_id: number; name: string }[];
  demographics: { mal_id: number; name: string }[];
  trailer: {
    youtube_id: string | null;
    url: string | null;
  } | null;
}

interface JikanResponse<T> {
  data: T;
  pagination?: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
}

const fetchWithRetry = async <T>(url: string, retries = 3): Promise<T> => {
  const cacheKey = url;
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  return queueRequest(async () => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        
        if (response.status === 429) {
          // Rate limited, wait and retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setCache(cacheKey, data);
        return data;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error('Max retries reached');
  });
};

export const getTopAnime = async (page = 1, filter = 'bypopularity'): Promise<JikanResponse<Anime[]>> => {
  return fetchWithRetry(`${BASE_URL}/top/anime?page=${page}&filter=${filter}&limit=24`);
};

export const getSeasonalAnime = async (year?: number, season?: string): Promise<JikanResponse<Anime[]>> => {
  const url = year && season 
    ? `${BASE_URL}/seasons/${year}/${season}?limit=24`
    : `${BASE_URL}/seasons/now?limit=24`;
  return fetchWithRetry(url);
};

export const searchAnime = async (query: string, page = 1): Promise<JikanResponse<Anime[]>> => {
  return fetchWithRetry(`${BASE_URL}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=24&sfw=true`);
};

export const getAnimeById = async (id: number): Promise<JikanResponse<Anime>> => {
  return fetchWithRetry(`${BASE_URL}/anime/${id}/full`);
};

export const getAnimeRecommendations = async (id: number): Promise<JikanResponse<{ entry: Anime }[]>> => {
  return fetchWithRetry(`${BASE_URL}/anime/${id}/recommendations`);
};

export const getAnimeByGenre = async (genreId: number, page = 1): Promise<JikanResponse<Anime[]>> => {
  return fetchWithRetry(`${BASE_URL}/anime?genres=${genreId}&page=${page}&limit=24&order_by=score&sort=desc`);
};

export const getGenres = async (): Promise<JikanResponse<{ mal_id: number; name: string; count: number }[]>> => {
  return fetchWithRetry(`${BASE_URL}/genres/anime`);
};

export interface ScheduleAnime extends Anime {
  broadcast?: {
    day: string | null;
    time: string | null;
    timezone: string | null;
    string: string | null;
  };
}

export const getSchedule = async (day?: string): Promise<JikanResponse<ScheduleAnime[]>> => {
  const url = day 
    ? `${BASE_URL}/schedules?filter=${day}&limit=24`
    : `${BASE_URL}/schedules?limit=24`;
  return fetchWithRetry(url);
};
