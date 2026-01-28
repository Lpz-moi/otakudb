import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Filter, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchAnime, type Anime } from '@/services/jikanApi';
import { Link } from 'react-router-dom';

interface AdvancedSearchBarProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

// Persisted search history in localStorage
const HISTORY_KEY = 'otakudb-search-history';
const MAX_HISTORY = 8;

const getSearchHistory = (): string[] => {
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
};

const addToSearchHistory = (query: string) => {
  const history = getSearchHistory();
  const filtered = history.filter(h => h.toLowerCase() !== query.toLowerCase());
  const updated = [query, ...filtered].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};

const removeFromSearchHistory = (query: string) => {
  const history = getSearchHistory();
  const updated = history.filter(h => h !== query);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};

export const AdvancedSearchBar = ({ 
  value = '', 
  onChange, 
  placeholder = 'Rechercher un anime...', 
  autoFocus = false 
}: AdvancedSearchBarProps) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Anime[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  // Debounce suggestions
  useEffect(() => {
    if (localValue.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await searchAnime(localValue, 1);
        setSuggestions(res.data.slice(0, 5));
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue]);

  // Debounce the onChange callback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
        if (localValue.trim()) {
          addToSearchHistory(localValue.trim());
          setSearchHistory(getSearchHistory());
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [localValue, onChange, value]);

  // Sync with external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    setSuggestions([]);
    inputRef.current?.focus();
  }, [onChange]);

  const handleHistoryClick = (query: string) => {
    setLocalValue(query);
    onChange(query);
    setIsFocused(false);
  };

  const handleRemoveHistory = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    removeFromSearchHistory(query);
    setSearchHistory(getSearchHistory());
  };

  const handleSuggestionClick = (anime: Anime) => {
    setLocalValue(anime.title_english || anime.title);
    setSuggestions([]);
    setIsFocused(false);
  };

  const showDropdown = isFocused && (suggestions.length > 0 || (searchHistory.length > 0 && !localValue));

  return (
    <div ref={containerRef} className="relative">
      <div className={`relative transition-all duration-200 ${isFocused ? 'scale-[1.01]' : ''}`}>
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isFocused ? 'text-primary' : 'text-muted-foreground'}`} />
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`input-search pl-12 pr-10 transition-all duration-200 ${isFocused ? 'ring-2 ring-primary/30 border-primary/30' : ''}`}
        />
        <AnimatePresence>
          {localValue && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Dropdown with suggestions/history */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
          >
            {/* Loading state */}
            {loadingSuggestions && localValue && (
              <div className="px-4 py-3 flex items-center gap-2 text-muted-foreground text-sm">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Recherche...
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="py-1">
                <div className="px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Suggestions
                </div>
                {suggestions.map((anime) => (
                  <Link
                    key={anime.mal_id}
                    to={`/anime/${anime.mal_id}`}
                    onClick={() => handleSuggestionClick(anime)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors"
                  >
                    <img
                      src={anime.images.webp?.image_url || anime.images.jpg?.image_url}
                      alt={anime.title}
                      className="w-10 h-14 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium line-clamp-1">
                        {anime.title_english || anime.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {anime.genres?.slice(0, 2).map(g => g.name).join(' • ')}
                      </p>
                    </div>
                    {anime.score && (
                      <span className="text-xs font-semibold text-rating-gold">
                        ★ {anime.score.toFixed(1)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {/* Search History */}
            {!localValue && searchHistory.length > 0 && (
              <div className="py-1">
                <div className="px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  Recherches récentes
                </div>
                {searchHistory.map((query) => (
                  <button
                    key={query}
                    onClick={() => handleHistoryClick(query)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent transition-colors group"
                  >
                    <span className="text-sm text-foreground">{query}</span>
                    <button
                      onClick={(e) => handleRemoveHistory(e, query)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-all"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
