import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const AuthSuccessPage = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    const handleAuth = async () => {
      await checkAuth();
      setTimeout(() => {
        navigate('/');
      }, 1500);
    };

    handleAuth();
  }, [checkAuth, navigate]);

  return (
    <div className="page-container flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-16 h-16 rounded-2xl bg-rating-green/10 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-rating-green" />
      </div>
      <h2 className="text-lg font-bold text-foreground mb-2">Connexion réussie !</h2>
      <p className="text-muted-foreground text-sm">Redirection en cours...</p>
    </div>
  );
};

export default AuthSuccessPage;
