import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { useEffect } from "react";
import ErrorBoundary from "./ErrorBoundary";
import { useAuthStore } from "./stores/authStore";
import { useAnimeListDiscordStore } from "./stores/animeListStoreDiscord";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import ListsPage from "./pages/ListsPage";
import AnimeDetailPage from "./pages/AnimeDetailPage";
import StatsPage from "./pages/StatsPage";
import ProfilePage from "./pages/ProfilePage";
import DiscoverPage from "./pages/DiscoverPage";
import AuthSuccessPage from "./pages/AuthSuccessPage";
import AuthErrorPage from "./pages/AuthErrorPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Register service worker
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('✅ Service Worker registered');
    } catch (error) {
      console.log('⚠️ Service Worker registration failed:', error);
    }
  }
};

const App = () => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { syncFromBackend } = useAnimeListDiscordStore();

  // Initialiser l'authentification et la synchronisation
  useEffect(() => {
    const initialize = async () => {
      console.log('🚀 Initializing OtakuDB...');
      
      // Vérifier l'authentification
      await checkAuth();
    };

    initialize();
  }, [checkAuth]);

  // Synchroniser la liste d'animes quand l'utilisateur se connecte
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 User authenticated, syncing anime list...');
      syncFromBackend().catch(error => {
        console.error('❌ Sync error:', error);
      });
    }
  }, [isAuthenticated, syncFromBackend]);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <Sonner />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/lists" element={<ListsPage />} />
              <Route path="/anime/:id" element={<AnimeDetailPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/auth/success" element={<AuthSuccessPage />} />
              <Route path="/auth/error" element={<AuthErrorPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;