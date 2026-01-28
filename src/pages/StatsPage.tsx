import { BarChart3, Play, Check, Clock, Heart, Star, Tv, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAnimeListStore } from '@/stores/animeListStore';
import { PageTransition } from '@/components/ui/page-transition';

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
    .slice(0, 6);

  // Get studios stats
  const studioCount: Record<string, number> = {};
  allItems.forEach((item) => {
    item.anime.studios?.forEach((studio) => {
      studioCount[studio.name] = (studioCount[studio.name] || 0) + 1;
    });
  });
  const topStudios = Object.entries(studioCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const statCards = [
    { label: 'Total', value: stats.total, icon: Tv, color: 'text-foreground', bg: 'bg-secondary' },
    { label: 'En cours', value: stats.watching, icon: Play, color: 'text-status-watching', bg: 'bg-status-watching/10' },
    { label: 'Terminés', value: stats.completed, icon: Check, color: 'text-status-completed', bg: 'bg-status-completed/10' },
    { label: 'À voir', value: stats.planned, icon: Clock, color: 'text-status-planned', bg: 'bg-status-planned/10' },
    { label: 'Favoris', value: stats.favorites, icon: Heart, color: 'text-status-favorites', bg: 'bg-status-favorites/10' },
  ];

  // Calculate estimated watch time (avg 24min per episode)
  const totalMinutes = stats.totalEpisodes * 24;
  const hours = Math.floor(totalMinutes / 60);
  const days = Math.floor(hours / 24);

  return (
    <PageTransition>
      <div className="page-container space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold">Statistiques</h1>
            <p className="text-sm text-muted-foreground">Vos données de visionnage</p>
          </div>
        </motion.div>

        {/* Overview Cards - Mobile optimized grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {statCards.map(({ label, value, icon: Icon, color, bg }, index) => (
            <motion.div 
              key={label} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-3.5 hover:scale-[1.02] transition-transform"
            >
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2.5`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <motion.p 
                className="text-xl font-bold text-foreground"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 + 0.2, type: 'spring', stiffness: 200 }}
              >
                {value}
              </motion.p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Watch Time Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5 bg-gradient-to-br from-primary/5 via-transparent to-transparent"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Temps de visionnage</h2>
              <p className="text-xs text-muted-foreground">Basé sur vos épisodes vus</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <motion.p 
                className="text-2xl sm:text-3xl font-bold text-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {stats.totalEpisodes}
              </motion.p>
              <p className="text-xs text-muted-foreground">Épisodes</p>
            </div>
            <div>
              <motion.p 
                className="text-2xl sm:text-3xl font-bold text-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {hours}h
              </motion.p>
              <p className="text-xs text-muted-foreground">Heures</p>
            </div>
            <div>
              <motion.p 
                className="text-2xl sm:text-3xl font-bold text-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {days}
              </motion.p>
              <p className="text-xs text-muted-foreground">Jours</p>
            </div>
          </div>
        </motion.div>

        {/* Detailed Stats */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Rating Summary */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-4 sm:p-5 space-y-4"
          >
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-rating-gold" />
              Note moyenne
            </h2>
            
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-muted/30"
                  />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    className="text-rating-gold"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: stats.averageRating > 0 ? stats.averageRating / 10 : 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    strokeDasharray="220"
                    strokeDashoffset="0"
                    style={{
                      strokeDasharray: `${(stats.averageRating / 10) * 220} 220`
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-foreground">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {stats.averageRating >= 8 && 'Excellent goût !'}
                  {stats.averageRating >= 6 && stats.averageRating < 8 && 'Bons choix !'}
                  {stats.averageRating > 0 && stats.averageRating < 6 && 'Explorateur !'}
                  {stats.averageRating === 0 && 'Notez vos animes pour voir votre moyenne'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Top Genres */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-4 sm:p-5 space-y-4"
          >
            <h2 className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
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
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.6, delay: 0.6 + i * 0.1 }}
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
          </motion.div>
        </div>

        {/* Top Studios */}
        {topStudios.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-4 sm:p-5"
          >
            <h2 className="text-base font-semibold mb-4">Studios favoris</h2>
            <div className="flex flex-wrap gap-2">
              {topStudios.map(([studio, count], i) => (
                <motion.span
                  key={studio}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.05 }}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-sm text-foreground"
                >
                  {studio}
                  <span className="ml-1.5 text-muted-foreground">({count})</span>
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {stats.total === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">Pas encore de statistiques</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Commencez à ajouter des animes pour voir apparaître vos statistiques.
            </p>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default StatsPage;