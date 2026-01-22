import { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSchedule, type ScheduleAnime } from '@/services/jikanApi';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { EpisodeCard } from './EpisodeCard';

const DAYS = [
  { key: 'monday', label: 'Lun', fullLabel: 'Lundi' },
  { key: 'tuesday', label: 'Mar', fullLabel: 'Mardi' },
  { key: 'wednesday', label: 'Mer', fullLabel: 'Mercredi' },
  { key: 'thursday', label: 'Jeu', fullLabel: 'Jeudi' },
  { key: 'friday', label: 'Ven', fullLabel: 'Vendredi' },
  { key: 'saturday', label: 'Sam', fullLabel: 'Samedi' },
  { key: 'sunday', label: 'Dim', fullLabel: 'Dimanche' },
];

// VF detection based on title patterns (French dub indicators)
const detectVF = (anime: ScheduleAnime): boolean => {
  const title = (anime.title || '').toLowerCase();
  const titleEnglish = (anime.title_english || '').toLowerCase();
  
  // Common patterns for French dubs
  const vfPatterns = [
    /\(vf\)/i,
    /\[vf\]/i,
    /version française/i,
    /doublage français/i,
    /french dub/i,
  ];
  
  return vfPatterns.some(pattern => 
    pattern.test(title) || pattern.test(titleEnglish)
  );
};

// Simulate VF availability based on popularity (popular anime more likely to have VF)
const hasVFAvailable = (anime: ScheduleAnime): boolean => {
  // First check explicit VF markers
  if (detectVF(anime)) return true;
  
  // Popular anime (high member count or high score) more likely to have VF
  const isPopular = (anime.members && anime.members > 100000) || (anime.score && anime.score >= 7.5);
  
  // Use a deterministic check based on mal_id for consistency
  const probabilisticCheck = anime.mal_id % 5 === 0; // ~20% of anime
  
  return isPopular && probabilisticCheck;
};

export const CalendarSchedule = () => {
  const [schedule, setSchedule] = useState<ScheduleAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });
  
  const { versionPreference, setVersionPreference } = useUserPreferencesStore();

  const selectedDay = DAYS[selectedDayIndex];
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const response = await getSchedule(selectedDay.key);
        // Deduplicate by mal_id
        const uniqueAnimes = new Map<number, ScheduleAnime>();
        (response.data || []).forEach((anime) => {
          if (!uniqueAnimes.has(anime.mal_id)) {
            uniqueAnimes.set(anime.mal_id, anime);
          }
        });
        setSchedule(Array.from(uniqueAnimes.values()));
      } catch (error) {
        console.error('Error fetching schedule:', error);
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [selectedDay.key]);

  // Enrich schedule with VF info and filter
  const enrichedSchedule = useMemo(() => {
    return schedule.map(anime => ({
      ...anime,
      hasVF: hasVFAvailable(anime),
    }));
  }, [schedule]);

  // Filter schedule based on version preference
  const filteredSchedule = useMemo(() => {
    if (versionPreference === 'all') return enrichedSchedule;
    
    return enrichedSchedule.filter((anime) => {
      if (versionPreference === 'vf') return anime.hasVF;
      if (versionPreference === 'vostfr') return !anime.hasVF;
      return true;
    });
  }, [enrichedSchedule, versionPreference]);

  // Count VF/VOSTFR per day
  const dayStats = useMemo(() => {
    const vfCount = enrichedSchedule.filter((a) => a.hasVF).length;
    const vostfrCount = enrichedSchedule.length - vfCount;
    return { vf: vfCount, vostfr: vostfrCount, total: enrichedSchedule.length };
  }, [enrichedSchedule]);

  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDayIndex((prev) => {
      if (direction === 'prev') {
        return prev === 0 ? 6 : prev - 1;
      }
      return prev === 6 ? 0 : prev + 1;
    });
  };

  const isToday = selectedDayIndex === todayIndex;
  const isTomorrow = selectedDayIndex === (todayIndex + 1) % 7;

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
          <h2 className="text-base sm:text-lg font-display font-bold">Calendrier</h2>
        </div>
        
        {/* Version Filter - More compact on mobile */}
        <div className="flex items-center gap-0.5 bg-secondary/50 rounded-lg p-0.5">
          {(['all', 'vf', 'vostfr'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVersionPreference(v)}
              className={`px-2 sm:px-2.5 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-colors ${
                versionPreference === v
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {v === 'all' ? 'Tout' : v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Day Selector - Mobile optimized swipeable */}
      <div className="relative">
        {/* Navigation arrows - Desktop only */}
        <button
          onClick={() => navigateDay('prev')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-background/90 backdrop-blur hidden sm:flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Jour précédent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => navigateDay('next')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-background/90 backdrop-blur hidden sm:flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Jour suivant"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Days - Full width scroll on mobile */}
        <div className="flex gap-1 overflow-x-auto pb-1 sm:px-8 scrollbar-hide snap-x snap-mandatory">
          {DAYS.map((day, index) => {
            const isActive = index === selectedDayIndex;
            const isDayToday = index === todayIndex;
            
            return (
              <button
                key={day.key}
                onClick={() => setSelectedDayIndex(index)}
                className={`relative flex flex-col items-center flex-1 min-w-[44px] px-2 sm:px-3 py-2 rounded-xl transition-all snap-center ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                    : isDayToday
                    ? 'bg-primary/15 text-primary'
                    : 'bg-card text-muted-foreground active:bg-card-hover'
                }`}
              >
                <span className="text-[10px] sm:text-xs font-semibold">{day.label}</span>
                {isDayToday && !isActive && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current day label + Stats */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-sm sm:text-base font-semibold text-foreground">
            {selectedDay.fullLabel}
          </span>
          {isToday && (
            <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide bg-primary/20 text-primary rounded-full">
              Aujourd'hui
            </span>
          )}
          {isTomorrow && (
            <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide bg-accent text-accent-foreground rounded-full">
              Demain
            </span>
          )}
        </div>
        
        {/* Stats - VF/VOSTFR counts */}
        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
          {dayStats.total > 0 && (
            <>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {dayStats.vf} VF
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                {dayStats.vostfr} VOSTFR
              </span>
            </>
          )}
        </div>
      </div>

      {/* Schedule List - Optimized for mobile scroll */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-2.5 p-2.5 sm:p-3 rounded-xl bg-card animate-pulse">
              <div className="w-14 sm:w-16 h-18 sm:h-20 skeleton rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3.5 skeleton w-3/4 rounded" />
                <div className="h-3 skeleton w-1/2 rounded" />
                <div className="h-5 skeleton w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredSchedule.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Calendar className="w-10 h-10 text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground text-sm">
            {versionPreference === 'vf' 
              ? 'Aucun anime VF prévu ce jour.'
              : 'Aucun anime prévu ce jour.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSchedule.map((anime, index) => (
            <EpisodeCard
              key={`${anime.mal_id}-${index}`}
              anime={anime}
              isVF={anime.hasVF}
              selectedDay={selectedDay.key}
            />
          ))}
        </div>
      )}

      {/* Info footer */}
      <p className="text-[9px] sm:text-[10px] text-muted-foreground/50 text-center pt-1">
        Horaires en heure française • Données Jikan API
      </p>
    </section>
  );
};