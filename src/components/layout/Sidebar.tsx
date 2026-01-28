import { Link, useLocation } from 'react-router-dom';
import { Home, List, Search, BarChart3, User, Tv, Compass, LogIn, LogOut } from 'lucide-react';
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

const navItems = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/discover', icon: Compass, label: 'Découvrir' },
  { path: '/lists', icon: List, label: 'Mes Listes' },
  { path: '/search', icon: Search, label: 'Recherche' },
  { path: '/stats', icon: BarChart3, label: 'Statistiques' },
  { path: '/profile', icon: User, label: 'Profil' },
];

export const Sidebar = () => {
  const location = useLocation();
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
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Tv className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-display font-bold text-foreground">
            Otaku<span className="text-primary">DB</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={avatarUrl || undefined} alt={user.username} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{user.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
            className="w-full flex items-center gap-3 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            <span className="text-sm font-medium">Se connecter avec Discord</span>
          </button>
        )}
        <p className="text-xs text-muted-foreground text-center mt-3">
          Données via Jikan API
        </p>
      </div>
    </aside>
  );
};
