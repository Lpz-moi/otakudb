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
      className={`anime-card group block ${className}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-2xl">
        <img
          src={anime.images.webp?.large_image_url || anime.images.jpg?.large_image_url}
          alt={anime.title}
          className="anime-card-image transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
        
        {/* Top Row: Score + Favorite */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {/* Score Badge */}
          {anime.score ? (
            <div className={`score-badge ${getScoreClass(anime.score)}`}>
              <span>{anime.score.toFixed(1)}</span>
            </div>
          ) : (
            <div />
          )}
          
          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              favorite
                ? 'bg-primary text-primary-foreground'
                : 'bg-black/40 text-white/70 hover:bg-black/60'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom Row: Episode count + Add button */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          {/* Episode count */}
          <div className="space-y-2">
            {anime.episodes && (
              <span className="inline-block px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                {anime.episodes} éps
              </span>
            )}
          </div>

          {showQuickAdd && !inList && (
            <button
              onClick={handleQuickAdd}
              className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {/* Status indicator if in list */}
          {listItem && listItem.status !== 'favorites' && (
            <div className={`status-badge status-${listItem.status}`}>
              {listItem.status === 'watching' && <Play className="w-3 h-3" />}
              {listItem.status === 'completed' && <Check className="w-3 h-3" />}
              {listItem.status === 'planned' && <Plus className="w-3 h-3" />}
            </div>
          )}
        </div>
      </div>

      {/* Info Section - More padding and breathing room */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {anime.title_english || anime.title}
        </h3>
        
        {/* Genres - Subtle styling */}
        {anime.genres && anime.genres.length > 0 && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {anime.genres.slice(0, 2).map(g => g.name).join(' • ')}
          </p>
        )}

        {/* Progress bar for watching items */}
        {showProgress && listItem && totalEpisodes > 0 && (
          <div className="pt-2 space-y-1.5">
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ép. {progress}/{totalEpisodes}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
};
