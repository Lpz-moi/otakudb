import { useEffect, useState } from 'react';
import { TrendingUp, Play, ChevronRight } from 'lucide-react';
import { getTopAnime, getSeasonalAnime, type Anime } from '@/services/jikanApi';
import { AnimeGrid } from '@/components/anime/AnimeGrid';
import { HeroCarousel } from '@/components/anime/HeroCarousel';
import { ScheduleSection } from '@/components/anime/ScheduleSection';
import { useAnimeListStore } from '@/stores/animeListStore';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [heroAnime, setHeroAnime] = useState<Anime[]>([]);
  const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getItemsByStatus } = useAnimeListStore();
  const watchingList = getItemsByStatus('watching');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [topRes, seasonalRes] = await Promise.all([
          getTopAnime(1, 'bypopularity'),
          getSeasonalAnime(),
        ]);

        // Use top 5 for hero carousel
        setHeroAnime(seasonalRes.data.slice(0, 5));
        setTrendingAnime(topRes.data.slice(0, 12));
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
    <div className="page-container space-y-10">
      {/* Hero Carousel */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 px-4 sm:px-6 lg:px-8 pt-4">
        <HeroCarousel animes={heroAnime} loading={loading} />
      </section>

      {/* Continue Watching */}
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
                    className="anime-card-image transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                    <div className="progress-bar bg-white/20">
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${item.anime.episodes ? (item.progress / item.anime.episodes) * 100 : 0}%` 
                        }} 
                      />
                    </div>
                    <p className="text-xs text-white font-medium">
                      Ép. {item.progress}/{item.anime.episodes || '?'}
                    </p>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
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
        <div className="glass-card p-6 text-center">
          <p className="text-destructive mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary text-sm"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Schedule */}
      <ScheduleSection />

      {/* Trending */}
      <section>
        <h2 className="section-title flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Tendances
        </h2>
        <AnimeGrid animes={trendingAnime} loading={loading} />
      </section>
    </div>
  );
};

export default HomePage;