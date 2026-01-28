import { useState } from 'react';
import { User, LogOut, Share2, Settings, Heart, Clock, Sparkles, Trophy, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAnimeListStore } from '@/stores/animeListStore';
import { discordAuthService } from '@/services/discordAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  const { user, logout } = useAuthStore();
  const { items, getStats } = useAnimeListStore();
  const [sharing, setSharing] = useState(false);

  const stats = getStats();
  const animeList = Object.values(items).map(item => item.anime);

  const handleDiscordLogin = async () => {
    try {
      const authUrl = await discordAuthService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      toast.error('Impossible de se connecter avec Discord');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Deconnecte');
  };

  const generateListImage = async () => {
    setSharing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context not available');

      // Background - dark
      ctx.fillStyle = '#0F0F0F';
      ctx.fillRect(0, 0, 1200, 800);

      // Header gradient
      const gradient = ctx.createLinearGradient(0, 0, 1200, 200);
      gradient.addColorStop(0, '#FF6B35');
      gradient.addColorStop(1, '#FF8C5A');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 4);

      // Title
      ctx.fillStyle = '#FF6B35';
      ctx.font = 'bold 48px Inter, Arial';
      ctx.fillText('OtakuDB', 60, 80);

      // User info
      ctx.fillStyle = '#F2F2F2';
      ctx.font = '24px Inter, Arial';
      if (user) {
        ctx.fillText(`@${user.username}`, 60, 130);
      }

      // Stats
      ctx.fillStyle = '#8C8C8C';
      ctx.font = '18px Inter, Arial';
      let yPos = 180;
      ctx.fillText(`Total Anime: ${animeList.length}`, 60, yPos);
      yPos += 30;
      ctx.fillText(`Episodes: ${stats.totalEpisodes}`, 60, yPos);
      yPos += 30;
      ctx.fillText(`Note moyenne: ${stats.averageRating.toFixed(1)}/10`, 60, yPos);

      // Top 5
      yPos = 280;
      ctx.fillStyle = '#FF6B35';
      ctx.font = 'bold 18px Inter, Arial';
      ctx.fillText('Top 5 Animes:', 60, yPos);

      const top5 = animeList.slice(0, 5);
      yPos += 40;
      ctx.font = '16px Inter, Arial';
      ctx.fillStyle = '#F2F2F2';

      top5.forEach((anime, idx) => {
        const text = `${idx + 1}. ${anime.title}`;
        ctx.fillText(text, 80, yPos);
        yPos += 35;
      });

      // Footer
      yPos = 750;
      ctx.fillStyle = '#5C5C5C';
      ctx.font = '14px Inter, Arial';
      ctx.fillText(`Partage depuis OtakuDB - ${new Date().toLocaleDateString()}`, 60, yPos);

      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Blob creation failed');

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `otakudb-list-${new Date().toISOString().split('T')[0]}.png`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Liste partagee en image!');
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Erreur lors du partage');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <User size={24} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Mon Profil</h1>
          </div>
        </motion.div>

        {!user ? (
          // Non connecte
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center"
          >
            <div className="mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Bienvenue sur OtakuDB
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Connectez-vous avec Discord pour synchroniser votre liste d'animes,
              acceder a vos favoris sur tous vos appareils, et partager votre liste avec vos amis.
            </p>

            <Button
              onClick={handleDiscordLogin}
              className="gap-3 px-8 py-6 text-lg bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl font-bold transition-all"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 127.14 96.36"
                fill="currentColor"
              >
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
              </svg>
              Se connecter avec Discord
            </Button>

            <p className="text-muted-foreground text-sm mt-6">
              Vos donnees resteront privees et securisees
            </p>
          </motion.div>
        ) : (
          // Connecte
          <div className="space-y-4">
            {/* User Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  {user.avatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                      alt={user.username}
                      className="w-16 h-16 rounded-full border-2 border-primary"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {user.username}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {user.email || 'Utilisateur Discord'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Deconnexion</span>
                </Button>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={16} className="text-primary" />
                  <span className="text-muted-foreground text-xs">Animes</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{animeList.length}</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-primary" />
                  <span className="text-muted-foreground text-xs">Episodes</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.totalEpisodes}</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={16} className="text-primary" />
                  <span className="text-muted-foreground text-xs">Termines</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-primary" />
                  <span className="text-muted-foreground text-xs">Note moy.</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.averageRating.toFixed(1)}</p>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <Button
                onClick={generateListImage}
                disabled={sharing || animeList.length === 0}
                className="gap-3 py-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold"
              >
                <Share2 size={20} />
                {sharing ? 'Generation...' : 'Partager ma liste'}
              </Button>

              <Button
                variant="outline"
                className="gap-3 py-6 border-border hover:bg-accent rounded-xl"
              >
                <Settings size={20} />
                Parametres
              </Button>
            </motion.div>

            {/* Top Animes */}
            {animeList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-2xl p-4 sm:p-6"
              >
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Heart size={18} className="text-primary" />
                  Mes animes recents
                </h3>

                <div className="space-y-2">
                  {animeList.slice(0, 5).map((anime, idx) => (
                    <Link
                      key={anime.mal_id}
                      to={`/anime/${anime.mal_id}`}
                      className="flex items-center gap-4 p-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors group"
                    >
                      <span className="text-xl font-bold text-primary w-6 text-center">
                        {idx + 1}
                      </span>
                      <img 
                        src={anime.images?.jpg?.image_url} 
                        alt={anime.title}
                        className="w-12 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-medium group-hover:text-primary transition-colors truncate">
                          {anime.title_english || anime.title}
                        </p>
                        <p className="text-muted-foreground text-sm flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-primary" />
                          {anime.score}/10
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
