import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { 
  Heart, X, Info, Undo2, Star, Calendar, Play, Compass, ChevronDown, ChevronUp,
  ArrowUpDown, Filter, RotateCcw, TrendingUp, TrendingDown, Hash
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTopAnime, getSeasonalAnime, type Anime } from '@/services/jikanApi';
import { useAnimeListStore } from '@/stores/animeListStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { checkVFAvailability } from '@/services/vfDatabase';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface SwipeCard extends Anime {
  matchReason?: string;
  vfAvailable?: boolean;
  _score?: number;
}

type SortOption = 
  | 'relevance'
  | 'popularity_desc'
  | 'popularity_asc'
  | 'score_desc'
  | 'score_asc'
  | 'date_desc'
  | 'date_asc'
  | 'alphabetical_asc'
  | 'alphabetical_desc'
  | 'episodes_desc'
  | 'episodes_asc';

interface FilterState {
  genres: number[];
  year: [number, number] | null;
  status: string | null;
  type: string | null;
  episodes: [number, number] | null;
  source: string | null;
}

const DiscoverPage = () => {
  const [cards, setCards] = useState<SwipeCard[]>([]);
  const [allCards, setAllCards] = useState<SwipeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [history, setHistory] = useState<{ card: SwipeCard; action: 'like' | 'skip' }[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [filters, setFilters] = useState<FilterState>({
    genres: [],
    year: null,
    status: null,
    type: null,
    episodes: null,
    source: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [skippedIds, setSkippedIds] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('otakudb-skipped');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const { addToList, isInList, getItemsByStatus } = useAnimeListStore();
  const { versionPreference } = useUserPreferencesStore();

  // Générer un seed quotidien pour varier les résultats
  const dailySeed = useMemo(() => {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    return dateString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }, []);

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

  // Fetch recommendations avec pagination et variété
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        // Récupérer plusieurs sources pour varier
        const [seasonalRes, topPopularRes, topScoreRes, topAiringRes] = await Promise.all([
          getSeasonalAnime(),
          getTopAnime(currentPage, 'bypopularity'),
          getTopAnime(currentPage, 'favorite'),
          getTopAnime(currentPage, 'airing'),
        ]);

        // Combiner toutes les sources
        const allAnime = [
          ...(seasonalRes.data || []),
          ...(topPopularRes.data || []),
          ...(topScoreRes.data || []),
          ...(topAiringRes.data || []),
        ];
        
        // Dedupe and filter
        const seen = new Set<number>();
        const filtered = allAnime.filter(anime => {
          if (seen.has(anime.mal_id)) return false;
          if (isInList(anime.mal_id)) return false;
          if (skippedIds.has(anime.mal_id)) return false;
          seen.add(anime.mal_id);
          return true;
        });

        // Appliquer les filtres
        let filteredByFilters = filtered;
        
        if (filters.genres.length > 0) {
          filteredByFilters = filteredByFilters.filter(anime =>
            anime.genres?.some(g => filters.genres.includes(g.mal_id))
          );
        }

        if (filters.year) {
          filteredByFilters = filteredByFilters.filter(anime =>
            anime.year && anime.year >= filters.year![0] && anime.year <= filters.year![1]
          );
        }

        if (filters.status) {
          filteredByFilters = filteredByFilters.filter(anime =>
            anime.status?.toLowerCase().includes(filters.status!.toLowerCase())
          );
        }

        if (filters.episodes) {
          filteredByFilters = filteredByFilters.filter(anime =>
            anime.episodes &&
            anime.episodes >= filters.episodes![0] &&
            anime.episodes <= filters.episodes![1]
          );
        }

        // Score and sort by relevance
        const scored = filteredByFilters.map(anime => {
          let score = 0;
          const reasons: string[] = [];

          // Genre match (40% du score)
          const matchingGenres = anime.genres?.filter(g => 
            userPreferredGenres.includes(g.name)
          ) || [];
          if (matchingGenres.length > 0) {
            score += matchingGenres.length * 20;
            reasons.push(`Genre: ${matchingGenres[0].name}`);
          }

          // Popularity (30% du score)
          if (anime.members && anime.members > 500000) {
            score += 15;
            reasons.push('Très populaire');
          }

          // Score (20% du score)
          if (anime.score && anime.score >= 8) {
            score += 20;
            reasons.push(`Note: ${anime.score.toFixed(1)}`);
          }

          // VF availability (10% du score)
          const vfCheck = checkVFAvailability(anime);
          if (vfCheck.hasVF && versionPreference === 'vf') {
            score += 25;
            reasons.push('Disponible en VF');
          }

          // Random seed pour varier l'ordre
          score += (anime.mal_id % 100) * 0.1 * (dailySeed % 10);

          return {
            ...anime,
            _score: score,
            matchReason: reasons[0] || 'Recommandé pour vous',
            vfAvailable: vfCheck.hasVF,
          };
        });

        // Appliquer le tri
        let sorted = [...scored];
        
        switch (sortOption) {
          case 'popularity_desc':
            sorted.sort((a, b) => (b.popularity || 9999) - (a.popularity || 9999));
            break;
          case 'popularity_asc':
            sorted.sort((a, b) => (a.popularity || 0) - (b.popularity || 0));
            break;
          case 'score_desc':
            sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
            break;
          case 'score_asc':
            sorted.sort((a, b) => (a.score || 0) - (b.score || 0));
            break;
          case 'date_desc':
            sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
            break;
          case 'date_asc':
            sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
            break;
          case 'alphabetical_asc':
            sorted.sort((a, b) => 
              (a.title_english || a.title || '').localeCompare(b.title_english || b.title || '')
            );
            break;
          case 'alphabetical_desc':
            sorted.sort((a, b) => 
              (b.title_english || b.title || '').localeCompare(a.title_english || a.title || '')
            );
            break;
          case 'episodes_desc':
            sorted.sort((a, b) => (b.episodes || 0) - (a.episodes || 0));
            break;
          case 'episodes_asc':
            sorted.sort((a, b) => (a.episodes || 0) - (b.episodes || 0));
            break;
          case 'relevance':
          default:
            sorted.sort((a, b) => (b._score || 0) - (a._score || 0));
            break;
        }

        // Mélanger légèrement pour éviter toujours les mêmes résultats
        if (sortOption === 'relevance') {
          // Mélanger les 20 premiers avec un seed
          const top = sorted.slice(0, 20);
          const rest = sorted.slice(20);
          const shuffled = top.sort(() => Math.random() - 0.5 + (dailySeed % 10) * 0.1);
          sorted = [...shuffled, ...rest];
        }

        setAllCards(sorted);
        setCards(sorted.slice(0, 50)); // Limiter à 50 cartes affichées
        setCurrentIndex(0);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [isInList, skippedIds, userPreferredGenres, versionPreference, currentPage, sortOption, filters, dailySeed]);

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
    toast.success('Ajouté à votre liste', { duration: 1500 });
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

  const resetFilters = () => {
    setFilters({
      genres: [],
      year: null,
      status: null,
      type: null,
      episodes: null,
      source: null,
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return filters.genres.length > 0 ||
           filters.year !== null ||
           filters.status !== null ||
           filters.type !== null ||
           filters.episodes !== null ||
           filters.source !== null;
  }, [filters]);

  if (loading) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <Compass className="w-7 h-7 text-muted-foreground animate-pulse" />
        </div>
        <p className="text-muted-foreground text-sm">Chargement des recommandations...</p>
      </div>
    );
  }

  if (!currentCard || currentIndex >= cards.length) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <Compass className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">C'est tout pour aujourd'hui</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs leading-relaxed">
          Revenez demain pour découvrir de nouveaux animes adaptés à vos goûts.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSkippedIds(new Set());
              setCurrentIndex(0);
              setCurrentPage(prev => prev + 1);
            }}
            className="btn-primary"
          >
            Charger plus
          </button>
          <button
            onClick={() => {
              setSkippedIds(new Set());
              setCurrentIndex(0);
              setCurrentPage(1);
            }}
            className="btn-secondary"
          >
            Recommencer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container pb-24 sm:pb-8">
      {/* Header avec tri et filtres */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-display font-bold">Découvrir</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground bg-secondary/60 px-2 py-1 rounded-md">
            {currentIndex + 1} / {cards.length}
          </div>
          
          {/* Bouton Filtres */}
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button
                variant={hasActiveFilters ? "default" : "outline"}
                size="sm"
                className="relative"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtres
                {hasActiveFilters && (
                  <span className="ml-2 w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filtres de recherche</SheetTitle>
                <SheetDescription>
                  Affinez vos recommandations selon vos préférences
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Année */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Année: {filters.year ? `${filters.year[0]} - ${filters.year[1]}` : 'Toutes'}
                  </label>
                  <Slider
                    value={filters.year || [1960, 2026]}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, year: value as [number, number] }))}
                    min={1960}
                    max={2026}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Statut */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Statut</label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? null : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="airing">En cours</SelectItem>
                      <SelectItem value="complete">Terminé</SelectItem>
                      <SelectItem value="upcoming">À venir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nombre d'épisodes */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Épisodes: {filters.episodes ? `${filters.episodes[0]} - ${filters.episodes[1]}` : 'Tous'}
                  </label>
                  <Slider
                    value={filters.episodes || [1, 1000]}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, episodes: value as [number, number] }))}
                    min={1}
                    max={1000}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={resetFilters} variant="outline" className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Réinitialiser
                  </Button>
                  <Button onClick={() => setShowFilters(false)} className="flex-1">
                    Appliquer
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Sélecteur de tri */}
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Pertinence</SelectItem>
              <SelectItem value="popularity_desc">Popularité ↓</SelectItem>
              <SelectItem value="popularity_asc">Popularité ↑</SelectItem>
              <SelectItem value="score_desc">Note ↓</SelectItem>
              <SelectItem value="score_asc">Note ↑</SelectItem>
              <SelectItem value="date_desc">Date ↓</SelectItem>
              <SelectItem value="date_asc">Date ↑</SelectItem>
              <SelectItem value="alphabetical_asc">A-Z</SelectItem>
              <SelectItem value="alphabetical_desc">Z-A</SelectItem>
              <SelectItem value="episodes_desc">Épisodes ↓</SelectItem>
              <SelectItem value="episodes_asc">Épisodes ↑</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Card Stack */}
      <div className="relative" style={{ height: 'calc(100dvh - 260px)', minHeight: '380px', maxHeight: '520px' }}>
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
      <div className="flex items-center justify-center gap-3 mt-5">
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground disabled:opacity-30 active:scale-95 transition-transform"
          aria-label="Annuler"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleSkip}
          className="w-14 h-14 rounded-full bg-card border-2 border-destructive/60 flex items-center justify-center text-destructive active:scale-95 transition-transform"
          aria-label="Passer"
        >
          <X className="w-7 h-7" />
        </button>

        <Link
          to={`/anime/${currentCard.mal_id}`}
          className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary active:scale-95 transition-all"
          aria-label="Voir détails"
        >
          <Info className="w-4 h-4" />
        </Link>

        <button
          onClick={handleLike}
          className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground active:scale-95 transition-transform"
          aria-label="Ajouter à la liste"
        >
          <Heart className="w-7 h-7" />
        </button>
      </div>

      {/* Match Reason */}
      <div className="text-center mt-3">
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
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 80;
    
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
      <div className="w-full h-full rounded-2xl overflow-hidden bg-card shadow-xl relative">
        <img
          src={card.images.webp?.large_image_url || card.images.jpg?.large_image_url}
          alt={card.title}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <motion.div 
          className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none"
          style={{ opacity: likeOpacity }}
        >
          <div className="w-20 h-20 rounded-full bg-primary/30 flex items-center justify-center border-4 border-primary">
            <Heart className="w-10 h-10 text-primary fill-primary" />
          </div>
        </motion.div>
        
        <motion.div 
          className="absolute inset-0 bg-destructive/20 flex items-center justify-center pointer-events-none"
          style={{ opacity: skipOpacity }}
        >
          <div className="w-20 h-20 rounded-full bg-destructive/30 flex items-center justify-center border-4 border-destructive">
            <X className="w-10 h-10 text-destructive" />
          </div>
        </motion.div>

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {card.score && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-rating-gold text-sm font-medium">
              <Star className="w-3.5 h-3.5 fill-current" />
              {card.score.toFixed(1)}
            </div>
          )}
          
          {vfCheck.hasVF && (
            <div className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              VF
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDetails();
            }}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-8 h-5 rounded-t-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80"
          >
            {showDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white leading-tight line-clamp-2">
              {card.title_english || card.title}
            </h2>
            
            <div className="flex items-center gap-2 text-sm text-white/80 flex-wrap">
              {card.episodes && (
                <span className="flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  {card.episodes} éps
                </span>
              )}
              {card.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {card.year}
                </span>
              )}
              {card.rating && (
                <span className="px-1.5 py-0.5 rounded bg-white/20 text-xs">
                  {card.rating.replace('PG-13', '13+').replace('R - 17+', '17+').replace('G -', '').split(' ')[0]}
                </span>
              )}
            </div>

            {card.genres && card.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {card.genres.slice(0, 3).map(genre => (
                  <span
                    key={genre.mal_id}
                    className="px-2 py-0.5 rounded-md bg-white/15 text-white/90 text-xs"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {showDetails && card.synopsis && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-white/70 line-clamp-4 mt-2 leading-relaxed"
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
