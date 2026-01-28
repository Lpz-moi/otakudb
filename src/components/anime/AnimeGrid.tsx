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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[3/4] skeleton rounded-xl sm:rounded-2xl" />
            <div className="p-2.5 sm:p-3 space-y-2">
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
      <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center">
        <p className="text-muted-foreground text-sm sm:text-base">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
      {animes.map((anime) => (
        <AnimeCard key={anime.mal_id} anime={anime} />
      ))}
    </div>
  );
};
