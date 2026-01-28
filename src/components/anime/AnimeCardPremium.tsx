import { Link } from 'react-router-dom';
import { Play, Plus, Check, Heart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Anime } from '@/services/jikanApi';
import { useAnimeListStore } from '@/stores/animeListStore';

interface AnimeCardPremiumProps {
  anime: Anime;
  showQuickAdd?: boolean;
  showProgress?: boolean;
  className?: string;
  index?: number;
}

export const AnimeCardPremium = ({ 
  anime, 
  showQuickAdd = true, 
  showProgress = false, 
  className = '',
  index = 0
}: AnimeCardPremiumProps) => {
  const { isInList, isFavorite, addToList, toggleFavorite, getItemById } = useAnimeListStore();
  const inList = isInList(anime.mal_id);
  const favorite = isFavorite(anime.mal_id);
  const listItem = getItemById(anime.mal_id);

  const getScoreClass = (score: number | null) => {
    if (!score) return '';
    if (score >= 8) return 'high';
    if (score >= 6.5) return 'medium';
    return 'low';
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inList) {
      addToList(anime, 'planned');
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(anime);
  };

  const progress = listItem?.progress || 0;
  const totalEpisodes = anime.episodes || 0;
  const progressPercent = totalEpisodes > 0 ? (progress / totalEpisodes) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.25, 
        delay: index * 0.03,
        ease: 'easeOut'
      }}
    >
      <Link
        to={`/anime/${anime.mal_id}`}
        className={`group block relative overflow-hidden rounded-xl bg-card border border-border/30 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98] ${className}`}
      >
        {/* Image Container with 3D hover effect */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl">
          <motion.img
            src={anime.images.webp?.large_image_url || anime.images.jpg?.large_image_url}
            alt={anime.title}
            className="w-full h-full object-cover"
            loading="lazy"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          />
          
          {/* Gradient Overlay - Subtle on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/20 group-hover:from-black/70 transition-all duration-300" />
          
          {/* Top Row: Score + Favorite */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
            {/* Score Badge with icon */}
            {anime.score ? (
              <motion.div 
                className={`score-badge ${getScoreClass(anime.score)} flex items-center gap-1`}
                whileHover={{ scale: 1.05 }}
              >
                <Star className="w-2.5 h-2.5 fill-current" />
                <span className="text-[10px] font-bold">{anime.score.toFixed(1)}</span>
              </motion.div>
            ) : (
              <div />
            )}
            
            {/* Favorite Button with animation */}
            <motion.button
              onClick={handleToggleFavorite}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors touch-target ${
                favorite
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-black/40 backdrop-blur-sm text-white/80 hover:bg-black/60'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${favorite ? 'fill-current' : ''}`} />
            </motion.button>
          </div>

          {/* Bottom Row: Episode count + Add button */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
            {/* Episode count */}
            <div className="space-y-1.5">
              {anime.episodes && (
                <span className="inline-block px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
                  {anime.episodes} épisodes
                </span>
              )}
            </div>

            {showQuickAdd && !inList && (
              <motion.button
                onClick={handleQuickAdd}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
                className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity touch-target"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            )}

            {/* Status indicator if in list */}
            {listItem && listItem.status !== 'favorites' && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`status-badge status-${listItem.status} text-[10px]`}
              >
                {listItem.status === 'watching' && <Play className="w-2.5 h-2.5" />}
                {listItem.status === 'completed' && <Check className="w-2.5 h-2.5" />}
                {listItem.status === 'planned' && <Plus className="w-2.5 h-2.5" />}
              </motion.div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-2.5 space-y-1.5">
          <h3 className="font-semibold text-xs text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {anime.title_english || anime.title}
          </h3>
          
          {/* Genres */}
          {anime.genres && anime.genres.length > 0 && (
            <p className="text-[10px] text-muted-foreground line-clamp-1">
              {anime.genres.slice(0, 2).map(g => g.name).join(' • ')}
            </p>
          )}

          {/* Progress bar for watching items */}
          {showProgress && listItem && totalEpisodes > 0 && (
            <div className="pt-1.5 space-y-1">
              <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Ép. {progress}/{totalEpisodes}
              </p>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};
