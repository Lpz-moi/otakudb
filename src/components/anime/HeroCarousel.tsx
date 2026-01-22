import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Plus, Star } from 'lucide-react';
import type { Anime } from '@/services/jikanApi';
import { useAnimeListStore } from '@/stores/animeListStore';

interface HeroCarouselProps {
  animes: Anime[];
  loading?: boolean;
}

export const HeroCarousel = ({ animes, loading }: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { addToList, isInList } = useAnimeListStore();

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % animes.length);
  }, [animes.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + animes.length) % animes.length);
  }, [animes.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  useEffect(() => {
    if (!isAutoPlaying || animes.length === 0) return;
    const interval = setInterval(goToNext, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, animes.length, goToNext]);

  if (loading) {
    return (
      <div className="relative h-[280px] sm:h-[320px] md:h-[400px] lg:h-[480px] bg-card rounded-xl sm:rounded-2xl overflow-hidden">
        <div className="absolute inset-0 skeleton" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 space-y-3">
          <div className="h-6 sm:h-8 w-3/4 skeleton rounded" />
          <div className="h-4 w-1/2 skeleton rounded" />
          <div className="h-10 w-32 skeleton rounded" />
        </div>
      </div>
    );
  }

  if (animes.length === 0) return null;

  const currentAnime = animes[currentIndex];
  const inList = isInList(currentAnime.mal_id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inList) {
      addToList(currentAnime, 'planned');
    }
  };

  return (
    <div 
      className="relative h-[280px] sm:h-[320px] md:h-[400px] lg:h-[480px] rounded-xl sm:rounded-2xl overflow-hidden group"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={currentAnime.images.webp?.large_image_url || currentAnime.images.jpg?.large_image_url}
          alt=""
          className="w-full h-full object-cover transition-transform duration-700"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40 md:via-background/80 md:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="max-w-xl space-y-2 sm:space-y-3 md:space-y-4">
          {/* Meta */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {currentAnime.score && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded bg-rating-gold/20 text-rating-gold text-xs sm:text-sm font-medium">
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                {currentAnime.score.toFixed(1)}
              </span>
            )}
            {/* VF/VOSTFR Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded bg-primary/20 text-primary text-xs sm:text-sm font-medium">
              VOSTFR
            </span>
            {currentAnime.episodes && (
              <span className="text-xs sm:text-sm text-muted-foreground">
                {currentAnime.episodes} éps
              </span>
            )}
            <div className="hidden sm:flex items-center gap-2">
              {currentAnime.genres?.slice(0, 2).map((genre) => (
                <span 
                  key={genre.mal_id} 
                  className="text-sm text-muted-foreground"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground leading-tight line-clamp-2">
            {currentAnime.title_english || currentAnime.title}
          </h2>

          {/* Synopsis - Hidden on very small screens */}
          {currentAnime.synopsis && (
            <p className="hidden sm:block text-sm md:text-base text-muted-foreground line-clamp-2 md:line-clamp-3">
              {currentAnime.synopsis}
            </p>
          )}

          {/* Actions - Touch friendly */}
          <div className="flex items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
            <Link 
              to={`/anime/${currentAnime.mal_id}`}
              className="btn-primary inline-flex items-center gap-2 text-sm sm:text-base touch-target"
            >
              <Play className="w-4 h-4" />
              <span>Détails</span>
            </Link>
            {!inList && (
              <button 
                onClick={handleQuickAdd}
                className="btn-secondary inline-flex items-center gap-2 text-sm sm:text-base touch-target"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Hidden on mobile, shown on desktop */}
      <button
        onClick={goToPrev}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 hidden md:flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background touch-target"
        aria-label="Précédent"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 hidden md:flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background touch-target"
        aria-label="Suivant"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots - Compact */}
      <div className="absolute bottom-3 sm:bottom-4 right-4 sm:right-6 md:right-8 flex items-center gap-1">
        {animes.slice(0, 5).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-primary w-4'
                : 'bg-foreground/30 hover:bg-foreground/50 w-1.5'
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};