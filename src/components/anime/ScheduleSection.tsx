import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { getSchedule, type ScheduleAnime } from '@/services/jikanApi';

const DAYS = [
  { key: 'monday', label: 'Lun' },
  { key: 'tuesday', label: 'Mar' },
  { key: 'wednesday', label: 'Mer' },
  { key: 'thursday', label: 'Jeu' },
  { key: 'friday', label: 'Ven' },
  { key: 'saturday', label: 'Sam' },
  { key: 'sunday', label: 'Dim' },
];

const getCurrentDayKey = () => {
  const dayIndex = new Date().getDay();
  // getDay() returns 0 for Sunday, 1 for Monday, etc.
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayIndex];
};

export const ScheduleSection = () => {
  const [selectedDay, setSelectedDay] = useState(getCurrentDayKey());
  const [schedule, setSchedule] = useState<ScheduleAnime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const res = await getSchedule(selectedDay);
        setSchedule(res.data.slice(0, 8));
      } catch (err) {
        console.error('Failed to fetch schedule:', err);
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [selectedDay]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title flex items-center gap-2 mb-0">
          <Calendar className="w-5 h-5 text-primary" />
          Calendrier
        </h2>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {DAYS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedDay(key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedDay === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Schedule List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-xl bg-card">
              <div className="w-16 h-20 skeleton rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton w-3/4 rounded" />
                <div className="h-3 skeleton w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : schedule.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Aucun anime prévu ce jour.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {schedule.map((anime) => (
            <Link
              key={anime.mal_id}
              to={`/anime/${anime.mal_id}`}
              className="flex gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-border transition-colors group"
            >
              <img
                src={anime.images.webp?.image_url || anime.images.jpg?.image_url}
                alt={anime.title}
                className="w-16 h-20 object-cover rounded-lg flex-shrink-0"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {anime.title_english || anime.title}
                </h3>
                {anime.broadcast?.time && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{anime.broadcast.time} (JST)</span>
                  </div>
                )}
                {anime.episodes && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {anime.episodes} épisodes
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};