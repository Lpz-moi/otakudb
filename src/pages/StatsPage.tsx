import { BarChart3, Play, Check, Clock, Heart, Star, Tv } from 'lucide-react';
import { useAnimeListStore } from '@/stores/animeListStore';

const StatsPage = () => {
  const { getStats, getItemsByStatus } = useAnimeListStore();
  const stats = getStats();
  const allItems = [...getItemsByStatus('watching'), ...getItemsByStatus('completed'), ...getItemsByStatus('planned'), ...getItemsByStatus('favorites')];
  
  // Get unique genres from all anime
  const genreCount: Record<string, number> = {};
  allItems.forEach((item) => {
    item.anime.genres?.forEach((genre) => {
      genreCount[genre.name] = (genreCount[genre.name] || 0) + 1;
    });
  });
  const topGenres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const statCards = [
    { label: 'Total', value: stats.total, icon: Tv, color: 'text-foreground' },
    { label: 'En cours', value: stats.watching, icon: Play, color: 'text-status-watching' },
    { label: 'Terminés', value: stats.completed, icon: Check, color: 'text-status-completed' },
    { label: 'À voir', value: stats.planned, icon: Clock, color: 'text-status-planned' },
    { label: 'Favoris', value: stats.favorites, icon: Heart, color: 'text-status-favorites' },
  ];

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-display font-bold">Statistiques</h1>
      </div>

      {/* Overview Cards - Mobile optimized grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-3.5">
            <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center mb-2.5 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-foreground">{value}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Episodes & Rating */}
        <div className="glass-card p-4 sm:p-5 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Tv className="w-4 h-4 text-primary" />
            Résumé
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-border">
              <span className="text-sm text-muted-foreground">Épisodes vus</span>
              <span className="text-lg font-bold">{stats.totalEpisodes}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-border">
              <span className="text-sm text-muted-foreground">Note moyenne</span>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-rating-gold fill-rating-gold" />
                <span className="text-lg font-bold">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-muted-foreground">Temps estimé</span>
              <span className="text-lg font-bold">
                {Math.round((stats.totalEpisodes * 24) / 60)}h
              </span>
            </div>
          </div>
        </div>

        {/* Top Genres */}
        <div className="glass-card p-4 sm:p-5 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            Genres préférés
          </h2>
          
          {topGenres.length > 0 ? (
            <div className="space-y-2.5">
              {topGenres.map(([genre, count], i) => {
                const maxCount = topGenres[0][1];
                const percentage = (count / maxCount) * 100;
                
                return (
                  <div key={genre} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{genre}</span>
                      <span className="text-muted-foreground text-xs">{count}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill"
                        style={{ 
                          width: `${percentage}%`,
                          animationDelay: `${i * 80}ms`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-6">
              Ajoutez des animes pour voir vos genres préférés
            </p>
          )}
        </div>
      </div>

      {/* Empty State */}
      {stats.total === 0 && (
        <div className="glass-card p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium text-foreground mb-1">Pas encore de statistiques</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Commencez à ajouter des animes pour voir apparaître vos statistiques.
          </p>
        </div>
      )}
    </div>
  );
};

export default StatsPage;
