import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, RefreshCw, Heart } from 'lucide-react';
import { useAnimeListStore } from '@/stores/animeListStore';
import { getAnimeByGenre, type Anime } from '@/services/jikanApi';
import { AnimeCard } from '@/components/anime/AnimeCard';

export const RecommendationsSection = () => {
  const [recommendations, setRecommendations] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { items, getStats } = useAnimeListStore();
  const stats = getStats();

  // Calculate top genres from user's list
  const topGenres = useMemo(() => {
    const genreCount: Record<number, { count: number; name: string }> = {};
    
    Object.values(items).forEach((item) => {
      item.anime.genres?.forEach((genre) => {
        if (!genreCount[genre.mal_id]) {
          genreCount[genre.mal_id] = { count: 0, name: genre.name };
        }
        genreCount[genre.mal_id].count++;
      });
    });
    
    return Object.entries(genreCount)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3)
      .map(([id, data]) => ({ id: Number(id), name: data.name, count: data.count }));
  }, [items]);

  // Get anime IDs in user's list to exclude
  const userAnimeIds = useMemo(() => {
    return new Set(Object.keys(items).map(Number));
  }, [items]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (topGenres.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const topGenreId = topGenres[0]?.id;
        if (!topGenreId) {
          setRecommendations([]);
          return;
        }

        const response = await getAnimeByGenre(topGenreId);
        
        const filtered = (response.data || [])
          .filter((anime) => !userAnimeIds.has(anime.mal_id))
          .slice(0, 6);
        
        setRecommendations(filtered);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [topGenres, userAnimeIds, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  // Don't show if user has no anime in list
  if (stats.total === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary" />
          <h2 className="text-base sm:text-lg font-display font-bold">Pour toi</h2>
        </div>
        
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors touch-target"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>

      {/* Genre tags */}
      {topGenres.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Basé sur :</span>
          {topGenres.map((genre) => (
            <span
              key={genre.id}
              className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-foreground/80"
            >
              {genre.name}
            </span>
          ))}
        </div>
      )}

      {/* Recommendations Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] skeleton rounded-xl" />
              <div className="p-2.5 space-y-2">
                <div className="h-4 skeleton w-4/5" />
                <div className="h-3 skeleton w-3/5" />
              </div>
            </div>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Star className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">
            Ajoute plus d'animes pour des recommandations personnalisées.
          </p>
          <Link to="/search" className="btn-primary text-sm mt-3">
            Explorer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {recommendations.map((anime) => (
            <AnimeCard key={anime.mal_id} anime={anime} />
          ))}
        </div>
      )}
    </section>
  );
};
