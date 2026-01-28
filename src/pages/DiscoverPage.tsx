import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Star, Calendar, Play, Filter, X, Search, TrendingUp, Zap,
  BookOpen, Clock, Users, Sparkles, Compass
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTopAnime, getSeasonalAnime, type Anime } from '@/services/jikanApi';
import { useAnimeListStore } from '@/stores/animeListStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

interface FilterOptions {
  status: 'all' | 'airing' | 'completed';
  type: 'all' | 'tv' | 'movie' | 'special' | 'ova';
  season: 'all' | 'winter' | 'spring' | 'summer' | 'fall';
  year: 'all' | string;
  sortBy: 'popular' | 'score' | 'recent' | 'trending';
  scoreMin: number;
  searchTerm: string;
}

const SkeletonCard = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden h-80 animate-pulse"
  >
    <div className="h-40 bg-gray-700" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-700 rounded w-3/4" />
      <div className="h-3 bg-gray-700 rounded w-1/2" />
    </div>
  </motion.div>
);

const AnimeCard = ({ anime, onLike, isFavorite }: {
  anime: Anime;
  onLike: (anime: Anime) => void;
  isFavorite: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -8 }}
    className="group relative h-80 rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 cursor-pointer shadow-lg hover:shadow-2xl transition-shadow"
  >
    {/* Background Image */}
    <div className="absolute inset-0">
      <img
        src={anime.images?.jpg?.image_url}
        alt={anime.title}
        className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
    </div>

    {/* Content */}
    <div className="relative h-full flex flex-col justify-between p-4 text-white">
      {/* Top Section - Info */}
      <div className="flex items-start justify-between">
        <div className="flex gap-2 flex-wrap">
          {anime.score && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm"
            >
              <Star size={12} className="fill-current" />
              {anime.score.toFixed(1)}
            </motion.div>
          )}
          {anime.aired?.from && (
            <div className="flex items-center gap-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
              <Calendar size={12} />
              {new Date(anime.aired.from).getFullYear()}
            </div>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onLike(anime)}
          className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
            isFavorite
              ? 'bg-red-500/80 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
        </motion.button>
      </div>

      {/* Bottom Section - Details */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-bold line-clamp-2 group-hover:text-purple-300 transition-colors">
            {anime.title}
          </h3>
          {anime.title_japanese && (
            <p className="text-xs text-gray-400 mt-1">{anime.title_japanese}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-300">
          <div className="flex items-center gap-1">
            <Play size={14} />
            <span>{anime.episodes || '?'} episodes</span>
          </div>
          <Link
            to={`/anime/${anime.mal_id}`}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-600/80 hover:bg-purple-500 transition-colors font-medium"
          >
            View <Sparkles size={12} />
          </Link>
        </div>
      </div>
    </div>
  </motion.div>
);

export default function DiscoverPage() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    type: 'all',
    season: 'all',
    year: 'all',
    sortBy: 'popular',
    scoreMin: 5,
    searchTerm: '',
  });

  const { favorites = [], addFavorite, removeFavorite } = useAnimeListStore();

  // Charger les animés
  useEffect(() => {
    const loadAnimes = async () => {
      setLoading(true);
      try {
        const data = filters.season !== 'all'
          ? await getSeasonalAnime(filters.season)
          : await getTopAnime();
        setAnimes(data?.data || []);
      } catch (error) {
        console.error('❌ Failed to load animes:', error);
        toast.error('Failed to load animes');
        setAnimes([]);
      } finally {
        setLoading(false);
      }
    };

    loadAnimes();
  }, [filters.season]);

  // Filtrer et trier
  const filteredAnimes = useMemo(() => {
    let result = animes;

    // Filtrer par score
    result = result.filter(a => (a.score || 0) >= filters.scoreMin);

    // Filtrer par type
    if (filters.type !== 'all') {
      result = result.filter(a => a.type?.toLowerCase() === filters.type);
    }

    // Filtrer par statut
    if (filters.status !== 'all') {
      result = result.filter(a => a.status?.toLowerCase().includes(filters.status));
    }

    // Filtrer par année
    if (filters.year !== 'all') {
      result = result.filter(a => a.aired?.from?.includes(filters.year));
    }

    // Rechercher
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(a =>
        a.title?.toLowerCase().includes(term) ||
        a.title_japanese?.toLowerCase().includes(term)
      );
    }

    // Trier
    switch (filters.sortBy) {
      case 'score':
        result.sort((a, b) => (b.score || 0) - (a.score || 0));
        break;
      case 'recent':
        result.sort((a, b) =>
          new Date(b.aired?.from || 0).getTime() -
          new Date(a.aired?.from || 0).getTime()
        );
        break;
      case 'trending':
        result.sort((a, b) => (b.members || 0) - (a.members || 0));
        break;
      default: // popular
        result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    return result;
  }, [animes, filters]);

  const handleLike = (anime: Anime) => {
    const isFavorite = favorites.includes(anime.mal_id);
    if (isFavorite) {
      removeFavorite(anime.mal_id);
      toast.success(`Removed from favorites`);
    } else {
      addFavorite(anime.mal_id);
      toast.success(`Added to favorites! ❤️`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/30 to-gray-950 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 backdrop-blur-lg bg-black/40 border-b border-purple-500/20 py-4 px-4"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400">
                <Compass size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Discover</h1>
                <p className="text-sm text-gray-400">Find your next favorite anime</p>
              </div>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter size={16} />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-gray-900 border-gray-800">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  {/* Sort */}
                  <div>
                    <label className="text-sm font-medium text-gray-300">Sort By</label>
                    <Select value={filters.sortBy} onValueChange={(value: any) =>
                      setFilters({ ...filters, sortBy: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popular">Popular</SelectItem>
                        <SelectItem value="score">Highest Rated</SelectItem>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="trending">Trending Now</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="text-sm font-medium text-gray-300">Type</label>
                    <Select value={filters.type} onValueChange={(value: any) =>
                      setFilters({ ...filters, type: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="tv">TV Series</SelectItem>
                        <SelectItem value="movie">Movies</SelectItem>
                        <SelectItem value="ova">OVA</SelectItem>
                        <SelectItem value="special">Specials</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Season */}
                  <div>
                    <label className="text-sm font-medium text-gray-300">Season</label>
                    <Select value={filters.season} onValueChange={(value: any) =>
                      setFilters({ ...filters, season: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Seasons</SelectItem>
                        <SelectItem value="winter">Winter</SelectItem>
                        <SelectItem value="spring">Spring</SelectItem>
                        <SelectItem value="summer">Summer</SelectItem>
                        <SelectItem value="fall">Fall</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Min Score */}
                  <div>
                    <label className="text-sm font-medium text-gray-300">
                      Minimum Score: {filters.scoreMin}+
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={filters.scoreMin}
                      onChange={(e) =>
                        setFilters({ ...filters, scoreMin: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search anime..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 flex items-center justify-between"
        >
          <p className="text-gray-400">
            Found <span className="text-purple-400 font-bold">{filteredAnimes.length}</span> animes
          </p>
          {filters.searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ ...filters, searchTerm: '' })}
              className="gap-2"
            >
              <X size={16} />
              Clear Search
            </Button>
          )}
        </motion.div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredAnimes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <BookOpen size={48} className="text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No animes found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search term</p>
              <Button onClick={() => setFilters({
                status: 'all',
                type: 'all',
                season: 'all',
                year: 'all',
                sortBy: 'popular',
                scoreMin: 5,
                searchTerm: '',
              })}>
                Reset Filters
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredAnimes.map((anime, idx) => (
                <motion.div
                  key={anime.mal_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <AnimeCard
                    anime={anime}
                    onLike={handleLike}
                    isFavorite={favorites.includes(anime.mal_id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
