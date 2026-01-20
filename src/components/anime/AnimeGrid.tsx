import type { Anime } from '@/services/jikanApi';
import { AnimeCard } from './AnimeCard';

interface AnimeGridProps {
  animes: Anime[];
  loading?: boolean;
  emptyMessage?: string;
}

export const AnimeGrid = ({ animes, loading, emptyMessage = 'Aucun anime trouvé' }: AnimeGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="aspect-[3/4] skeleton rounded-2xl" />
            <div className="p-4 space-y-3">
              <div className="h-4 skeleton w-4/5" />
              <div className="h-3 skeleton w-3/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (animes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {animes.map((anime) => (
        <AnimeCard key={anime.mal_id} anime={anime} />
      ))}
    </div>
  );
};
