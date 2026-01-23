import { useEffect, useState } from 'react';
import { TrendingUp, Play, ChevronRight, Tv, Calendar, Bell, Globe } from 'lucide-react';
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
    <div className="page-container space-y-6 sm:space-y-8">
      {/* Welcome message for new users */}
      {stats.total === 0 && (
        <section className="bg-gradient-to-br from-primary/8 via-primary/4 to-transparent rounded-2xl p-4 sm:p-5 border border-primary/15">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Tv className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-foreground text-base">Bienvenue sur OtakuDB</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Suivez vos animes préférés, recevez des rappels et ne manquez plus jamais un épisode.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-secondary/80 text-muted-foreground font-medium">
                  <Calendar className="w-3 h-3" />
                  Calendrier intelligent
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-secondary/80 text-muted-foreground font-medium">
                  <Bell className="w-3 h-3" />
                  Rappels personnalisés
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-secondary/80 text-muted-foreground font-medium">
                  <Globe className="w-3 h-3" />
                  Horaires français
                </span>
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title flex items-center gap-2 mb-0 text-base sm:text-lg">
              <Play className="w-4 h-4 text-primary" />
              Reprendre
            </h2>
            <Link to="/lists" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 touch-target">
              Tout voir
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {watchingList.slice(0, 6).map((item) => (
              <Link
                key={item.anime.mal_id}
                to={`/anime/${item.anime.mal_id}`}
                className="anime-card group block active:scale-[0.98] transition-transform"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                  <img
                    src={item.anime.images.webp?.large_image_url || item.anime.images.jpg?.large_image_url}
                    alt={item.anime.title}
                    className="anime-card-image transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 space-y-1.5">
                    <div className="progress-bar bg-white/20">
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${item.anime.episodes ? (item.progress / item.anime.episodes) * 100 : 0}%` 
                        }} 
                      />
                    </div>
                    <p className="text-[10px] text-white/90 font-medium">
                      Ép. {item.progress}/{item.anime.episodes || '?'}
                    </p>
                  </div>
                </div>
                <div className="p-2.5">
                  <h3 className="font-medium text-xs text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
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
        <div className="glass-card p-5 text-center">
          <p className="text-destructive text-sm mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary text-sm"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Calendar Schedule */}
      <CalendarSchedule />

      {/* Personalized Recommendations */}
      <RecommendationsSection />

      {/* Trending */}
      <section>
        <h2 className="section-title flex items-center gap-2 text-base sm:text-lg">
          <TrendingUp className="w-4 h-4 text-primary" />
          Tendances
        </h2>
        <AnimeGrid animes={trendingAnime} loading={loading} />
      </section>
    </div>
  );
};

export default HomePage;
