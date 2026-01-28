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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-t border-border/30 md:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all rounded-xl mx-0.5 ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground active:scale-95'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_hsl(var(--primary))]' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-primary' : ''}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
