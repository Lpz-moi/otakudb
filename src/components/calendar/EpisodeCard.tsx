import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Bell, BellOff, Check, Play, Star } from 'lucide-react';
import { type ScheduleAnime } from '@/services/jikanApi';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useAnimeListStore } from '@/stores/animeListStore';
import { convertJSTToFrance, getCountdown, getNextBroadcastDate } from '@/lib/timeUtils';
import { toast } from 'sonner';

interface EpisodeCardProps {
  anime: ScheduleAnime;
  isVF: boolean;
  selectedDay: string;
}

export const EpisodeCard = ({ anime, isVF, selectedDay }: EpisodeCardProps) => {
  const [countdown, setCountdown] = useState({ label: '', isNear: false, isPast: false });
  
  const { hasReminder, addReminder, removeReminder, isEpisodeWatched, markEpisodeWatched, unmarkEpisodeWatched } = useUserPreferencesStore();
  const { isInList, addToList, getItemById } = useAnimeListStore();

  const listItem = getItemById(anime.mal_id);
  const currentEpisode = listItem ? listItem.progress + 1 : 1;
  const reminderActive = hasReminder(anime.mal_id, currentEpisode);
  const episodeWatched = isEpisodeWatched(anime.mal_id, currentEpisode);

  // Get French time
  const jstTime = anime.broadcast?.time || '00:00';
  const { time: frenchTime, offset } = convertJSTToFrance(jstTime);

  // Calculate countdown
  useEffect(() => {
    const updateCountdown = () => {
      if (!anime.broadcast?.day || !anime.broadcast?.time) return;
      
      const { time: frTime } = convertJSTToFrance(anime.broadcast.time);
      const broadcastDate = getNextBroadcastDate(anime.broadcast.day, frTime);
      const cd = getCountdown(broadcastDate);
      setCountdown(cd);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [anime.broadcast?.day, anime.broadcast?.time]);

  const handleToggleReminder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (reminderActive) {
      removeReminder(anime.mal_id, currentEpisode);
      toast.success('Rappel désactivé');
    } else {
      addReminder({
        animeId: anime.mal_id,
        animeTitle: anime.title,
        episodeNumber: currentEpisode,
        reminderTiming: '30min',
        isVF,
      });
      toast.success('Rappel activé pour 30min avant');
    }
  };

  const handleToggleWatched = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (episodeWatched) {
      unmarkEpisodeWatched(anime.mal_id, currentEpisode);
      toast.success('Épisode non marqué');
    } else {
      markEpisodeWatched(anime.mal_id, currentEpisode);
      // Also update progress in anime list if in list
      if (listItem) {
        useAnimeListStore.getState().updateProgress(anime.mal_id, currentEpisode);
      }
      toast.success('Épisode marqué comme vu');
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isInList(anime.mal_id)) {
      addToList(anime, 'watching');
      toast.success('Ajouté à "En cours"');
    }
  };

  return (
    <Link
      to={`/anime/${anime.mal_id}`}
      className={`flex gap-3 p-3 rounded-xl bg-card border transition-all active:scale-[0.99] ${
        countdown.isNear 
          ? 'border-primary/50 bg-primary/5' 
          : 'border-border/50 hover:border-border'
      }`}
    >
      {/* Poster */}
      <div className="relative w-16 h-22 flex-shrink-0">
        <img
          src={anime.images.webp?.image_url || anime.images.jpg?.image_url}
          alt={anime.title}
          className="w-full h-full object-cover rounded-lg"
          loading="lazy"
        />
        
        {/* VF/VOSTFR Badge */}
        <div 
          className={`absolute -top-1 -left-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
            isVF 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {isVF ? 'VF' : 'VOSTFR'}
        </div>
        
        {/* Score badge */}
        {anime.score && (
          <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/80 text-rating-gold text-[10px] font-medium">
            <Star className="w-2.5 h-2.5 fill-current" />
            {anime.score.toFixed(1)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        {/* Title & Episode */}
        <div>
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight">
            {anime.title_english || anime.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Épisode {currentEpisode}
            {anime.episodes && ` / ${anime.episodes}`}
          </p>
        </div>

        {/* Time & Countdown */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {/* French Time */}
            <div className="flex items-center gap-1 text-sm font-medium text-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{frenchTime}</span>
            </div>
            
            {/* Countdown badge */}
            {!countdown.isPast && (
              <span 
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                  countdown.isNear
                    ? 'bg-primary text-primary-foreground animate-pulse'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {countdown.label}
              </span>
            )}
            
            {countdown.isPast && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-rating-green/20 text-rating-green">
                Disponible
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            {/* Reminder button */}
            <button
              onClick={handleToggleReminder}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors touch-target ${
                reminderActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
              title={reminderActive ? 'Désactiver le rappel' : 'Activer un rappel'}
            >
              {reminderActive ? (
                <Bell className="w-4 h-4 fill-current" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>

            {/* Mark as watched button */}
            <button
              onClick={handleToggleWatched}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors touch-target ${
                episodeWatched
                  ? 'bg-rating-green text-white'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
              title={episodeWatched ? 'Marquer non vu' : 'Marquer comme vu'}
            >
              <Check className={`w-4 h-4 ${episodeWatched ? 'stroke-[3]' : ''}`} />
            </button>

            {/* Add to list (if not in list) */}
            {!isInList(anime.mal_id) && (
              <button
                onClick={handleQuickAdd}
                className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors touch-target"
                title="Ajouter à ma liste"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
