import { useState } from 'react';
import { List, Play, Check, Clock, Heart } from 'lucide-react';
import { useAnimeListStore, type ListStatus } from '@/stores/animeListStore';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { Star } from 'lucide-react';
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
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
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
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <List className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-display font-bold">Mes Listes</h1>
          <p className="text-sm text-muted-foreground">
            {stats.total} anime{stats.total > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Tabs - Better spacing */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {tabs.map(({ status, label, icon: Icon }) => {
          const count = status === 'watching' ? stats.watching
            : status === 'completed' ? stats.completed
            : status === 'planned' ? stats.planned
            : stats.favorites;
          
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`tab-item flex items-center gap-2.5 whitespace-nowrap ${
                activeTab === status ? 'active' : ''
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === status 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List Content */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-4">
            {activeTab === 'watching' && "Aucun anime en cours."}
            {activeTab === 'completed' && "Aucun anime terminé."}
            {activeTab === 'planned' && "Aucun anime à voir."}
            {activeTab === 'favorites' && "Aucun favori."}
          </p>
          <Link to="/search" className="btn-primary text-sm">
            Explorer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item) => (
            <div key={item.anime.mal_id}>
              <AnimeCard 
                anime={item.anime} 
                showQuickAdd={false} 
                showProgress={activeTab === 'watching'}
              />
              {activeTab === 'completed' && item.rating && (
                <div className="mt-2 flex items-center justify-center gap-1">
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
