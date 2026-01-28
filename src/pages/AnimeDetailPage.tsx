import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  Play, 
  Calendar, 
  Clock, 
  Users,
  Heart,
  Plus,
  Check,
  Minus,
  ExternalLink
} from 'lucide-react';
import { getAnimeById, type Anime } from '@/services/jikanApi';
import { useAnimeListStore, type ListStatus } from '@/stores/animeListStore';

const statusOptions: { status: ListStatus; label: string; icon: React.ElementType }[] = [
  { status: 'watching', label: 'En cours', icon: Play },
  { status: 'planned', label: 'À voir', icon: Clock },
  { status: 'completed', label: 'Terminé', icon: Check },
  { status: 'favorites', label: 'Favoris', icon: Heart },
];

const AnimeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const { 
    getItemById, 
    addToList, 
    updateStatus, 
    updateProgress, 
    updateRating,
    removeFromList,
    toggleFavorite,
    isFavorite
  } = useAnimeListStore();

  const listItem = id ? getItemById(parseInt(id)) : null;
  const favorite = id ? isFavorite(parseInt(id)) : false;

  useEffect(() => {
    if (!id) return;

    const fetchAnime = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getAnimeById(parseInt(id));
        setAnime(res.data);
      } catch (err) {
        setError('Erreur lors du chargement');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnime();
  }, [id]);

  const handleStatusChange = (status: ListStatus) => {
    if (!anime) return;
    
    if (listItem) {
      updateStatus(anime.mal_id, status);
    } else {
      addToList(anime, status);
    }
    setShowStatusMenu(false);
  };

  const handleProgressChange = (delta: number) => {
    if (!anime || !listItem) return;
    const newProgress = Math.max(0, Math.min(listItem.progress + delta, anime.episodes || 9999));
    updateProgress(anime.mal_id, newProgress);
  };

  const handleRatingChange = (rating: number) => {
    if (!anime || !listItem) return;
    updateRating(anime.mal_id, rating);
  };

  const getScoreClass = (score: number | null) => {
    if (!score) return '';
    if (score >= 8) return 'high';
    if (score >= 6) return 'medium';
    return 'low';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 skeleton" />
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-80 aspect-[3/4] skeleton rounded-xl" />
            <div className="flex-1 space-y-4">
              <div className="h-8 w-3/4 skeleton" />
              <div className="h-4 w-1/2 skeleton" />
              <div className="h-32 skeleton" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="page-container">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-5 h-5" />
          Retour
        </Link>
        <div className="glass-card p-8 text-center">
          <p className="text-destructive">{error || 'Anime non trouvé'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Background */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={anime.images.webp?.large_image_url || anime.images.jpg?.large_image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="page-container -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Poster */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <img
              src={anime.images.webp?.large_image_url || anime.images.jpg?.large_image_url}
              alt={anime.title}
              className="w-48 md:w-64 rounded-xl shadow-2xl"
            />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            {/* Title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                {anime.title_english || anime.title}
              </h1>
              {anime.title_english && anime.title !== anime.title_english && (
                <p className="text-muted-foreground mt-1">{anime.title}</p>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3">
              {anime.score && (
                <div className={`score-badge ${getScoreClass(anime.score)}`}>
                  <Star className="w-4 h-4 fill-current" />
                  <span>{anime.score.toFixed(1)}</span>
                </div>
              )}
              {anime.episodes && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Play className="w-4 h-4" />
                  <span>{anime.episodes} épisodes</span>
                </div>
              )}
              {anime.aired?.string && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{anime.aired.string}</span>
                </div>
              )}
              {anime.members && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{(anime.members / 1000).toFixed(0)}K</span>
                </div>
              )}
            </div>

            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {anime.genres.map((genre) => (
                  <span
                    key={genre.mal_id}
                    className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              {/* Status Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className={`btn-primary flex items-center gap-2 ${listItem ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : ''}`}
                >
                  {listItem ? (
                    <>
                      {statusOptions.find(s => s.status === listItem.status)?.icon && 
                        (() => {
                          const Icon = statusOptions.find(s => s.status === listItem.status)!.icon;
                          return <Icon className="w-4 h-4" />;
                        })()
                      }
                      {statusOptions.find(s => s.status === listItem.status)?.label}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Ajouter à ma liste
                    </>
                  )}
                </button>
                
                {showStatusMenu && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-scale-in">
                    {statusOptions.map(({ status, label, icon: Icon }) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors ${
                          listItem?.status === status ? 'bg-primary/10 text-primary' : 'text-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                    {listItem && (
                      <>
                        <div className="border-t border-border" />
                        <button
                          onClick={() => {
                            removeFromList(anime.mal_id);
                            setShowStatusMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                          Retirer
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Favorite */}
              <button
                onClick={() => toggleFavorite(anime)}
                className={`btn-secondary flex items-center gap-2 ${
                  favorite ? 'bg-primary/20 text-primary border-primary/30' : ''
                }`}
              >
                <Heart className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
                {favorite ? 'Favori' : 'Ajouter aux favoris'}
              </button>
            </div>

            {/* Progress (if in list) */}
            {listItem && listItem.status === 'watching' && (
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Progression</span>
                  <span className="text-sm font-medium">
                    {listItem.progress}/{anime.episodes || '?'} épisodes
                  </span>
                </div>
                <div className="progress-bar h-2">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${anime.episodes ? (listItem.progress / anime.episodes) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => handleProgressChange(-1)}
                    disabled={listItem.progress <= 0}
                    className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-2xl font-bold w-20 text-center">{listItem.progress}</span>
                  <button
                    onClick={() => handleProgressChange(1)}
                    disabled={anime.episodes ? listItem.progress >= anime.episodes : false}
                    className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Rating (if completed) */}
            {listItem && listItem.status === 'completed' && (
              <div className="glass-card p-4 space-y-3">
                <span className="text-sm text-muted-foreground">Votre note</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingChange(star)}
                      className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                        listItem.rating && star <= listItem.rating
                          ? 'bg-rating-gold/20 text-rating-gold'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${listItem.rating && star <= listItem.rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Synopsis */}
        {anime.synopsis && (
          <section className="mt-8">
            <h2 className="section-title">Synopsis</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {anime.synopsis}
            </p>
          </section>
        )}

        {/* Studios */}
        {anime.studios && anime.studios.length > 0 && (
          <section className="mt-8">
            <h2 className="section-title">Studios</h2>
            <div className="flex flex-wrap gap-2">
              {anime.studios.map((studio) => (
                <span
                  key={studio.mal_id}
                  className="px-3 py-1.5 rounded-lg bg-card border border-border text-sm"
                >
                  {studio.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Trailer */}
        {anime.trailer?.youtube_id && (
          <section className="mt-8">
            <h2 className="section-title">Trailer</h2>
            <div className="aspect-video rounded-xl overflow-hidden bg-card">
              <iframe
                src={`https://www.youtube.com/embed/${anime.trailer.youtube_id}`}
                title="Trailer"
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AnimeDetailPage;
