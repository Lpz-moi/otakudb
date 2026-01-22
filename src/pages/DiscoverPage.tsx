import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { Heart, X, Info, Undo2, Star, Calendar, Play, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTopAnime, getSeasonalAnime, getAnimeByGenre, type Anime } from '@/services/jikanApi';
import { useAnimeListStore } from '@/stores/animeListStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { checkVFAvailability } from '@/services/vfDatabase';
import { toast } from 'sonner';

interface SwipeCard extends Anime {
  matchReason?: string;
  vfAvailable?: boolean;
}

const DiscoverPage = () => {
  const [cards, setCards] = useState<SwipeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<{ card: SwipeCard; action: 'like' | 'skip' }[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [skippedIds, setSkippedIds] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('otakudb-skipped');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const { addToList, isInList, getItemsByStatus } = useAnimeListStore();
  const { versionPreference } = useUserPreferencesStore();

  // Get user's preferred genres based on their list
  const userPreferredGenres = useMemo(() => {
    const allItems = [
      ...getItemsByStatus('watching'),
      ...getItemsByStatus('completed'),
      ...getItemsByStatus('favorites'),
    ];
    
    const genreCount = new Map<string, number>();
    allItems.forEach(item => {
      item.anime.genres?.forEach(genre => {
        genreCount.set(genre.name, (genreCount.get(genre.name) || 0) + 1);
      });
    });
    
    return Array.from(genreCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }, [getItemsByStatus]);

  // Fetch recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        // Fetch from multiple sources
        const [seasonalRes, topRes] = await Promise.all([
          getSeasonalAnime(),
          getTopAnime(1, 'bypopularity'),
        ]);

        const allAnime = [...(seasonalRes.data || []), ...(topRes.data || [])];
        
        // Dedupe and filter
        const seen = new Set<number>();
        const filtered = allAnime.filter(anime => {
          if (seen.has(anime.mal_id)) return false;
          if (isInList(anime.mal_id)) return false;
          if (skippedIds.has(anime.mal_id)) return false;
          seen.add(anime.mal_id);
          return true;
        });

        // Score and sort by relevance
        const scored = filtered.map(anime => {
          let score = 0;
          const reasons: string[] = [];

          // Genre match
          const matchingGenres = anime.genres?.filter(g => 
            userPreferredGenres.includes(g.name)
          ) || [];
          if (matchingGenres.length > 0) {
            score += matchingGenres.length * 20;
            reasons.push(`Genre: ${matchingGenres[0].name}`);
          }

          // Popularity
          if (anime.members && anime.members > 500000) {
            score += 15;
            reasons.push('Très populaire');
          }

          // Score
          if (anime.score && anime.score >= 8) {
            score += 20;
            reasons.push(`Note: ${anime.score.toFixed(1)}`);
          }

          // VF availability
          const vfCheck = checkVFAvailability(anime);
          if (vfCheck.hasVF && versionPreference === 'vf') {
            score += 25;
            reasons.push('Disponible en VF');
          }

          return {
            ...anime,
            _score: score,
            matchReason: reasons[0] || 'Recommandé pour vous',
            vfAvailable: vfCheck.hasVF,
          };
        });

        // Sort by score and take top cards
        scored.sort((a, b) => b._score - a._score);
        setCards(scored.slice(0, 50));
        setCurrentIndex(0);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [isInList, skippedIds, userPreferredGenres, versionPreference]);

  // Save skipped IDs
  useEffect(() => {
    localStorage.setItem('otakudb-skipped', JSON.stringify(Array.from(skippedIds)));
  }, [skippedIds]);

  const currentCard = cards[currentIndex];

  const handleLike = useCallback(() => {
    if (!currentCard) return;
    
    addToList(currentCard, 'planned');
    setHistory(prev => [...prev, { card: currentCard, action: 'like' }]);
    setCurrentIndex(prev => prev + 1);
    setShowDetails(false);
    toast.success('Ajouté à votre liste !', { duration: 1500 });
  }, [currentCard, addToList]);

  const handleSkip = useCallback(() => {
    if (!currentCard) return;
    
    setSkippedIds(prev => new Set([...prev, currentCard.mal_id]));
    setHistory(prev => [...prev, { card: currentCard, action: 'skip' }]);
    setCurrentIndex(prev => prev + 1);
    setShowDetails(false);
  }, [currentCard]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    
    const lastAction = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentIndex(prev => prev - 1);
    
    if (lastAction.action === 'like') {
      useAnimeListStore.getState().removeFromList(lastAction.card.mal_id);
    } else {
      setSkippedIds(prev => {
        const next = new Set(prev);
        next.delete(lastAction.card.mal_id);
        return next;
      });
    }
    
    toast.success('Action annulée');
  }, [history]);

  if (loading) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted-foreground">Recherche de recommandations...</p>
      </div>
    );
  }

  if (!currentCard || currentIndex >= cards.length) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">C'est tout pour aujourd'hui !</h2>
        <p className="text-muted-foreground mb-6 max-w-xs">
          Revenez demain pour découvrir de nouveaux animes adaptés à vos goûts.
        </p>
        <button
          onClick={() => {
            setSkippedIds(new Set());
            setCurrentIndex(0);
          }}
          className="btn-primary"
        >
          Recommencer
        </button>
      </div>
    );
  }

  return (
    <div className="page-container pb-24 sm:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-display font-bold">Découvrir</h1>
        </div>
        <div className="text-xs text-muted-foreground">
          {currentIndex + 1} / {cards.length}
        </div>
      </div>

      {/* Card Stack */}
      <div className="relative h-[calc(100vh-280px)] min-h-[400px] max-h-[600px]">
        <SwipeableCard
          key={currentCard.mal_id}
          card={currentCard}
          onLike={handleLike}
          onSkip={handleSkip}
          showDetails={showDetails}
          onToggleDetails={() => setShowDetails(!showDetails)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 mt-6">
        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground disabled:opacity-30 active:scale-95 transition-transform"
          aria-label="Annuler"
        >
          <Undo2 className="w-5 h-5" />
        </button>

        {/* Skip */}
        <button
          onClick={handleSkip}
          className="w-16 h-16 rounded-full bg-card border-2 border-destructive flex items-center justify-center text-destructive active:scale-95 transition-transform shadow-lg"
          aria-label="Passer"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Info */}
        <Link
          to={`/anime/${currentCard.mal_id}`}
          className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-primary active:scale-95 transition-transform"
          aria-label="Voir détails"
        >
          <Info className="w-5 h-5" />
        </Link>

        {/* Like */}
        <button
          onClick={handleLike}
          className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground active:scale-95 transition-transform shadow-lg shadow-primary/30"
          aria-label="Ajouter à la liste"
        >
          <Heart className="w-8 h-8" />
        </button>
      </div>

      {/* Match Reason */}
      <div className="text-center mt-4">
        <p className="text-xs text-muted-foreground">
          {currentCard.matchReason}
        </p>
      </div>
    </div>
  );
};

// Swipeable Card Component
interface SwipeableCardProps {
  card: SwipeCard;
  onLike: () => void;
  onSkip: () => void;
  showDetails: boolean;
  onToggleDetails: () => void;
}

const SwipeableCard = ({ card, onLike, onSkip, showDetails, onToggleDetails }: SwipeableCardProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Overlay opacity based on swipe direction
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      animate(x, 300, { duration: 0.2 });
      setTimeout(onLike, 200);
    } else if (info.offset.x < -threshold) {
      animate(x, -300, { duration: 0.2 });
      setTimeout(onSkip, 200);
    } else {
      animate(x, 0, { duration: 0.3 });
    }
  };

  const vfCheck = checkVFAvailability(card);

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      <div className="w-full h-full rounded-2xl overflow-hidden bg-card shadow-2xl relative">
        {/* Background Image */}
        <img
          src={card.images.webp?.large_image_url || card.images.jpg?.large_image_url}
          alt={card.title}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Like Overlay */}
        <motion.div 
          className="absolute inset-0 bg-primary/20 flex items-center justify-center"
          style={{ opacity: likeOpacity }}
        >
          <div className="w-24 h-24 rounded-full bg-primary/30 flex items-center justify-center border-4 border-primary">
            <Heart className="w-12 h-12 text-primary fill-primary" />
          </div>
        </motion.div>
        
        {/* Skip Overlay */}
        <motion.div 
          className="absolute inset-0 bg-destructive/20 flex items-center justify-center"
          style={{ opacity: skipOpacity }}
        >
          <div className="w-24 h-24 rounded-full bg-destructive/30 flex items-center justify-center border-4 border-destructive">
            <X className="w-12 h-12 text-destructive" />
          </div>
        </motion.div>

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          {/* Score */}
          {card.score && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-rating-gold text-sm font-medium">
              <Star className="w-4 h-4 fill-current" />
              {card.score.toFixed(1)}
            </div>
          )}
          
          {/* VF Badge */}
          {vfCheck.hasVF && (
            <div className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              VF
            </div>
          )}
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          {/* Expand/Collapse Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDetails();
            }}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-10 h-6 rounded-t-xl bg-black/60 backdrop-blur-sm flex items-center justify-center text-white"
          >
            {showDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {/* Title & Info */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {card.title_english || card.title}
            </h2>
            
            <div className="flex items-center gap-2 text-sm text-white/80 flex-wrap">
              {card.episodes && (
                <span className="flex items-center gap-1">
                  <Play className="w-3.5 h-3.5" />
                  {card.episodes} éps
                </span>
              )}
              {card.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {card.year}
                </span>
              )}
              {card.rating && (
                <span className="px-1.5 py-0.5 rounded bg-white/20 text-xs">
                  {card.rating.replace('PG-13', '13+').replace('R - 17+', '17+').replace('G -', '').split(' ')[0]}
                </span>
              )}
            </div>

            {/* Genres */}
            {card.genres && card.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {card.genres.slice(0, 3).map(genre => (
                  <span
                    key={genre.mal_id}
                    className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Synopsis (expanded) */}
            {showDetails && card.synopsis && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-white/70 line-clamp-4 mt-3"
              >
                {card.synopsis}
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DiscoverPage;