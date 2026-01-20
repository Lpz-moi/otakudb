import { useEffect, useState } from 'react';
import { TrendingUp, Calendar, Play, ChevronRight } from 'lucide-react';
import { getTopAnime, getSeasonalAnime, type Anime } from '@/services/jikanApi';
import { AnimeGrid } from '@/components/anime/AnimeGrid';
import { useAnimeListStore } from '@/stores/animeListStore';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]);
  const [seasonalAnime, setSeasonalAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getItemsByStatus } = useAnimeListStore();
  const watchingList = getItemsByStatus('watching');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [trendingRes, seasonalRes] = await Promise.all([
          getTopAnime(1, 'bypopularity'),
          getSeasonalAnime(),
        ]);

        setTrendingAnime(trendingRes.data.slice(0, 12));
        setSeasonalAnime(seasonalRes.data.slice(0, 12));
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="page-container space-y-12">
      {/* Hero Section - Clean and simple */}
      <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 px-6 sm:px-8 lg:px-12 py-12 md:py-16 border-b border-border/50">
        <div className="max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground leading-tight">
            Bienvenue sur{' '}
            <span className="text-primary">OtakuDB</span>
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Gérez vos animes et suivez votre progression.
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/search" className="btn-primary inline-flex items-center gap-2">
              Explorer
            </Link>
            <Link to="/lists" className="btn-secondary inline-flex items-center gap-2">
              Mes Listes
            </Link>
          </div>
        </div>
      </section>

      {watchingList.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2 mb-0">
              <Play className="w-5 h-5 text-primary" />
              Continuer
            </h2>
            <Link to="/lists" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              Voir tout
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {watchingList.slice(0, 6).map((item) => (
              <Link
                key={item.anime.mal_id}
                to={`/anime/${item.anime.mal_id}`}
                className="anime-card group block"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-t-2xl">
                  <img
                    src={item.anime.images.webp?.large_image_url || item.anime.images.jpg?.large_image_url}
                    alt={item.anime.title}
                    className="anime-card-image transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  
                  {/* Progress overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                    <div className="progress-bar bg-white/20">
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${item.anime.episodes ? (item.progress / item.anime.episodes) * 100 : 0}%` 
                        }} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-white font-medium">
                        Ép. {item.progress}/{item.anime.episodes || '?'}
                      </p>
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-primary-foreground fill-current" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {item.anime.title_english || item.anime.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Error State */}
      {error && (
        <div className="glass-card p-8 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            Réessayer
          </button>
        </div>
      )}

      <section>
        <h2 className="section-title flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Tendances
        </h2>
        <AnimeGrid animes={trendingAnime} loading={loading} />
      </section>

      {/* Seasonal */}
      <section>
        <h2 className="section-title flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          Cette saison
        </h2>
        <AnimeGrid animes={seasonalAnime} loading={loading} />
      </section>
    </div>
  );
};

export default HomePage;
