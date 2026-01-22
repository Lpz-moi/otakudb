import { Link, useLocation } from 'react-router-dom';
import { Home, List, Search, Sparkles, User } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/discover', icon: Sparkles, label: 'Découvrir' },
  { path: '/lists', icon: List, label: 'Listes' },
  { path: '/search', icon: Search, label: 'Chercher' },
  { path: '/profile', icon: User, label: 'Profil' },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border md:hidden safe-area-pb">
      <div className="flex items-center justify-around py-1.5 px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors touch-target ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_6px_hsl(var(--primary))]' : ''}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
