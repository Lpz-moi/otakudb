import { useState } from 'react';
import { User, LogOut, Share2, Download, Settings, Heart, Clock, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAnimeListStore } from '@/stores/animeListStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { discordAuthService } from '@/services/discordAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const ProfilePage = () => {
  const { user, logout } = useAuthStore();
  const { items, getStats } = useAnimeListStore();
  const { versionPreference, setVersionPreference } = useUserPreferencesStore();
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
    toast.success('Déconnecté');
  };

  const generateListImage = async () => {
    setSharing(true);
    try {
      // Créer un canvas avec la liste
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context not available');

      // Background dégradé
      const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 800);

      // Header
      ctx.fillStyle = '#a78bfa';
      ctx.font = 'bold 48px Arial';
      ctx.fillText('🎌 My Anime List', 60, 80);

      // User info
      ctx.fillStyle = '#d1d5db';
      ctx.font = '24px Arial';
      if (user) {
        ctx.fillText(`User: ${user.username}`, 60, 130);
      }

      // Stats
      ctx.fillStyle = '#9ca3af';
      ctx.font = '18px Arial';
      let yPos = 180;
      ctx.fillText(`Total Anime: ${animeList.length}`, 60, yPos);
      yPos += 30;
      ctx.fillText(`Episodes: ${stats.totalEpisodes}`, 60, yPos);
      yPos += 30;
      ctx.fillText(`Average Rating: ${stats.averageRating.toFixed(1)}/10`, 60, yPos);

      // List preview
      yPos = 280;
      ctx.fillStyle = '#d1d5db';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('Top 5 Animes:', 60, yPos);

      const top5 = animeList.slice(0, 5);
      yPos += 40;
      ctx.font = '16px Arial';
      ctx.fillStyle = '#b4b4b4';

      top5.forEach((anime, idx) => {
        const text = `${idx + 1}. ${anime.title}`;
        ctx.fillText(text, 80, yPos);
        yPos += 35;
      });

      // Footer
      yPos = 750;
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px Arial';
      ctx.fillText(`Shared from OtakuDB • ${new Date().toLocaleDateString()}`, 60, yPos);

      // Convertir en image et télécharger
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Blob creation failed');

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `otakudb-list-${new Date().toISOString().split('T')[0]}.png`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Liste partagée en image!');
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Erreur lors du partage');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/10 to-black pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-purple-600/20 text-purple-400">
              <User size={28} />
            </div>
            <h1 className="text-3xl font-bold text-white">Mon Profil</h1>
          </div>
        </motion.div>

        {!user ? (
          // Non connecté
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-xl p-12 text-center backdrop-blur-xl"
          >
            <div className="mb-6">
              <Sparkles className="w-16 h-16 text-purple-400 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Bienvenue sur OtakuDB
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Connectez-vous avec Discord pour synchroniser votre liste d'animes,
              accéder à vos favoris sur tous vos appareils, et partager votre liste avec vos amis.
            </p>

            <Button
              onClick={handleDiscordLogin}
              className="gap-3 px-8 py-6 text-lg bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-bold transition-all hover:shadow-lg hover:shadow-purple-500/50"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 127.14 96.36"
                fill="currentColor"
              >
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A99.68,99.68,0,0,0,49.67,0a72.37,72.37,0,0,0-3.36-6.83A105.89,105.89,0,0,0,19.44,8.07a750.91,750.91,0,0,0-122.88,37.39A771.64,771.64,0,0,0,0,72.882a110.9,110.9,0,0,0,10.389,13.231a106.56,106.56,0,0,0,32.625,24.666q3.746-5.4,6.923-11.09A68.12,68.12,0,0,1,29.6,91.682a101.05,101.05,0,0,0,15.455,5.063A67.135,67.135,0,0,0,42.88,77.766V45.526a67.6,67.6,0,0,0,15.9-8.5v32.24a67.135,67.135,0,0,0,11.906,3.909,101.053,101.053,0,0,0,15.455-5.062,68.12,68.12,0,0,1-13.414,10.441q3.177,5.691,6.923,11.09a106.56,106.56,0,0,0,32.625-24.666,110.9,110.9,0,0,0,10.389-13.231,770,770,0,0,0-122.88-37.39Z" />
              </svg>
              Se connecter avec Discord
            </Button>

            <p className="text-gray-500 text-sm mt-6">
              Vos données resteront privées et sécurisées ✨
            </p>
          </motion.div>
        ) : (
          // Connecté
          <div className="space-y-6">
            {/* User Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-xl p-8 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  {user.avatar && (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                      alt={user.username}
                      className="w-16 h-16 rounded-full border-2 border-purple-400"
                    />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {user.username}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      {user.email || 'Discord User'}
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
                  Déconnexion
                </Button>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/20 rounded-lg p-6 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Heart size={20} className="text-red-400" />
                  <span className="text-gray-400 text-sm">Animes</span>
                </div>
                <p className="text-3xl font-bold text-white">{animeList.length}</p>
              </div>

              <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-500/20 rounded-lg p-6 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Clock size={20} className="text-green-400" />
                  <span className="text-gray-400 text-sm">Episodes</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {stats.totalEpisodes}
                </p>
              </div>

              <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border border-yellow-500/20 rounded-lg p-6 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles size={20} className="text-yellow-400" />
                  <span className="text-gray-400 text-sm">Rating moyen</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {stats.averageRating.toFixed(1)}/10
                </p>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Button
                onClick={generateListImage}
                disabled={sharing || animeList.length === 0}
                className="gap-3 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-bold transition-all"
              >
                <Share2 size={20} />
                {sharing ? 'Génération...' : 'Partager ma liste'}
              </Button>

              <Button
                variant="outline"
                className="gap-3 py-6 border-purple-500/30 text-white hover:bg-purple-500/10"
              >
                <Settings size={20} />
                Paramètres
              </Button>
            </motion.div>

            {/* Top Animes */}
            {animeList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/30 rounded-xl p-6 backdrop-blur-xl"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Heart size={20} className="text-red-400" />
                  Top 5 de votre liste
                </h3>

                <div className="space-y-3">
                  {animeList.slice(0, 5).map((anime, idx) => (
                    <div
                      key={anime.mal_id}
                      className="flex items-start gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
                    >
                      <span className="text-2xl font-bold text-purple-400 w-8">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold group-hover:text-purple-300 transition-colors truncate">
                          {anime.title}
                        </p>
                        <p className="text-gray-400 text-sm">
                          ⭐ {anime.score}/10
                        </p>
                      </div>
                    </div>
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
