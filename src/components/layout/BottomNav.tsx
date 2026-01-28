import { Link, useLocation } from 'react-router-dom';
import { Home, List, Search, Compass, User } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/discover', icon: Compass, label: 'Découvrir' },
  { path: '/lists', icon: List, label: 'Listes' },
  { path: '/search', icon: Search, label: 'Chercher' },
  { path: '/profile', icon: User, label: 'Profil' },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-lg border-t border-border/50 md:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
