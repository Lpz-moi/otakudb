import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Bell, BellOff, Check, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { getSchedule, type ScheduleAnime } from '@/services/jikanApi';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { convertJSTToFrance, getCountdown, getShortDayName, getNextBroadcastDate } from '@/lib/timeUtils';
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

// Simulated VF data (in real app, this would come from an API)
const VF_ANIME_IDS = new Set([52991, 54112, 53887, 52034, 55644]); // Example IDs

export const CalendarSchedule = () => {
  const [schedule, setSchedule] = useState<ScheduleAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date().getDay();
    // Convert Sunday = 0 to index 6, Monday = 1 to index 0, etc.
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
        setSchedule(response.data || []);
      } catch (error) {
        console.error('Error fetching schedule:', error);
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [selectedDay.key]);

  // Filter schedule based on version preference
  const filteredSchedule = useMemo(() => {
    if (versionPreference === 'all') return schedule;
    
    return schedule.filter((anime) => {
      const hasVF = VF_ANIME_IDS.has(anime.mal_id);
      if (versionPreference === 'vf') return hasVF;
      if (versionPreference === 'vostfr') return !hasVF;
      return true;
    });
  }, [schedule, versionPreference]);

  // Count VF/VOSTFR per day
  const dayStats = useMemo(() => {
    const vfCount = schedule.filter((a) => VF_ANIME_IDS.has(a.mal_id)).length;
    const vostfrCount = schedule.length - vfCount;
    return { vf: vfCount, vostfr: vostfrCount, total: schedule.length };
  }, [schedule]);

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
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-display font-bold">Calendrier</h2>
        </div>
        
        {/* Version Filter */}
        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
          <button
            onClick={() => setVersionPreference('all')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              versionPreference === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tout
          </button>
          <button
            onClick={() => setVersionPreference('vf')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              versionPreference === 'vf'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            VF
          </button>
          <button
            onClick={() => setVersionPreference('vostfr')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              versionPreference === 'vostfr'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            VOSTFR
          </button>
        </div>
      </div>

      {/* Day Selector - Premium style */}
      <div className="relative">
        {/* Navigation arrows */}
        <button
          onClick={() => navigateDay('prev')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors touch-target"
          aria-label="Jour précédent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => navigateDay('next')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors touch-target"
          aria-label="Jour suivant"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Days scroll */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 px-8 scrollbar-hide">
          {DAYS.map((day, index) => {
            const isActive = index === selectedDayIndex;
            const isDayToday = index === todayIndex;
            
            return (
              <button
                key={day.key}
                onClick={() => setSelectedDayIndex(index)}
                className={`relative flex flex-col items-center min-w-[52px] px-3 py-2.5 rounded-xl transition-all touch-target ${
                  isActive
                    ? 'bg-primary text-primary-foreground scale-105 shadow-glow'
                    : isDayToday
                    ? 'bg-primary/20 text-primary'
                    : 'bg-card text-muted-foreground hover:bg-card-hover'
                }`}
              >
                <span className="text-xs font-medium">{day.label}</span>
                {isDayToday && !isActive && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
                {/* VF/VOSTFR indicators would go here when data is loaded */}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current day label */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-foreground">
            {selectedDay.fullLabel}
          </span>
          {isToday && (
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-primary/20 text-primary rounded-full">
              Aujourd'hui
            </span>
          )}
          {isTomorrow && (
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded-full">
              Demain
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {dayStats.total > 0 && (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {dayStats.vf} VF
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                {dayStats.vostfr} VOSTFR
              </span>
            </>
          )}
        </div>
      </div>

      {/* Schedule List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-xl bg-card animate-pulse">
              <div className="w-16 h-20 skeleton rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton w-3/4 rounded" />
                <div className="h-3 skeleton w-1/2 rounded" />
                <div className="h-6 skeleton w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredSchedule.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">
            {versionPreference === 'vf' 
              ? 'Aucun anime VF prévu ce jour.'
              : 'Aucun anime prévu ce jour.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSchedule.map((anime) => (
            <EpisodeCard
              key={anime.mal_id}
              anime={anime}
              isVF={VF_ANIME_IDS.has(anime.mal_id)}
              selectedDay={selectedDay.key}
            />
          ))}
        </div>
      )}

      {/* Info footer */}
      <p className="text-[10px] text-muted-foreground/60 text-center pt-2">
        Horaires affichés en heure française • Données via Jikan API
      </p>
    </section>
  );
};
