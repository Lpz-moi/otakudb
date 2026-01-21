import { useEffect, useState } from 'react';
import { TrendingUp, Play, ChevronRight, Tv } from 'lucide-react';
import { getTopAnime, getSeasonalAnime, type Anime } from '@/services/jikanApi';
import { AnimeGrid } from '@/components/anime/AnimeGrid';
import { HeroCarousel } from '@/components/anime/HeroCarousel';
import { CalendarSchedule } from '@/components/calendar/CalendarSchedule';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';
import { useAnimeListStore } from '@/stores/animeListStore';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [heroAnime, setHeroAnime] = useState<Anime[]>([]);
  const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getItemsByStatus, getStats } = useAnimeListStore();
  const watchingList = getItemsByStatus('watching');
  const stats = getStats();

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
    <div className="page-container space-y-6 sm:space-y-8 lg:space-y-10">
      {/* Welcome message for new users */}
      {stats.total === 0 && (
        <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 sm:p-6 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Tv className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-foreground">Bienvenue sur OtakuDB</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Suivez vos animes préférés, recevez des rappels et ne manquez plus jamais un épisode.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2 py-1 text-xs rounded-lg bg-primary/10 text-primary font-medium">📅 Calendrier intelligent</span>
                <span className="px-2 py-1 text-xs rounded-lg bg-primary/10 text-primary font-medium">🔔 Rappels personnalisés</span>
                <span className="px-2 py-1 text-xs rounded-lg bg-primary/10 text-primary font-medium">🇫🇷 Horaires français</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hero Carousel */}
      <section className="-mx-4 sm:-mx-5 md:-mx-6 lg:-mx-8">
        <div className="px-4 sm:px-5 md:px-6 lg:px-8">
          <HeroCarousel animes={heroAnime} loading={loading} />
        </div>
      </section>

      {/* Continue Watching */}
      {watchingList.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="section-title flex items-center gap-2 mb-0">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Continuer
            </h2>
            <Link to="/lists" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 touch-target">
              Voir tout
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {watchingList.slice(0, 6).map((item) => (
              <Link
                key={item.anime.mal_id}
                to={`/anime/${item.anime.mal_id}`}
                className="anime-card group block active:scale-[0.98] transition-transform"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl sm:rounded-t-2xl">
                  <img
                    src={item.anime.images.webp?.large_image_url || item.anime.images.jpg?.large_image_url}
                    alt={item.anime.title}
                    className="anime-card-image transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
                    <div className="progress-bar bg-white/20">
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${item.anime.episodes ? (item.progress / item.anime.episodes) * 100 : 0}%` 
                        }} 
                      />
                    </div>
                    <p className="text-[10px] sm:text-xs text-white font-medium">
                      Ép. {item.progress}/{item.anime.episodes || '?'}
                    </p>
                  </div>
                </div>
                <div className="p-2.5 sm:p-3">
                  <h3 className="font-medium text-xs sm:text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
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

      {/* Premium Calendar Schedule */}
      <CalendarSchedule />

      {/* Personalized Recommendations */}
      <RecommendationsSection />

      {/* Trending */}
      <section>
        <h2 className="section-title flex items-center gap-2">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Tendances
        </h2>
        <AnimeGrid animes={trendingAnime} loading={loading} />
      </section>
    </div>
  );
};

export default HomePage;