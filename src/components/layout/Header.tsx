import { Link } from 'react-router-dom';
import { Tv, Search, LogIn, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { discordAuthService } from '@/services/discordAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect } from 'react';

export const Header = () => {
  const { user, isAuthenticated, checkAuth, logout } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogin = async () => {
    try {
      const authUrl = await discordAuthService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('Login error:', error);
      alert(error.message || 'Impossible de se connecter. Vérifiez que le backend est lancé sur le port 3001.');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const avatarUrl = user
    ? discordAuthService.getAvatarUrl(user.id, user.avatar)
    : null;

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50 md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Tv className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-display font-bold text-foreground">
            Otaku<span className="text-primary">DB</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-2">
          <Link 
            to="/search" 
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-5 h-5" />
          </Link>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-xl overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={avatarUrl || undefined} alt={user.username} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Mon profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={handleLogin}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
              aria-label="Se connecter avec Discord"
            >
              <LogIn className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
