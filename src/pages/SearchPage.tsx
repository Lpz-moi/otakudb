import { useState, useEffect } from 'react';
import { Search as SearchIcon, TrendingUp } from 'lucide-react';
import { searchAnime, getTopAnime, type Anime } from '@/services/jikanApi';
import { AdvancedSearchBar } from '@/components/search/AdvancedSearchBar';
import { SearchFilters, type SearchFiltersState } from '@/components/search/SearchFilters';
import { AnimeCardPremium } from '@/components/anime/AnimeCardPremium';
import { PageTransition } from '@/components/ui/page-transition';
import { motion } from 'framer-motion';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [trending, setTrending] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFiltersState>({
    genres: [],
    year: null,
    status: null,
    rating: null,
    orderBy: 'score',
  });

  // Load trending on mount
  useEffect(() => {
    const loadTrending = async () => {
      try {
        const res = await getTopAnime(1, 'airing');
        setTrending(res.data.slice(0, 18));
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };
    loadTrending();
  }, []);

  // Search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const res = await searchAnime(query);
        // Apply client-side filtering
        let filtered = res.data;
        
        if (filters.genres.length > 0) {
          filtered = filtered.filter(anime => 
            anime.genres?.some(g => filters.genres.includes(g.mal_id))
          );
        }
        
        if (filters.year) {
          filtered = filtered.filter(anime => anime.year === filters.year);
        }
        
        if (filters.status) {
          filtered = filtered.filter(anime => 
            anime.status?.toLowerCase().includes(filters.status!)
          );
        }

        // Sort results
        if (filters.orderBy === 'score') {
          filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
        } else if (filters.orderBy === 'popularity') {
          filtered.sort((a, b) => (a.popularity || 9999) - (b.popularity || 9999));
        }
        
        setResults(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, filters]);

  const showTrending = !query.trim() && !loading;

  // Loading skeleton
  const SkeletonCard = () => (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-muted/50 rounded-xl" />
      <div className="p-2.5 space-y-2">
        <div className="h-3 bg-muted/50 rounded w-3/4" />
        <div className="h-2 bg-muted/30 rounded w-1/2" />
      </div>
    </div>
  );

  return (
    <PageTransition>
      <div className="page-container space-y-5">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <SearchIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Recherche</h1>
              <p className="text-sm text-muted-foreground">Trouvez votre prochain anime</p>
            </div>
          </div>
          
          <AdvancedSearchBar
            value={query}
            onChange={setQuery}
            placeholder="Naruto, One Piece, Attack on Titan..."
            autoFocus
          />
          
          <SearchFilters filters={filters} onChange={setFilters} />
        </motion.div>

        {/* Results or Trending */}
        {query.trim() ? (
          <section>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between mb-4"
            >
              <p className="text-muted-foreground text-sm">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Recherche...
                  </span>
                ) : (
                  `${results.length} résultat${results.length > 1 ? 's' : ''}`
                )}
              </p>
            </motion.div>
            
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {results.map((anime, index) => (
                  <AnimeCardPremium key={anime.mal_id} anime={anime} index={index} />
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Aucun anime trouvé pour cette recherche</p>
              </motion.div>
            )}
          </section>
        ) : (
          <section>
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="section-title flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-primary" />
              En cours de diffusion
            </motion.h2>
            
            {initialLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {trending.map((anime, index) => (
                  <AnimeCardPremium key={anime.mal_id} anime={anime} index={index} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </PageTransition>
  );
};

export default SearchPage;