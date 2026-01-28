import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SearchFiltersState {
  genres: number[];
  year: number | null;
  status: string | null;
  rating: string | null;
  orderBy: string;
}

interface SearchFiltersProps {
  filters: SearchFiltersState;
  onChange: (filters: SearchFiltersState) => void;
}

const GENRES = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Aventure' },
  { id: 4, name: 'Comédie' },
  { id: 8, name: 'Drame' },
  { id: 10, name: 'Fantasy' },
  { id: 14, name: 'Horreur' },
  { id: 7, name: 'Mystère' },
  { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' },
  { id: 36, name: 'Slice of Life' },
  { id: 30, name: 'Sports' },
  { id: 37, name: 'Surnaturel' },
];

const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

const STATUS_OPTIONS = [
  { value: 'airing', label: 'En cours' },
  { value: 'complete', label: 'Terminé' },
  { value: 'upcoming', label: 'À venir' },
];

const ORDER_OPTIONS = [
  { value: 'score', label: 'Note' },
  { value: 'popularity', label: 'Popularité' },
  { value: 'start_date', label: 'Date de sortie' },
  { value: 'title', label: 'Titre' },
];

export const SearchFilters = ({ filters, onChange }: SearchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const hasActiveFilters = 
    filters.genres.length > 0 || 
    filters.year !== null || 
    filters.status !== null ||
    filters.rating !== null;

  const toggleGenre = (genreId: number) => {
    const newGenres = filters.genres.includes(genreId)
      ? filters.genres.filter(g => g !== genreId)
      : [...filters.genres, genreId];
    onChange({ ...filters, genres: newGenres });
  };

  const clearFilters = () => {
    onChange({
      genres: [],
      year: null,
      status: null,
      rating: null,
      orderBy: 'score',
    });
  };

  return (
    <div className="space-y-3">
      {/* Filter Toggle */}
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            isOpen || hasActiveFilters
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtres
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-primary-foreground/20 text-[10px] flex items-center justify-center font-bold">
              {filters.genres.length + (filters.year ? 1 : 0) + (filters.status ? 1 : 0)}
            </span>
          )}
        </motion.button>

        {/* Order By */}
        <div className="relative">
          <button
            onClick={() => setActiveSection(activeSection === 'order' ? null : 'order')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            Trier par
            <ChevronDown className={`w-4 h-4 transition-transform ${activeSection === 'order' ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {activeSection === 'order' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 min-w-[150px]"
              >
                {ORDER_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange({ ...filters, orderBy: option.value });
                      setActiveSection(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${
                      filters.orderBy === option.value ? 'text-primary font-medium' : 'text-foreground'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
            Effacer
          </motion.button>
        )}
      </div>

      {/* Expanded Filters Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 space-y-4">
              {/* Genres */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(genre => (
                    <motion.button
                      key={genre.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleGenre(genre.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filters.genres.includes(genre.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {genre.name}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Year & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Année</h4>
                  <select
                    value={filters.year || ''}
                    onChange={(e) => onChange({ ...filters, year: e.target.value ? Number(e.target.value) : null })}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground"
                  >
                    <option value="">Toutes</option>
                    {YEARS.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Statut</h4>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => onChange({ ...filters, status: e.target.value || null })}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground"
                  >
                    <option value="">Tous</option>
                    {STATUS_OPTIONS.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
