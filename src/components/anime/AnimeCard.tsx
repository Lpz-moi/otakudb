import { Link } from 'react-router-dom';
import { Play, Plus, Check, Heart } from 'lucide-react';
import type { Anime } from '@/services/jikanApi';
import { useAnimeListStore } from '@/stores/animeListStore';

interface AnimeCardProps {
  anime: Anime;
  showQuickAdd?: boolean;
  showProgress?: boolean;
  className?: string;
}

export const AnimeCard = ({ anime, showQuickAdd = true, showProgress = false, className = '' }: AnimeCardProps) => {
  const { isInList, isFavorite, addToList, toggleFavorite, getItemById } = useAnimeListStore();
  const inList = isInList(anime.mal_id);
  const favorite = isFavorite(anime.mal_id);
  const listItem = getItemById(anime.mal_id);

  const getScoreClass = (score: number | null) => {
    if (!score) return '';
    if (score >= 8) return 'high';
    if (score >= 6) return 'medium';
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
    <Link
      to={`/anime/${anime.mal_id}`}
      className={`anime-card group block active:scale-[0.98] transition-transform ${className}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl sm:rounded-t-2xl">
        <img
          src={anime.images.webp?.large_image_url || anime.images.jpg?.large_image_url}
          alt={anime.title}
          className="anime-card-image transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
        
        {/* Top Row: Score + Favorite */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 flex items-start justify-between">
          {/* Score Badge */}
          {anime.score ? (
            <div className={`score-badge ${getScoreClass(anime.score)}`}>
              <span className="text-[10px] sm:text-xs">{anime.score.toFixed(1)}</span>
            </div>
          ) : (
            <div />
          )}
          
          {/* Favorite Button - Touch friendly */}
          <button
            onClick={handleToggleFavorite}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-colors touch-target ${
              favorite
                ? 'bg-primary text-primary-foreground'
                : 'bg-black/40 text-white/70 hover:bg-black/60 active:bg-black/80'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${favorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom Row: Episode count + Add button */}
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 flex items-end justify-between">
          {/* Episode count */}
          <div className="space-y-2">
            {anime.episodes && (
              <span className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium">
                {anime.episodes} éps
              </span>
            )}
          </div>

          {showQuickAdd && !inList && (
            <button
              onClick={handleQuickAdd}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-target"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {/* Status indicator if in list */}
          {listItem && listItem.status !== 'favorites' && (
            <div className={`status-badge status-${listItem.status} text-[10px] sm:text-xs`}>
              {listItem.status === 'watching' && <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
              {listItem.status === 'completed' && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
              {listItem.status === 'planned' && <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
        <h3 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {anime.title_english || anime.title}
        </h3>
        
        {/* Genres */}
        {anime.genres && anime.genres.length > 0 && (
          <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
            {anime.genres.slice(0, 2).map(g => g.name).join(' • ')}
          </p>
        )}

        {/* Progress bar for watching items */}
        {showProgress && listItem && totalEpisodes > 0 && (
          <div className="pt-1.5 sm:pt-2 space-y-1">
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Ép. {progress}/{totalEpisodes}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
};
