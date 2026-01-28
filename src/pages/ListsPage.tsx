import { useState } from 'react';
import { List, Play, Check, Clock, Heart, Star } from 'lucide-react';
import { useAnimeListStore, type ListStatus } from '@/stores/animeListStore';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { Link } from 'react-router-dom';

const tabs: { status: ListStatus; label: string; icon: React.ElementType }[] = [
  { status: 'watching', label: 'En cours', icon: Play },
  { status: 'planned', label: 'À voir', icon: Clock },
  { status: 'completed', label: 'Terminés', icon: Check },
  { status: 'favorites', label: 'Favoris', icon: Heart },
];

const ListsPage = () => {
  const [activeTab, setActiveTab] = useState<ListStatus>('watching');
  const { getItemsByStatus, getStats } = useAnimeListStore();
  const stats = getStats();
  const items = getItemsByStatus(activeTab);

  const renderRatingStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating
                ? 'text-rating-gold fill-rating-gold'
                : 'text-muted-foreground/20'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="page-container space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <List className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">Mes Listes</h1>
          <p className="text-xs text-muted-foreground">
            {stats.total} anime{stats.total > 1 ? 's' : ''} au total
          </p>
        </div>
      </div>

      {/* Tabs - Mobile optimized */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 snap-x">
        {tabs.map(({ status, label, icon: Icon }) => {
          const count = status === 'watching' ? stats.watching
            : status === 'completed' ? stats.completed
            : status === 'planned' ? stats.planned
            : stats.favorites;
          
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors snap-start ${
                activeTab === status 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card text-muted-foreground active:bg-card-hover'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-0.5 ${
                activeTab === status 
                  ? 'bg-primary-foreground/20 text-primary-foreground' 
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List Content */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-3">
            {activeTab === 'watching' && <Play className="w-6 h-6 text-muted-foreground" />}
            {activeTab === 'completed' && <Check className="w-6 h-6 text-muted-foreground" />}
            {activeTab === 'planned' && <Clock className="w-6 h-6 text-muted-foreground" />}
            {activeTab === 'favorites' && <Heart className="w-6 h-6 text-muted-foreground" />}
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {activeTab === 'watching' && "Aucun anime en cours"}
            {activeTab === 'completed' && "Aucun anime terminé"}
            {activeTab === 'planned' && "Aucun anime prévu"}
            {activeTab === 'favorites' && "Aucun favori"}
          </p>
          <Link to="/search" className="btn-primary text-sm">
            Découvrir des animes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {items.map((item) => (
            <div key={item.anime.mal_id}>
              <AnimeCard 
                anime={item.anime} 
                showQuickAdd={false} 
                showProgress={activeTab === 'watching'}
              />
              {activeTab === 'completed' && item.rating && (
                <div className="mt-1.5">
                  {renderRatingStars(item.rating)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListsPage;
