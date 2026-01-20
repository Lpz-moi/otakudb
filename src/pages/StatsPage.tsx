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
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold">Statistiques</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4">
            <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Episodes & Rating */}
        <div className="glass-card p-6 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Tv className="w-5 h-5 text-primary" />
            Résumé
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Épisodes vus</span>
              <span className="text-xl font-bold">{stats.totalEpisodes}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Note moyenne</span>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-rating-gold fill-rating-gold" />
                <span className="text-xl font-bold">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-muted-foreground">Temps estimé</span>
              <span className="text-xl font-bold">
                {Math.round((stats.totalEpisodes * 24) / 60)}h
              </span>
            </div>
          </div>
        </div>

        {/* Top Genres */}
        <div className="glass-card p-6 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Genres préférés
          </h2>
          
          {topGenres.length > 0 ? (
            <div className="space-y-3">
              {topGenres.map(([genre, count], i) => {
                const maxCount = topGenres[0][1];
                const percentage = (count / maxCount) * 100;
                
                return (
                  <div key={genre} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{genre}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill"
                        style={{ 
                          width: `${percentage}%`,
                          animationDelay: `${i * 100}ms`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Ajoutez des animes pour voir vos genres préférés
            </p>
          )}
        </div>
      </div>

      {/* Empty State */}
      {stats.total === 0 && (
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Pas encore de statistiques</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Commencez à ajouter des animes à vos listes pour voir apparaître vos statistiques personnalisées.
          </p>
        </div>
      )}
    </div>
  );
};

export default StatsPage;
