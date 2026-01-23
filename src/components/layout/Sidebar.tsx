import { Link, useLocation } from 'react-router-dom';
import { Home, List, Search, BarChart3, User, Tv, Compass } from 'lucide-react';

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

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Données via Jikan API
        </p>
      </div>
    </aside>
  );
};
