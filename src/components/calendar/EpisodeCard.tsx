import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Bell, Check, Play, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { type ScheduleAnime } from '@/services/jikanApi';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useAnimeListStore } from '@/stores/animeListStore';
import { convertJSTToFrance, getCountdown, getNextBroadcastDate } from '@/lib/timeUtils';
import { toast } from 'sonner';

interface EpisodeCardProps {
  anime: ScheduleAnime & { hasVF?: boolean };
  isVF: boolean;
  selectedDay: string;
  index?: number;
}

export const EpisodeCard = ({ anime, isVF, selectedDay, index = 0 }: EpisodeCardProps) => {
  const [countdown, setCountdown] = useState({ label: '', isNear: false, isPast: false });
  
  const { hasReminder, addReminder, removeReminder, isEpisodeWatched, markEpisodeWatched, unmarkEpisodeWatched } = useUserPreferencesStore();
  const { isInList, addToList, getItemById, updateProgress } = useAnimeListStore();

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
      if (!anime.broadcast?.day || !anime.broadcast?.time) {
        setCountdown({ label: '', isNear: false, isPast: true });
        return;
      }
      
      const { time: frTime } = convertJSTToFrance(anime.broadcast.time);
      const broadcastDate = getNextBroadcastDate(anime.broadcast.day, frTime);
      const cd = getCountdown(broadcastDate);
      setCountdown(cd);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [anime.broadcast?.day, anime.broadcast?.time]);

  const handleToggleReminder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (reminderActive) {
      removeReminder(anime.mal_id, currentEpisode);
      toast.success('Rappel désactivé');
    } else {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            scheduleReminder();
          } else {
            toast.error('Autorisez les notifications pour les rappels');
          }
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        scheduleReminder();
      } else {
        // Fallback: just save the reminder locally
        scheduleReminder();
      }
    }
  };

  const scheduleReminder = () => {
    addReminder({
      animeId: anime.mal_id,
      animeTitle: anime.title_english || anime.title,
      episodeNumber: currentEpisode,
      reminderTiming: '30min',
      isVF,
    });
    toast.success('Rappel activé (30 min avant)');
    
    // Try to schedule actual notification
    if ('Notification' in window && Notification.permission === 'granted') {
      // Calculate time until 30 min before broadcast
      if (anime.broadcast?.day && anime.broadcast?.time) {
        const { time: frTime } = convertJSTToFrance(anime.broadcast.time);
        const broadcastDate = getNextBroadcastDate(anime.broadcast.day, frTime);
        const reminderTime = broadcastDate.getTime() - 30 * 60 * 1000; // 30 min before
        const now = Date.now();
        
        if (reminderTime > now) {
          const delay = reminderTime - now;
          setTimeout(() => {
            new Notification(`📺 ${anime.title_english || anime.title}`, {
              body: `Épisode ${currentEpisode} dans 30 minutes !`,
              icon: anime.images.webp?.image_url || anime.images.jpg?.image_url,
              tag: `anime-${anime.mal_id}-${currentEpisode}`,
            });
          }, delay);
        }
      }
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
      if (listItem) {
        updateProgress(anime.mal_id, currentEpisode);
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Link
        to={`/anime/${anime.mal_id}`}
        className={`flex gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-card border transition-all active:scale-[0.99] hover:bg-card-hover ${
          countdown.isNear 
            ? 'border-primary/50 bg-primary/5' 
            : 'border-border/30 hover:border-border'
        }`}
      >
        {/* Poster with subtle hover effect */}
        <div className="relative w-14 sm:w-16 h-[72px] sm:h-20 flex-shrink-0 group">
          <motion.img
            src={anime.images.webp?.image_url || anime.images.jpg?.image_url}
            alt={anime.title}
            className="w-full h-full object-cover rounded-lg"
            loading="lazy"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
          />
          
          {/* VF/VOSTFR Badge */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`absolute -top-1 -left-1 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase rounded ${
              isVF 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted-foreground/80 text-white'
            }`}
          >
            {isVF ? 'VF' : 'VOSTFR'}
          </motion.div>
          
          {/* Score badge */}
          {anime.score && (
            <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/80 text-rating-gold text-[9px] font-medium">
              <Star className="w-2 h-2 fill-current" />
              {anime.score.toFixed(1)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          {/* Title & Episode */}
          <div>
            <h3 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-2 leading-tight">
              {anime.title_english || anime.title}
            </h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              Épisode {currentEpisode}
              {anime.episodes && ` / ${anime.episodes}`}
            </p>
          </div>

          {/* Time & Countdown */}
          <div className="flex items-center justify-between mt-1.5 sm:mt-2 gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* French Time */}
              <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-foreground">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                <span>{frenchTime}</span>
                <span className="text-[9px] text-muted-foreground hidden sm:inline">({offset})</span>
              </div>
              
              {/* Countdown badge */}
              {countdown.label && !countdown.isPast && (
                <motion.span 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold rounded-full ${
                    countdown.isNear
                      ? 'bg-primary text-primary-foreground animate-pulse-subtle'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {countdown.label}
                </motion.span>
              )}
              
              {countdown.isPast && (
                <motion.span 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold rounded-full bg-status-completed/20 text-status-completed"
                >
                  Dispo
                </motion.span>
              )}
            </div>

            {/* Quick Actions - Touch optimized */}
            <div className="flex items-center gap-1">
              {/* Reminder button */}
              <motion.button
                onClick={handleToggleReminder}
                whileTap={{ scale: 0.9 }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors ${
                  reminderActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground active:bg-secondary/80'
                }`}
                title={reminderActive ? 'Désactiver le rappel' : 'Activer un rappel'}
                aria-label={reminderActive ? 'Désactiver le rappel' : 'Activer un rappel'}
              >
                <Bell className={`w-3.5 h-3.5 ${reminderActive ? 'fill-current' : ''}`} />
              </motion.button>

              {/* Mark as watched button */}
              <motion.button
                onClick={handleToggleWatched}
                whileTap={{ scale: 0.9 }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors ${
                  episodeWatched
                    ? 'bg-status-completed text-white'
                    : 'bg-secondary text-muted-foreground active:bg-secondary/80'
                }`}
                title={episodeWatched ? 'Marquer non vu' : 'Marquer comme vu'}
                aria-label={episodeWatched ? 'Marquer non vu' : 'Marquer comme vu'}
              >
                <Check className={`w-3.5 h-3.5 ${episodeWatched ? 'stroke-[3]' : ''}`} />
              </motion.button>

              {/* Add to list (if not in list) */}
              {!isInList(anime.mal_id) && (
                <motion.button
                  onClick={handleQuickAdd}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center active:bg-primary active:text-primary-foreground transition-colors"
                  title="Ajouter à ma liste"
                  aria-label="Ajouter à ma liste"
                >
                  <Play className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};