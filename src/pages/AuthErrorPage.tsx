import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const AuthErrorPage = () => {
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') || 'Une erreur est survenue';

  return (
    <div className="page-container flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-lg font-bold text-foreground mb-2">Erreur de connexion</h2>
      <p className="text-muted-foreground text-sm mb-6 text-center max-w-xs">
        {message === 'invalid_state' 
          ? 'La session a expiré. Veuillez réessayer.'
          : message}
      </p>
      <Link to="/" className="btn-primary">
        Retour à l'accueil
      </Link>
    </div>
  );
};

export default AuthErrorPage;
