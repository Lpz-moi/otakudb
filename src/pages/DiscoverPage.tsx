import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Heart, X, Star, Play, RotateCcw, Sparkles, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTopAnime, getSeasonalAnime, type Anime } from '@/services/jikanApi';
import { useAnimeListStore } from '@/stores/animeListStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SwipeCardProps {
  anime: Anime;
  onSwipe: (direction: 'left' | 'right') => void;
  isActive: boolean;
  index: number;
}

const SwipeCard = ({ anime, onSwipe, isActive, index }: SwipeCardProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Visual indicators for swipe direction
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      onSwipe('left');
    }
  };

  const scale = isActive ? 1 : 0.95 - index * 0.02;
  const yOffset = isActive ? 0 : index * 8;
  const zIndex = 10 - index;

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{
        x: isActive ? x : 0,
        rotate: isActive ? rotate : 0,
        opacity: isActive ? opacity : 1 - index * 0.15,
        scale,
        y: yOffset,
        zIndex,
      }}
      drag={isActive ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale, opacity: 1 - index * 0.15 }}
      exit={{
        x: x.get() > 0 ? 400 : -400,
        opacity: 0,
        transition: { duration: 0.3 }
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-card border border-border/30 shadow-xl">
        {/* Main Image */}
        <div className="absolute inset-0">
          <img
            src={anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url}
            alt={anime.title}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        {/* Like/Nope Indicators */}
        {isActive && (
          <>
            <motion.div
              className="absolute top-8 left-6 px-6 py-2 rounded-xl border-4 border-green-500 rotate-[-15deg]"
              style={{ opacity: likeOpacity }}
            >
              <span className="text-green-500 text-3xl font-black tracking-wide">LIKE</span>
            </motion.div>
            <motion.div
              className="absolute top-8 right-6 px-6 py-2 rounded-xl border-4 border-red-500 rotate-[15deg]"
              style={{ opacity: nopeOpacity }}
            >
              <span className="text-red-500 text-3xl font-black tracking-wide">NOPE</span>
            </motion.div>
          </>
        )}

        {/* Score Badge */}
        {anime.score && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-white font-bold">{anime.score.toFixed(1)}</span>
          </div>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight line-clamp-2">
            {anime.title_english || anime.title}
          </h2>
          
          {/* Japanese title */}
          {anime.title_japanese && (
            <p className="text-sm text-white/60">{anime.title_japanese}</p>
          )}
          
          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2">
            {anime.episodes && (
              <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full">
                <Play className="w-3 h-3" />
                {anime.episodes} eps
              </span>
            )}
            {anime.year && (
              <span className="bg-white/10 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full">
                {anime.year}
              </span>
            )}
            {anime.status && (
              <span className={`text-sm px-3 py-1 rounded-full ${
                anime.status === 'Currently Airing' 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-white/10 text-white'
              }`}>
                {anime.status === 'Currently Airing' ? 'En cours' : 'Termine'}
              </span>
            )}
          </div>
          
          {/* Genres */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {anime.genres.slice(0, 3).map(genre => (
                <span 
                  key={genre.mal_id}
                  className="bg-primary/20 text-primary text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}
          
          {/* Synopsis preview */}
          {anime.synopsis && (
            <p className="text-white/70 text-sm line-clamp-2 leading-relaxed">
              {anime.synopsis}
            </p>
          )}

          {/* Details link */}
          <Link
            to={`/anime/${anime.mal_id}`}
            className="inline-flex items-center gap-2 text-primary text-sm font-medium mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Info className="w-4 h-4" />
            Voir les details
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default function DiscoverPage() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<{ anime: Anime; direction: 'left' | 'right' }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const { addToList, isInList } = useAnimeListStore();

  // Load animes
  useEffect(() => {
    const loadAnimes = async () => {
      setLoading(true);
      try {
        const [topRes, seasonalRes] = await Promise.all([
          getTopAnime(1, 'bypopularity'),
          getSeasonalAnime(),
        ]);
        
        // Combine and shuffle
        const combined = [...(seasonalRes?.data || []), ...(topRes?.data || [])];
        const uniqueAnimes = combined.filter((anime, index, self) => 
          index === self.findIndex(a => a.mal_id === anime.mal_id)
        );
        
        // Shuffle array
        const shuffled = uniqueAnimes.sort(() => Math.random() - 0.5);
        setAnimes(shuffled);
      } catch (error) {
        console.error('Failed to load animes:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadAnimes();
  }, []);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const currentAnime = animes[currentIndex];
    if (!currentAnime) return;

    // Add to history
    setHistory(prev => [...prev, { anime: currentAnime, direction }]);

    // If swiped right, add to list
    if (direction === 'right') {
      if (!isInList(currentAnime.mal_id)) {
        addToList(currentAnime, 'planned');
        toast.success(`${currentAnime.title_english || currentAnime.title} ajoute a Ma Liste!`);
      } else {
        toast.info('Deja dans votre liste');
      }
    }

    // Move to next card
    setCurrentIndex(prev => prev + 1);
  }, [animes, currentIndex, addToList, isInList]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    
    const lastAction = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentIndex(prev => prev - 1);
    
    toast.info('Action annulee');
  }, [history]);

  const visibleCards = animes.slice(currentIndex, currentIndex + 3);
  const isFinished = currentIndex >= animes.length && !loading;
  const stats = {
    liked: history.filter(h => h.direction === 'right').length,
    passed: history.filter(h => h.direction === 'left').length,
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Chargement des animes...</p>
        </div>
      </div>
    );
  }

  // No more cards
  if (isFinished) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">C'est tout pour le moment!</h2>
            <p className="text-muted-foreground">
              Vous avez parcouru {animes.length} animes.
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 py-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{stats.liked}</div>
              <div className="text-sm text-muted-foreground">Likes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{stats.passed}</div>
              <div className="text-sm text-muted-foreground">Passes</div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link to="/lists">
              <Button className="w-full bg-primary text-primary-foreground">
                Voir Ma Liste
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setCurrentIndex(0);
                setHistory([]);
              }}
            >
              Recommencer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">Decouverte</h1>
          <p className="text-sm text-muted-foreground">
            {animes.length - currentIndex} animes restants
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-green-500 font-medium">{stats.liked} likes</span>
          <span className="text-red-500 font-medium">{stats.passed} passes</span>
        </div>
      </div>

      {/* Card Stack */}
      <div 
        ref={containerRef}
        className="flex-1 relative mx-4 mb-32"
        style={{ minHeight: '500px' }}
      >
        <AnimatePresence mode="popLayout">
          {visibleCards.map((anime, index) => (
            <SwipeCard
              key={anime.mal_id}
              anime={anime}
              onSwipe={handleSwipe}
              isActive={index === 0}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 flex items-center justify-center gap-4 p-4">
        {/* Undo Button */}
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Nope Button */}
        <button
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 rounded-full bg-card border-2 border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500/10 hover:border-red-500 hover:scale-110 transition-all active:scale-95"
        >
          <X className="w-8 h-8" strokeWidth={3} />
        </button>

        {/* Like Button */}
        <button
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center text-primary hover:bg-primary/10 hover:border-primary hover:scale-110 transition-all active:scale-95"
        >
          <Heart className="w-8 h-8" strokeWidth={2.5} />
        </button>

        {/* Details Button */}
        {visibleCards[0] && (
          <Link
            to={`/anime/${visibleCards[0].mal_id}`}
            className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
          >
            <Info className="w-5 h-5" />
          </Link>
        )}
      </div>

      {/* Instructions */}
      <div className="fixed bottom-4 left-0 right-0 text-center md:hidden">
        <p className="text-xs text-muted-foreground">
          Swipez a droite pour aimer, a gauche pour passer
        </p>
      </div>
    </div>
  );
}
